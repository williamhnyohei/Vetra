/// <reference types="chrome"/>

// Content Script — roda em todas as páginas
console.log('🟢 Vetra content script loaded at', window.location.href);

// ✅ FIX: Verificar se é uma página válida antes de injetar
const isValidPage = (): boolean => {
  const url = window.location.href;
  const invalidPrefixes = [
    'chrome://',
    'chrome-extension://',
    'about:',
    'edge://',
    'brave://',
    'moz-extension://'
  ];
  
  for (const prefix of invalidPrefixes) {
    if (url.startsWith(prefix)) {
      console.log('⏭️ Vetra: Skipping injection on system page:', prefix);
      return false;
    }
  }
  
  return true;
};

// Only inject on valid web pages
if (!isValidPage()) {
  console.log('⏭️ Vetra: Content script loaded but not injecting (system page)');
} else {
  // 1) pede pro background injetar o script no contexto da página
  chrome.runtime.sendMessage({ type: 'INJECT_PAGE_SCRIPT' }, (res) => {
    if (!res?.ok) {
      console.error('❌ Failed to inject via scripting:', res?.error);
    } else {
      console.log('✅ Injected via chrome.scripting');
    }
  });
}

// 2) Bridge: POPUP → CONTENT → INJECTED (conectar carteira)
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  // aceitamos os dois tipos que você já usou no popup
  if (msg?.type === 'VETRA_CONNECT' || msg?.type === 'VETRA_CONNECT_WALLET') {
    // pode vir do popup como {payload: {provider: 'phantom' | 'backpack' | 'solflare' | 'auto'}}
    const provider =
      (msg?.payload?.provider as
        | 'phantom'
        | 'backpack'
        | 'solflare'
        | 'auto'
        | undefined) || 'auto';

    // id pra parear req/res
    const id =
      (crypto as any)?.randomUUID?.() ||
      Math.random().toString(36).slice(2);

    const handler = (ev: MessageEvent) => {
      const data = ev.data || {};
      if (data?.type === 'VETRA_CONNECT_RES' && data.id === id) {
        window.removeEventListener('message', handler);
        // devolve pro popup exatamente o que o injected mandou
        sendResponse(data);
      }
    };

    window.addEventListener('message', handler);

    // manda pro contexto da página (injected.js vai ouvir isso)
    window.postMessage(
      {
        type: 'VETRA_CONNECT',
        id,
        provider,
      },
      '*'
    );

    // importante: manter o canal aberto pq a resposta vem depois
    return true;
  }
});

// 3) Bridge: INJECTED → CONTENT → BACKGROUND (analisar transação)
window.addEventListener('message', async (event) => {
  if (event.source !== window) return;
  const message = event.data;

  if (message?.type === 'VETRA_TRANSACTION_REQUEST') {
    const response = await chrome.runtime.sendMessage({
      type: 'ANALYZE_TRANSACTION',
      payload: message.payload,
    });

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

export {};