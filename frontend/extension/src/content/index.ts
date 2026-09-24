/// <reference types="chrome"/>

/**
 * Content Script — ISOLATED world bridge to background.
 * Guarded so programmatic re-inject does not throw "already been declared".
 */

(() => {
  const g = globalThis as any;
  if (g.__VETRA_CONTENT_LOADED__) {
    console.log('🟢 Vetra content: already loaded, skipping redeclare');
    return;
  }
  g.__VETRA_CONTENT_LOADED__ = true;

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
    return !invalidPrefixes.some((prefix) => url.startsWith(prefix));
  };

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
        requestId: normalized.id,
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
            userApproved: true,
          },
        },
        '*'
      );
    }
  }

  if (!isValidPage()) {
    console.log('⏭️ Vetra: Content script loaded but not injecting (system page)');
  } else {
    console.log('🔥 VETRA: Bridging + ensuring MAIN interceptor…');

    try {
      if (!document.getElementById('vetra-interceptor-src')) {
        const script = document.createElement('script');
        script.id = 'vetra-interceptor-src';
        script.src = chrome.runtime.getURL('injected.js');
        script.async = false;
        (document.documentElement || document.head).prepend(script);
        console.log('✅ VETRA: injected.js via src');
      }
    } catch (e) {
      console.error('❌ VETRA: src inject failed', e);
    }

    try {
      chrome.runtime.sendMessage({ type: 'INJECT_PAGE_SCRIPT' }).catch(() => {});
    } catch {
      /* ignore */
    }
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
      window.postMessage({ type: 'VETRA_CONNECT', id, provider }, '*');
      return true;
    }

    if (msg?.type === 'VETRA_USER_DECISION') {
      window.postMessage(
        {
          type: 'VETRA_TRANSACTION_RESPONSE',
          id: msg.requestId,
          response: {
            userApproved: msg.approved === true,
            shouldBlock: msg.approved !== true,
            riskLevel: msg.riskLevel,
            riskScore: msg.riskScore,
          },
        },
        '*'
      );
      sendResponse({ ok: true });
      return false;
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
})();
