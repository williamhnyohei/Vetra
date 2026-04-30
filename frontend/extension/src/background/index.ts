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

async function notifyHighRisk(result: {
  riskLevel?: string;
  riskScore?: number;
  reasons?: string[];
}): Promise<void> {
  const payload = {
    title: 'Vetra: alto risco detectado',
    riskLevel: result.riskLevel,
    riskScore: result.riskScore,
    reasons: Array.isArray(result.reasons) ? result.reasons.slice(0, 8) : [],
    ts: Date.now(),
  };

  try {
    await chrome.storage.session.set({ vetraPendingAlert: payload });
  } catch (e) {
    console.warn('⚠️ vetraPendingAlert session write failed:', e);
  }

  try {
    await chrome.windows.create({
      url: chrome.runtime.getURL('alert.html'),
      type: 'popup',
      width: 440,
      height: 380,
      focused: true,
    });
    return;
  } catch (e) {
    console.warn('⚠️ windows.create for alert failed:', e);
  }

  try {
    await chrome.notifications.create('vetra-high-risk', {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon-128.png'),
      title: 'Vetra — alto risco',
      message:
        (payload.reasons && payload.reasons[0]) ||
        'Revise a transação antes de assinar.',
    });
  } catch (e) {
    console.warn('⚠️ notifications.create failed:', e);
  }
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'INJECT_PAGE_SCRIPT' && sender.tab?.id) {
    chrome.scripting
      .executeScript({
        target: { tabId: sender.tab.id },
        files: ['injected.js'],
        world: 'MAIN',
      })
      .then(() => sendResponse({ ok: true }))
      .catch((e) => sendResponse({ ok: false, error: String(e) }));
    return true;
  }

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
    return true;
  }

  if (message?.type === 'ANALYZE_RPC_TRANSACTION') {
    console.log('🔥 Background: RPC transaction received, analyzing...');
    handleRPCTransactionAnalysis(message.payload)
      .then(sendResponse)
      .catch((error) => {
        console.error('❌ Error analyzing RPC transaction:', error);
        sendResponse({
          success: false,
          error: error?.message || String(error),
        });
      });
    return true;
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
    return true;
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

    if (result.riskLevel === 'high') {
      console.log('⚠️ HIGH RISK detected! Attempting to open popup…');
      try {
        await chrome.action.openPopup();
      } catch (error) {
        console.warn('⚠️ Could not open popup automatically:', error);
        await notifyHighRisk({
          riskLevel: result.riskLevel,
          riskScore: result.riskScore,
          reasons: result.reasons,
        });
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
 * Handle RPC transaction analysis (network level interception)
 */
async function handleRPCTransactionAnalysis(payload: any) {
  try {
    console.log('🔥 Analyzing RPC transaction...', payload);

    const { url, method, params, body } = payload || {};
    
    // Extract transaction data from RPC params
    // Solana sendTransaction format: ["base64_transaction", {encoding: "base64"}]
    const transactionData = {
      signature: undefined,
      type: 'rpc_send', // Special type for RPC-level detection
      from: 'Unknown', // Will be extracted from transaction if possible
      to: 'Unknown',
      amount: '0',
      token: undefined,
      timestamp: Date.now(),
      rpcMethod: method,
      rpcUrl: url,
      rpcParams: params,
    };

    console.log('📊 Extracted transaction data:', transactionData);

    // Call backend for analysis
    const authState = authService.getAuthState();
    if (!authState?.isAuthenticated) {
      console.warn('⚠️ User not authenticated, RPC analysis will not be saved');
    }

    const analysisResponse = await apiService.analyzeTransaction(transactionData);

    console.log('✅ RPC transaction analyzed:', analysisResponse);

    const level = analysisResponse?.analysis?.level;
    const score = analysisResponse?.analysis?.score;
    const reasons = analysisResponse?.analysis?.reasons;

    if (level === 'high') {
      try {
        await chrome.action.openPopup();
      } catch {
        await notifyHighRisk({
          riskLevel: level,
          riskScore: score,
          reasons,
        });
      }
    }

    return {
      success: true,
      analysis: analysisResponse?.analysis,
      riskLevel: level,
      riskScore: score,
    };

  } catch (error: any) {
    console.error('❌ Error analyzing RPC transaction:', error);
    return {
      success: false,
      error: error?.message || String(error),
      riskLevel: 'unknown',
      riskScore: 50,
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

export {};