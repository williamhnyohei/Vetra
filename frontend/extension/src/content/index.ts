/// <reference types="chrome"/>

// Content Script — roda em todas as páginas
console.log('🟢 Vetra content script loaded at', window.location.href);

const isValidPage = (): boolean => {
  const url = window.location.href;
  const invalidPrefixes = [
    'chrome://',
    'chrome-extension://',
    'about:',
    'edge://',
    'brave://',
    'moz-extension://',
  ];

  for (const prefix of invalidPrefixes) {
    if (url.startsWith(prefix)) {
      console.log('⏭️ Vetra: Skipping injection on system page:', prefix);
      return false;
    }
  }

  return true;
};

/** Normaliza tipos legados e o contrato atual para um único fluxo de bridge. */
function normalizeTransactionMessage(data: any): {
  id: string;
  payload: { method: string; transaction: unknown };
} | null {
  if (!data || typeof data !== 'object') return null;

  if (data.type === 'VETRA_TRANSACTION_REQUEST' && data.payload && data.id) {
    return {
      id: String(data.id),
      payload: {
        method: String(data.payload.method ?? 'signTransaction'),
        transaction: data.payload.transaction,
      },
    };
  }

  if (
    data.type === 'VETRA_TX_INTERCEPTED' ||
    data.type === 'VETRA_TRANSACTION_INTERCEPTED'
  ) {
    return {
      id:
        typeof data.id === 'string' && data.id.length > 0
          ? data.id
          : Math.random().toString(36).slice(2),
      payload: {
        method: String(data.method ?? 'signTransaction'),
        transaction: data.transaction,
      },
    };
  }

  return null;
}

async function bridgeTransactionToBackground(normalized: {
  id: string;
  payload: { method: string; transaction: unknown };
}): Promise<void> {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'ANALYZE_TRANSACTION',
      payload: normalized.payload,
    });

    window.postMessage(
      {
        type: 'VETRA_TRANSACTION_RESPONSE',
        id: normalized.id,
        response,
      },
      '*'
    );
  } catch (error) {
    console.error('❌ Vetra content: bridge ANALYZE_TRANSACTION failed', error);
    window.postMessage(
      {
        type: 'VETRA_TRANSACTION_RESPONSE',
        id: normalized.id,
        response: {
          success: false,
          error: String((error as Error)?.message || error),
          riskLevel: 'medium',
          riskScore: 50,
        },
      },
      '*'
    );
  }
}

if (!isValidPage()) {
  console.log('⏭️ Vetra: Content script loaded but not injecting (system page)');
} else {
  console.log('🔥 VETRA: Injecting interceptor INLINE (document_start)...');

  const inlineCode = `
(function() {
  console.log('🔥 VETRA INLINE: early hook');
  if (window.__VETRA_INTERCEPTOR__) return;
  window.__VETRA_INTERCEPTOR__ = true;

  var _wrapped = null;
  var _stored = null;

  function randomId() {
    return Math.random().toString(36).substring(2, 11);
  }

  function postTx(method, tx) {
    window.postMessage({
      type: 'VETRA_TRANSACTION_REQUEST',
      id: randomId(),
      payload: { method: String(method), transaction: tx }
    }, '*');
  }

  function tryPatchSolanaMethods() {
    var s = window.solana;
    if (!s || typeof s.signTransaction !== 'function') return false;
    if (s.__vetra_method_patched) return true;
    var methods = ['signTransaction', 'signAllTransactions', 'signAndSendTransaction'];
    for (var i = 0; i < methods.length; i++) {
      var m = methods[i];
      var orig = s[m];
      if (typeof orig !== 'function') continue;
      (function(methodName, original) {
        s[methodName] = async function() {
          var args = Array.prototype.slice.call(arguments);
          postTx(methodName, args[0]);
          return original.apply(s, args);
        };
      })(m, orig);
    }
    try { s.__vetra_method_patched = true; } catch (e1) {}
    try { window.__VETRA_HOOK__ = 'late_patched'; } catch (e2) {}
    return true;
  }

  try {
    Object.defineProperty(window, 'solana', {
      get: function() {
        return _wrapped || _stored;
      },
      set: function(provider) {
        _stored = provider;
        if (!provider) { _wrapped = null; return; }
        _wrapped = new Proxy(provider, {
          get: function(target, prop) {
            var orig = target[prop];
            if (prop === 'signTransaction' || prop === 'signAllTransactions' || prop === 'signAndSendTransaction') {
              if (typeof orig !== 'function') return orig;
              return async function() {
                var args = Array.prototype.slice.call(arguments);
                postTx(prop, args[0]);
                return orig.apply(target, args);
              };
            }
            return orig;
          }
        });
      },
      configurable: true,
      enumerable: true
    });
    try { window.__VETRA_HOOK__ = 'installed'; } catch (e) {}
    console.log('✅ VETRA INLINE: solana setter installed');
  } catch (e) {
    console.error('❌ VETRA INLINE: defineProperty failed', e);
    try { window.__VETRA_HOOK__ = 'failed'; window.__VETRA_HOOK_DETAIL__ = String(e && e.message || e); } catch (e2) {}
  }

  var deadline = Date.now() + 10000;
  function tick() {
    try {
      if (window.__VETRA_HOOK__ === 'failed' && window.solana) {
        if (tryPatchSolanaMethods()) return;
      }
    } catch (e3) {}
    if (Date.now() < deadline) setTimeout(tick, 250);
  }
  setTimeout(tick, 0);
})();
  `;

  const script = document.createElement('script');
  script.textContent = inlineCode;
  script.id = 'vetra-interceptor';

  (document.documentElement || document.head || document.body || document).prepend(script);

  console.log('✅ VETRA: Inline script injected');
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === 'VETRA_CONNECT' || msg?.type === 'VETRA_CONNECT_WALLET') {
    const provider =
      (msg?.payload?.provider as
        | 'phantom'
        | 'backpack'
        | 'solflare'
        | 'auto'
        | undefined) || 'auto';

    const id =
      (crypto as any)?.randomUUID?.() || Math.random().toString(36).slice(2);

    const handler = (ev: MessageEvent) => {
      const data = ev.data || {};
      if (data?.type === 'VETRA_CONNECT_RES' && data.id === id) {
        window.removeEventListener('message', handler);
        sendResponse(data);
      }
    };

    window.addEventListener('message', handler);

    window.postMessage(
      {
        type: 'VETRA_CONNECT',
        id,
        provider,
      },
      '*'
    );

    return true;
  }
});

window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  const normalized = normalizeTransactionMessage(event.data);
  if (normalized) {
    void bridgeTransactionToBackground(normalized);
    return;
  }

  if (event.data?.type === 'VETRA_RPC_TRANSACTION') {
    void (async () => {
      console.log('🔥 Vetra content: RPC transaction — forwarding to background');
      try {
        const response = await chrome.runtime.sendMessage({
          type: 'ANALYZE_RPC_TRANSACTION',
          payload: event.data.payload,
        });

        window.postMessage(
          {
            type: 'VETRA_RPC_ANALYSIS_COMPLETE',
            id: event.data.id,
            analysis: response,
          },
          '*'
        );
      } catch (error) {
        console.error('❌ Vetra content: RPC analysis error', error);
      }
    })();
  }
});

export {};
