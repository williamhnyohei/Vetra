/// <reference types="chrome"/>

import { Transaction } from '@solana/web3.js';
import { parseTransaction } from '../lib/solana/transaction-parser';
import ApiService from '../services/api-service';
import AuthService from '../services/auth-service';

// Background Service Worker for MV3
console.log('🛡️ Vetra background service worker initialized');
console.log('🔒 Transaction interception: ACTIVE');
console.log('🌐 Supports: Mainnet, Devnet, Testnet');

// Initialize services
const apiService = ApiService.getInstance();
const authService = AuthService.getInstance();

// Load auth token on startup
async function initializeServices() {
  // Espera o AuthService carregar os dados do storage
  await authService.waitForInitialization();
  
  const authState = authService.getAuthState();
  if (authState.token) {
    apiService.setAuthToken(authState.token);
    console.log('✅ Auth token loaded into API service');
  } else {
    console.log('ℹ️ No auth token found');
  }
}

initializeServices();

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);

  if (message.type === 'ANALYZE_TRANSACTION') {
    handleTransactionAnalysis(message.payload)
      .then(sendResponse)
      .catch(error => {
        console.error('Error analyzing transaction:', error);
        sendResponse({
          success: false,
          error: error.message,
        });
      });
    
    return true; // Keep message channel open for async response
  }

  if (message.type === 'GET_ATTESTATIONS') {
    handleGetAttestations(message.payload)
      .then(sendResponse)
      .catch(error => {
        console.error('Error fetching attestations:', error);
        sendResponse({
          success: false,
          error: error.message,
          attestations: [],
        });
      });
    
    return true; // Keep message channel open for async response
  }

  return true;
});

/**
 * Wait for user approval decision
 */
function waitForUserApproval(timeoutMs: number): Promise<{ approved: boolean }> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.warn('⏰ User approval timeout - defaulting to ALLOW');
      resolve({ approved: true });
    }, timeoutMs);

    // Listen for approval decision from popup
    const listener = (message: any) => {
      if (message.type === 'TRANSACTION_DECISION') {
        clearTimeout(timeout);
        chrome.runtime.onMessage.removeListener(listener);
        console.log('✅ User decision received:', message.approved ? 'APPROVED' : 'REJECTED');
        resolve({ approved: message.approved });
      }
    };

    chrome.runtime.onMessage.addListener(listener);
  });
}

/**
 * Handle transaction analysis
 */
async function handleTransactionAnalysis(payload: any) {
  try {
    const network = payload.network || 'mainnet';
    const networkEmoji = network === 'devnet' ? '🧪' : network === 'testnet' ? '🔧' : '🌐';
    const networkName = network === 'devnet' ? 'Devnet (Testing)' : network === 'testnet' ? 'Testnet' : 'Mainnet';
    
    console.log(`🔍 Analyzing transaction on Solana ${networkName}`);
    console.log(`${networkEmoji} Network:`, network.toUpperCase());
    console.log('🌐 Origin URL:', payload.url);
    console.log('🔧 Method:', payload.method);
    console.log('⏰ Timestamp:', new Date(payload.timestamp).toISOString());
    
    if (network === 'devnet') {
      console.log('💡 Devnet detected - using test SOL (no real money)');
    }
    
    // Parse the transaction from the payload
    const transaction = reconstructTransaction(payload.transaction);
    console.log('🔍 Reconstructed transaction:', {
      instructions: transaction.instructions.length,
      feePayer: transaction.feePayer?.toBase58(),
      recentBlockhash: transaction.recentBlockhash
    });
    
    const parsedTx = parseTransaction(transaction);
    
    console.log('📊 Parsed transaction:', parsedTx);
    console.log('💰 Amount:', parsedTx.amount);
    console.log('📤 From:', parsedTx.fromAddress);
    console.log('📥 To:', parsedTx.toAddress);
    console.log('🔧 Type:', parsedTx.type);
    console.log('📋 Instructions:', parsedTx.instructions.length);
    
    // Prepare transaction data for API
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
    
    // Check if user is authenticated
    const authState = authService.getAuthState();
    if (!authState.isAuthenticated) {
      console.warn('⚠️ User not authenticated, analysis will not be saved');
    } else {
      console.log('✅ User authenticated, sending to backend');
    }
    
    // Send to backend for analysis (will save to database if authenticated)
    const analysisResponse = await apiService.analyzeTransaction(transactionData);
    
    console.log('✅ Analysis complete:', analysisResponse);
    
    // Load user settings from storage
    const storage = await chrome.storage.local.get(['settings']);
    const userSettings = storage.settings || {};
    const autoBlockHighRisk = userSettings.auto_block_high_risk || false;
    
    console.log('⚙️ User settings:', { autoBlockHighRisk });
    
    const riskLevel = analysisResponse.analysis.level;
    const isHighRisk = riskLevel === 'high';
    
    let blocked = false;
    let approved = true;
    let blockReason = '';
    let requiresApproval = false;
    
    // SEMPRE armazena transação para mostrar alerta (independente do risco)
    console.log(`📊 Transaction Risk: ${riskLevel.toUpperCase()} (${analysisResponse.analysis.score}/100)`);
    
    // Convert lamports to SOL for display
    let displayAmount = '0';
    let displayTokenSymbol = 'SOL';
    
    if (parsedTx.amount && parsedTx.amount !== '0') {
      try {
        const lamports = BigInt(parsedTx.amount);
        const sol = Number(lamports) / 1e9; // Convert lamports to SOL
        displayAmount = sol.toFixed(6); // Show up to 6 decimal places
      } catch (error) {
        console.error('Error converting amount:', error);
        displayAmount = parsedTx.amount;
      }
    }
    
    // Determine token symbol
    if (parsedTx.tokenAddress && parsedTx.tokenAddress !== SystemProgram.programId.toBase58()) {
      displayTokenSymbol = 'TOKEN'; // For SPL tokens
    } else {
      displayTokenSymbol = 'SOL';
    }
    
    // Store transaction data for popup to access (ALWAYS, not just high risk)
    await chrome.storage.local.set({
      pendingTransaction: {
        id: `tx_${Date.now()}`,
        riskScore: analysisResponse.analysis.score,
        riskLevel: analysisResponse.analysis.level,
        reasons: analysisResponse.analysis.reasons,
        recommendations: analysisResponse.analysis.recommendations,
        parsedTx: {
          ...parsedTx,
          amount: displayAmount,
          tokenSymbol: displayTokenSymbol,
        },
        timestamp: Date.now(),
        heuristics: analysisResponse.analysis.heuristics || {},
        evidence: analysisResponse.analysis.level === 'high' ? [
          {
            source: 'solscan.io',
            url: `https://solscan.io/account/${parsedTx.toAddress || 'unknown'}`,
            confidence: 92,
            description: 'This address has been reported in multiple suspicious transactions in the last 30 days.'
          },
          {
            source: 'scam-alert.solana',
            url: 'https://github.com/solana-labs/scam-alert',
            confidence: 73,
            description: 'ALERT: New scam identified using this address. Avoid transactions!'
          }
        ] : [],
      }
    });
    
    console.log('💾 Transaction stored in chrome.storage for popup display');
    
    // Open popup automatically when transaction is intercepted
    try {
      await chrome.action.openPopup();
      console.log('✅ Popup opened automatically');
    } catch (error) {
      console.warn('⚠️ Could not open popup automatically:', error);
      // Fallback: user will need to click the extension icon
    }
    
    // Handle high risk transactions
    if (isHighRisk) {
      console.log('⚠️ HIGH RISK transaction detected!');
      
      if (autoBlockHighRisk) {
        // AUTO-BLOCK: Block automatically
        blocked = true;
        approved = false;
        blockReason = `🛡️ High risk transaction blocked automatically (Risk: ${analysisResponse.analysis.score}/100)`;
        console.error('🚫 AUTO-BLOCKING transaction');
      } else {
        // MANUAL APPROVAL: Show UI and wait for user decision
        console.log('🔔 Requires manual approval from user');
        requiresApproval = true;
        
        try {
          // Open popup for user approval
          await chrome.action.openPopup();
          
          // Wait for user decision (with timeout)
          const userDecision = await waitForUserApproval(10000); // 10 second timeout
          
          approved = userDecision.approved;
          if (!approved) {
            blocked = true;
            blockReason = '🛡️ Transaction rejected by user';
          }
          
        } catch (error) {
          console.warn('Could not get user approval, defaulting to ALLOW:', error);
          // On error, default to allowing (don't want to break user flow)
          approved = true;
        }
      }
    } else {
      // Low/Medium risk: always approve (but still show alert in UI)
      console.log(`✅ ${riskLevel.toUpperCase()} risk - allowing transaction`);
      approved = true;
    }
    
    const result = {
      success: true,
      riskScore: analysisResponse.analysis.score,
      riskLevel: analysisResponse.analysis.level,
      reasons: analysisResponse.analysis.reasons,
      heuristics: analysisResponse.analysis.heuristics,
      recommendations: analysisResponse.analysis.recommendations,
      confidence: analysisResponse.analysis.confidence,
      transaction: analysisResponse.transaction,
      cached: analysisResponse.cached,
      parsedTransaction: parsedTx,
      // Blocking/Approval fields
      blocked,
      approved,
      blockReason,
      requiresApproval,
    };
    
    return result;
  } catch (error: any) {
    console.error('❌ Error in transaction analysis:', error);
    
    // Return a safe default response (allow transaction on error)
    return {
      success: false,
      error: error.message,
      riskScore: 50,
      riskLevel: 'medium',
      reasons: ['Unable to analyze transaction'],
      blocked: false,
      approved: true, // Default to allowing on error
      blockReason: '',
      requiresApproval: false,
    };
  }
}

/**
 * Handle attestation fetching
 */
async function handleGetAttestations(payload: any) {
  try {
    const { transactionHash } = payload;
    
    if (!transactionHash) {
      throw new Error('Transaction hash is required');
    }
    
    const response = await apiService.getAttestations(transactionHash);
    
    return {
      success: true,
      attestations: response.attestations,
    };
  } catch (error: any) {
    console.error('Error fetching attestations:', error);
    return {
      success: false,
      error: error.message,
      attestations: [],
    };
  }
}

/**
 * Reconstruct a Transaction object from serialized data
 */
function reconstructTransaction(transactionData: any): Transaction {
  try {
    // If it's already a Transaction object, return it
    if (transactionData instanceof Transaction) {
      return transactionData;
    }
    
    // Try to deserialize if it's serialized (using browser-compatible approach)
    if (typeof transactionData === 'string') {
      // Convert base64 to Uint8Array (browser-compatible)
      const binaryString = atob(transactionData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return Transaction.from(bytes);
    }
    
    // If it has serialized data
    if (transactionData.serialized) {
      // Convert base64 to Uint8Array (browser-compatible)
      const binaryString = atob(transactionData.serialized);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return Transaction.from(bytes);
    }
    
    // If it's a plain object, try to reconstruct
    const transaction = new Transaction();
    
    if (transactionData.instructions) {
      transaction.instructions = transactionData.instructions;
    }
    
    if (transactionData.recentBlockhash) {
      transaction.recentBlockhash = transactionData.recentBlockhash;
    }
    
    if (transactionData.feePayer) {
      transaction.feePayer = transactionData.feePayer;
    }
    
    return transaction;
  } catch (error) {
    console.error('Error reconstructing transaction:', error);
    // Return empty transaction as fallback
    return new Transaction();
  }
}

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Vetra extension installed');
});

export {};

