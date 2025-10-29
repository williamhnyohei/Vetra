/// <reference types="chrome"/>

// Content Script - Runs in the context of web pages
console.log('🟢 Vetra content script loaded');
console.log('📍 URL:', window.location.href);

// Inject our script into the page context
const script = document.createElement('script');
// use the built artifact path for the injected script
script.src = chrome.runtime.getURL('injected.js');
script.onload = function () {
  // @ts-ignore
  this.remove?.();
  console.log('✅ Injected script loaded successfully');
};
script.onerror = function () {
  console.error('❌ Failed to load injected script');
};
(document.head || document.documentElement).appendChild(script);
console.log('📝 Injected script element added to page');

// ===== Bridge: CONNECT (popup/background -> content -> injected) =====
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === 'VETRA_CONNECT') {
    // unique correlation id
    const id =
      (crypto as any)?.randomUUID?.() ||
      Math.random().toString(36).slice(2);

    const handler = (ev: MessageEvent) => {
      const data = ev.data || {};
      if (data?.type === 'VETRA_CONNECT_RES' && data.id === id) {
        window.removeEventListener('message', handler);
        sendResponse(data); // { ok: boolean, publicKey?: string, error?: string }
      }
    };

    window.addEventListener('message', handler);
    window.postMessage({ type: 'VETRA_CONNECT', id }, '*');

    // keep the channel open for async sendResponse
    return true;
  }
});

// ===== Bridge: TRANSACTION ANALYSIS (injected -> content -> background) =====
window.addEventListener('message', async (event) => {
  // Only accept messages from same window
  if (event.source !== window) return;

  const message = event.data;

  if (message?.type === 'VETRA_TRANSACTION_REQUEST') {
    console.log('🧪 Intercepted transaction:', message.payload);

    // Send to background for analysis (MVP: stub approves)
    const response = await chrome.runtime.sendMessage({
      type: 'ANALYZE_TRANSACTION',
      payload: message.payload,
    });

    // Send response back to injected script
    window.postMessage(
      {
        type: 'VETRA_TRANSACTION_RESPONSE',
        id: message.id,
        response,
      },
      '*'
    );
  }
});

chrome.runtime.sendMessage({ type: 'INJECT_PAGE_SCRIPT' }, (res) => {
  if (!res?.ok) console.error('❌ Failed to inject via scripting:', res?.error);
  else console.log('✅ Injected via chrome.scripting');
});

export {};