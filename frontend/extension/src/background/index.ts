/// <reference types="chrome"/>

import { Transaction } from '@solana/web3.js';
import { parseTransaction } from '../lib/solana/transaction-parser';
import ApiService from '../services/api-service';
import AuthService from '../services/auth-service';

// Background Service Worker for MV3
console.log('🟡 Vetra background service worker initialized');

// Initialize services (singletons)
const apiService = ApiService.getInstance();
const authService = AuthService.getInstance();

// Load auth token on startup
async function initializeServices() {
  try {
    // Espera o AuthService carregar os dados do storage
    await authService.waitForInitialization();

    const authState = authService.getAuthState();
    if (authState?.token) {
      apiService.setAuthToken(authState.token);
      console.log('✅ Auth token loaded into API service');
    } else {
      console.log('ℹ️ No auth token found');
    }
  } catch (e) {
    console.warn('⚠️ initializeServices failed:', e);
  }
}

initializeServices();

// Reforço: em alguns cenários o SW é reciclado
chrome.runtime.onStartup?.addListener(() => {
  console.log('🔁 onStartup → reinitializing services');
  initializeServices();
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  // console.debug('Background received message:', message?.type);

  if (message?.type === 'ANALYZE_TRANSACTION') {
    handleTransactionAnalysis(message.payload)
      .then(sendResponse)
      .catch((error) => {
        console.error('❌ Error analyzing transaction:', error);
        sendResponse({
          success: false,
          error: error?.message || String(error),
        });
      });
    return true; // Keep channel open (async)
  }

  if (message?.type === 'GET_ATTESTATIONS') {
    handleGetAttestations(message.payload)
      .then(sendResponse)
      .catch((error) => {
        console.error('❌ Error fetching attestations:', error);
        sendResponse({
          success: false,
          error: error?.message || String(error),
          attestations: [],
        });
      });
    return true; // Keep channel open (async)
  }

  return false;
});

/**
 * Handle transaction analysis
 */
async function handleTransactionAnalysis(payload: any) {
  try {
    console.log('🔍 Analyzing transaction payload:', payload);

    // Rebuild Transaction (tolerante a diferentes formatos)
    const transaction = reconstructTransaction(payload?.transaction);
    let parsedTx: any = {};
    try {
      parsedTx = parseTransaction(transaction);
    } catch (e) {
      console.warn('⚠️ parseTransaction failed, using minimal parsedTx:', e);
      parsedTx = {
        signature: undefined,
        type: 'unknown',
        fromAddress: undefined,
        toAddress: undefined,
        amount: undefined,
        tokenAddress: undefined,
        instructions: transaction?.instructions ?? [],
      };
    }

    console.log('📊 Parsed transaction:', parsedTx);

    // Dados mínimos para o backend
    const transactionData = {
      signature: parsedTx.signature,
      type: parsedTx.type,
      from: parsedTx.fromAddress || 'Unknown',
      to: parsedTx.toAddress || 'Unknown',
      amount: parsedTx.amount || '0',
      token: parsedTx.tokenAddress,
      timestamp: Date.now(),
      instructions: parsedTx.instructions,
    };

    // Auth awareness (não bloqueia o fluxo)
    const authState = authService.getAuthState();
    if (!authState?.isAuthenticated) {
      console.warn('⚠️ User not authenticated, analysis will not be saved');
    } else {
      console.log('✅ User authenticated, sending to backend');
    }

    // Chama backend (pode cachear/armazenar se autenticado)
    const analysisResponse = await apiService.analyzeTransaction(transactionData);

    const analysis = analysisResponse?.analysis ?? {};
    const result = {
      success: true,
      riskScore: analysis.score ?? 50,
      riskLevel: analysis.level ?? 'unknown',
      reasons: analysis.reasons ?? [],
      heuristics: analysis.heuristics ?? [],
      recommendations: analysis.recommendations ?? [],
      confidence: analysis.confidence ?? 0.5,
      transaction: analysisResponse?.transaction ?? null,
      cached: analysisResponse?.cached ?? false,
      parsedTransaction: parsedTx,
    };

    // Se for alto risco, tentar abrir popup (best-effort)
    if (result.riskLevel === 'high') {
      console.log('⚠️ HIGH RISK detected! Attempting to open popup…');
      try {
        await chrome.action.openPopup();
      } catch (error) {
        console.warn('⚠️ Could not open popup automatically:', error);
      }
    }

    return result;
  } catch (error: any) {
    console.error('❌ Error in transaction analysis:', error);
    // Resposta segura
    return {
      success: false,
      error: error?.message || String(error),
      riskScore: 50,
      riskLevel: 'medium',
      reasons: ['Unable to analyze transaction'],
    };
  }
}

/**
 * Handle attestation fetching
 */
async function handleGetAttestations(payload: any) {
  try {
    const { transactionHash } = payload || {};
    if (!transactionHash) throw new Error('Transaction hash is required');

    const response = await apiService.getAttestations(transactionHash);
    return {
      success: true,
      attestations: response?.attestations ?? [],
    };
  } catch (error: any) {
    console.error('❌ Error fetching attestations:', error);
    return {
      success: false,
      error: error?.message || String(error),
      attestations: [],
    };
  }
}

function base64ToBytes(b64: string): Uint8Array {
  // atob está disponível no SW MV3
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/**
 * Reconstruct a Transaction object from serialized data
 */
function reconstructTransaction(transactionData: any): Transaction {
  try {
    // Já é Transaction?
    if (transactionData instanceof Transaction) return transactionData;

    // base64 string
    if (typeof transactionData === 'string') {
      return Transaction.from(base64ToBytes(transactionData));
    }

    // { serialized: base64 }
    if (transactionData?.serialized) {
      return Transaction.from(base64ToBytes(transactionData.serialized));
    }

    // Uint8Array / ArrayBuffer-like
    if (transactionData instanceof Uint8Array) {
      return Transaction.from(transactionData);
    }
    if (transactionData?.type === 'Buffer' && Array.isArray(transactionData?.data)) {
      return Transaction.from(Uint8Array.from(transactionData.data));
    }

    // Objeto "solto"
    const tx = new Transaction();
    if (transactionData?.instructions) {
      (tx as any).instructions = transactionData.instructions;
    }
    if (transactionData?.recentBlockhash) {
      (tx as any).recentBlockhash = transactionData.recentBlockhash;
    }
    if (transactionData?.feePayer) {
      (tx as any).feePayer = transactionData.feePayer;
    }
    return tx;
  } catch (error) {
    console.error('❌ Error reconstructing transaction:', error);
    return new Transaction(); // fallback seguro
  }
}


// Install/Update hooks
chrome.runtime.onInstalled.addListener((details) => {
  console.log('🧩 Vetra extension installed/updated:', details?.reason);
});

// background/index.ts
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === 'INJECT_PAGE_SCRIPT' && sender.tab?.id) {
    chrome.scripting.executeScript({
      target: { tabId: sender.tab.id },
      files: ['injected.js'],
      world: 'MAIN', // roda no contexto da página; não sofre CSP
    }).then(() => sendResponse({ ok: true }))
      .catch((e) => sendResponse({ ok: false, error: String(e) }));
    return true;
  }
});

export {};