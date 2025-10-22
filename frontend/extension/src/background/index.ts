/// <reference types="chrome"/>

// Background Service Worker for MV3
console.log('Vetra background service worker initialized');

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);

  if (message.type === 'ANALYZE_TRANSACTION') {
    // TODO: Implement transaction analysis
    const mockRiskScore = Math.floor(Math.random() * 100);
    
    sendResponse({
      success: true,
      riskScore: mockRiskScore,
      reasons: ['Unknown token', 'High transaction amount'],
    });
  }

  if (message.type === 'GET_ATTESTATIONS') {
    // TODO: Fetch on-chain attestations
    sendResponse({
      success: true,
      attestations: [],
    });
  }

  return true; // Keep message channel open for async response
});

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Vetra extension installed');
});

export {};

