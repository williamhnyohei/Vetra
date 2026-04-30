// src/injected/index.ts

import { installSolanaInterceptor } from './wrap-provider';

// evita rodar 2x se o content mandar injetar de novo
if ((window as any).__VETRA_INJECTED__) {
  console.log('🟣 Vetra injected: already present, skipping');
} else {
  (window as any).__VETRA_INJECTED__ = true;
  console.log('🟣 Vetra injected script loaded');

  installSolanaInterceptor(window);

  /**
   * Tenta descobrir o provider de acordo com o que o popup pediu.
   * Suporta: phantom, backpack, solflare e auto.
   */
  function pickProvider(
    kind?: 'phantom' | 'backpack' | 'solflare' | 'auto'
  ): any | null {
    const w = window as any;

    if (kind === 'phantom') {
      if (w.solana && (w.solana.isPhantom || w.solana.signTransaction)) {
        return w.solana;
      }
      return null;
    }

    if (kind === 'backpack') {
      if (w.backpack?.solana) return w.backpack.solana;
      if (w.backpack) return w.backpack;
      return null;
    }

    if (kind === 'solflare') {
      if (w.solflare && (w.solflare.connect || w.solflare.signTransaction)) {
        return w.solflare;
      }
      if (w.solana && (w.solana.isSolflare || w.solana.providerName === 'Solflare')) {
        return w.solana;
      }
      return null;
    }

    if (w.solana && (w.solana.isPhantom || w.solana.signTransaction)) {
      return w.solana;
    }
    if (w.backpack?.solana) return w.backpack.solana;
    if (w.backpack) return w.backpack;
    if (w.solflare && (w.solflare.connect || w.solflare.signTransaction)) {
      return w.solflare;
    }
    if (w.solana && (w.solana.isSolflare || w.solana.providerName === 'Solflare')) {
      return w.solana;
    }

    return null;
  }

  /**
   * Handler de CONECTAR — vem do content (que veio do popup)
   */
  window.addEventListener('message', async (ev) => {
    const msg = ev.data || {};
    if (msg?.type !== 'VETRA_CONNECT') return;

    const id = msg.id;
    const providerPref = msg?.provider as
      | 'phantom'
      | 'backpack'
      | 'solflare'
      | 'auto'
      | undefined;

    console.log('🟣 Vetra injected: connect request →', providerPref || 'auto');

    try {
      const provider = pickProvider(providerPref || 'auto');
      if (!provider) {
        throw new Error('No Solana provider found (Phantom/Backpack/Solflare)');
      }

      let resp: any = null;
      if (typeof provider.connect === 'function') {
        resp = await provider.connect({ onlyIfTrusted: false }).catch((e: any) => {
          throw e;
        });
      }

      const pubkey =
        resp?.publicKey?.toString?.() ||
        provider.publicKey?.toString?.() ||
        (typeof provider.publicKey === 'string' ? provider.publicKey : null);

      if (!pubkey) {
        throw new Error('Could not read public key from provider');
      }

      window.postMessage(
        {
          type: 'VETRA_CONNECT_RES',
          id,
          success: true,
          publicKey: pubkey,
        },
        '*'
      );
    } catch (e: any) {
      console.warn('🟣 Vetra injected: connect failed →', e?.message || e);
      window.postMessage(
        {
          type: 'VETRA_CONNECT_RES',
          id,
          success: false,
          error: String(e?.message || e),
        },
        '*'
      );
    }
  });

  console.log('✅ Vetra: Property setter + RPC interceptors active');

  // =============================================================================
  // RPC interceptors (fallback path when provider wrap is bypassed)
  // =============================================================================

  function isSolanaTransaction(url: string, body: any): boolean {
    const isSolanaRPC =
      url &&
      (url.includes('solana') ||
        url.includes('mainnet') ||
        url.includes('devnet') ||
        url.includes('testnet') ||
        url.includes('rpcpool'));

    if (!isSolanaRPC) return false;

    if (typeof body === 'string') {
      try {
        const parsed = JSON.parse(body);
        return parsed.method === 'sendTransaction' || parsed.method === 'sendRawTransaction';
      } catch {
        return false;
      }
    }

    return false;
  }

  const originalFetch = window.fetch;
  (window as any).fetch = async function (...args: any[]) {
    const [urlOrRequest, options] = args;
    const url = typeof urlOrRequest === 'string' ? urlOrRequest : urlOrRequest?.url;
    const body = options?.body || (typeof urlOrRequest === 'object' ? urlOrRequest?.body : null);

    if (url && isSolanaTransaction(url, body)) {
      console.log('🔥 Vetra: Solana RPC via fetch — forwarding for analysis');
      try {
        const txData = JSON.parse(body as string);
        window.postMessage(
          {
            type: 'VETRA_RPC_TRANSACTION',
            id: Math.random().toString(36).substring(7),
            payload: {
              url,
              method: txData.method,
              params: txData.params,
              body,
            },
          },
          '*'
        );
      } catch (e) {
        console.warn('⚠️ Vetra: could not parse fetch body for RPC analysis', e);
      }
    }

    return originalFetch.apply(this, args);
  };

  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method: string, url: string | URL, ...args: any[]) {
    (this as any)._vetraUrl = url.toString();
    return originalXHROpen.apply(this, [method, url, ...args]);
  };

  XMLHttpRequest.prototype.send = function (body?: Document | XMLHttpRequestBodyInit | null) {
    const url = (this as any)._vetraUrl;

    if (url && isSolanaTransaction(url, body)) {
      console.log('🔥 Vetra: Solana RPC via XHR — forwarding for analysis');
      try {
        const txData = JSON.parse(body as string);

        window.postMessage(
          {
            type: 'VETRA_RPC_TRANSACTION',
            id: Math.random().toString(36).substring(7),
            payload: {
              url,
              method: txData.method,
              params: txData.params,
              body,
            },
          },
          '*'
        );
      } catch (e) {
        console.warn('⚠️ Vetra: could not parse XHR body for RPC analysis', e);
      }
    }

    return originalXHRSend.apply(this, [body]);
  };

  console.log('🛡️ Vetra monitoring Solana RPC (fetch + XHR)');
}
