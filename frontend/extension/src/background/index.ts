/// <reference types="chrome"/>

import { Transaction } from '@solana/web3.js';
import { parseTransaction } from '../lib/solana/transaction-parser';
import ApiService from '../services/api-service';
import AuthService from '../services/auth-service';

// Background Service Worker for MV3
console.log('Vetra background service worker initialized');

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
 * Handle transaction analysis
 */
async function handleTransactionAnalysis(payload: any) {
  try {
    console.log('🔍 Analyzing transaction:', payload);
    
    // Parse the transaction from the payload
    const transaction = reconstructTransaction(payload.transaction);
    const parsedTx = parseTransaction(transaction);
    
    console.log('📊 Parsed transaction:', parsedTx);
    
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
    };
    
    // Se for alto risco, abre o popup automaticamente
    if (analysisResponse.analysis.level === 'high') {
      console.log('⚠️ HIGH RISK detected! Opening popup...');
      try {
        await chrome.action.openPopup();
      } catch (error) {
        console.warn('Could not open popup automatically:', error);
      }
    }
    
    return result;
  } catch (error: any) {
    console.error('❌ Error in transaction analysis:', error);
    
    // Return a safe default response
    return {
      success: false,
      error: error.message,
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
    
    // Try to deserialize if it's serialized
    if (typeof transactionData === 'string') {
      return Transaction.from(Buffer.from(transactionData, 'base64'));
    }
    
    // If it has serialized data
    if (transactionData.serialized) {
      return Transaction.from(Buffer.from(transactionData.serialized, 'base64'));
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

