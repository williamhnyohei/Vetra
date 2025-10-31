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
  // ✅ ULTRA-FAST INJECTION: Inject code as inline string (faster than loading file)
  console.log('🔥 VETRA: Injecting interceptor INLINE (fastest method)...');
  
  const inlineCode = `
(function() {
  console.log('🔥 VETRA INLINE: Running BEFORE Phantom loads...');
  
  if (window.__VETRA_INTERCEPTOR__) return;
  window.__VETRA_INTERCEPTOR__ = true;
  
  let _wrapped = null;
  let _original = null;
  
  try {
    Object.defineProperty(window, 'solana', {
      get() {
        return _wrapped || _original;
      },
      set(provider) {
        console.log('🔥🔥🔥 PHANTOM SETTING window.solana! INTERCEPTING NOW! 🔥🔥🔥');
        _original = provider;
        
        if (!provider) return;
        
        _wrapped = new Proxy(provider, {
          get(target, prop) {
            const orig = target[prop];
            
            if (prop === 'signTransaction' || prop === 'signAllTransactions' || prop === 'signAndSendTransaction') {
              console.log(\`🎯 VETRA PROXY: Accessing \${prop}\`);
              return async function(...args) {
                console.log('🔐🔐🔐 VETRA: TRANSACTION INTERCEPTED! 🔐🔐🔐');
                console.log('Method:', prop);
                console.log('Transaction:', args[0]);
                
                window.postMessage({
                  type: 'VETRA_TX_INTERCEPTED',
                  method: prop,
                  transaction: args[0]
                }, '*');
                
                // Allow for now
                return orig.apply(target, args);
              };
            }
            
            return orig;
          }
        });
        
        console.log('✅✅✅ VETRA: Proxy created! All transactions will be intercepted! ✅✅✅');
      },
      configurable: true,
      enumerable: true
    });
    
    console.log('✅ VETRA: Property setter installed! Waiting for Phantom...');
  } catch (e) {
    console.error('❌ VETRA: Failed to install setter:', e);
  }
})();
  `;

  const script = document.createElement('script');
  script.textContent = inlineCode;
  script.id = 'vetra-interceptor';
  
  // Inject IMMEDIATELY at the START of documentElement
  (document.documentElement || document.head || document.body || document).prepend(script);
  
  console.log('✅ VETRA: Inline script injected at START of page!');
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

  // Handle wallet signTransaction interception
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

  // 🔥 Handle RPC transaction interception (network level)
  if (message?.type === 'VETRA_RPC_TRANSACTION') {
    console.log('🔥 Content: RPC transaction detected, forwarding to background...');
    
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'ANALYZE_RPC_TRANSACTION',
        payload: message.payload,
      });

      console.log('✅ Content: RPC analysis complete:', response);

      // Send response back to injected script
      window.postMessage(
        {
          type: 'VETRA_RPC_ANALYSIS_COMPLETE',
          id: message.id,
          analysis: response,
        },
        '*'
      );
    } catch (error) {
      console.error('❌ Content: Error analyzing RPC transaction:', error);
    }
  }
});

export {};