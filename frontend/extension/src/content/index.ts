/// <reference types="chrome"/>

// Content Script - Runs in the context of web pages
console.log('🟢 Vetra content script loaded');
console.log('📍 URL:', window.location.href);

// Inject our script into the page context
const script = document.createElement('script');
script.src = chrome.runtime.getURL('injected.js');
script.onload = function () {
  console.log('✅ Injected script loaded successfully');
  // @ts-ignore
  this.remove();
};
script.onerror = function() {
  console.error('❌ Failed to load injected script');
};
(document.head || document.documentElement).appendChild(script);
console.log('📝 Injected script element added to page');

// Listen for messages from injected script
window.addEventListener('message', async (event) => {
  // Only accept messages from same window
  if (event.source !== window) return;

  const message = event.data;
  
  if (message.type === 'VETRA_TRANSACTION_REQUEST') {
    console.log('🔒 VETRA: Transaction intercepted on Solana Mainnet');
    console.log('🌐 URL:', message.payload.url);
    console.log('🔧 Method:', message.payload.method);
    console.log('📦 Transaction:', message.payload.transaction);

    try {
      // Send to background for analysis
      const response = await chrome.runtime.sendMessage({
        type: 'ANALYZE_TRANSACTION',
        payload: message.payload,
      });

      console.log('✅ Analysis complete:', response);

      // Send response back to injected script
      window.postMessage(
        {
          type: 'VETRA_TRANSACTION_RESPONSE',
          id: message.id,
          response,
        },
        '*'
      );
    } catch (error) {
      console.error('❌ Error analyzing transaction:', error);
      
      // Send error response
      window.postMessage(
        {
          type: 'VETRA_TRANSACTION_RESPONSE',
          id: message.id,
          response: {
            success: false,
            error: 'Analysis failed',
            approved: true, // Default to allowing on error
          },
        },
        '*'
      );
    }
  }
});

export {};

