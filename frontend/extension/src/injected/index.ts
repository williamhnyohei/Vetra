// src/injected/index.ts

// evita rodar 2x se o content mandar injetar de novo
if ((window as any).__VETRA_INJECTED__) {
  console.log('🟣 Vetra injected: already present, skipping');
} else {
  (window as any).__VETRA_INJECTED__ = true;
  console.log('🟣 Vetra injected script loaded');

  /**
   * Tenta descobrir o provider de acordo com o que o popup pediu.
   * Suporta: phantom, backpack, solflare e auto.
   */
  function pickProvider(
    kind?: 'phantom' | 'backpack' | 'solflare' | 'auto'
  ): any | null {
    const w = window as any;

    // 1) pedido direto
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
      // solflare costuma expor isso:
      // - window.solflare
      // - ou window.solana com flag isSolflare
      if (w.solflare && (w.solflare.connect || w.solflare.signTransaction)) {
        return w.solflare;
      }
      if (w.solana && (w.solana.isSolflare || w.solana.providerName === 'Solflare')) {
        return w.solana;
      }
      return null;
    }

    // 2) auto (ordem de preferência)
    // phantom
    if (w.solana && (w.solana.isPhantom || w.solana.signTransaction)) {
      return w.solana;
    }
    // backpack
    if (w.backpack?.solana) return w.backpack.solana;
    if (w.backpack) return w.backpack;
    // solflare
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

      // alguns wallets têm connect(), outros já estão conectados
      let resp: any = null;
      if (typeof provider.connect === 'function') {
        // Phantom/Backpack/Solflare aceitam isso
        resp = await provider.connect({ onlyIfTrusted: false }).catch((e: any) => {
          // se o user cancelou, lança de novo
          throw e;
        });
      }

      // tenta pegar a public key do que voltou OU do provider
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

  /**
   * Envolve o provider pra interceptar signTransaction / signAllTransactions
   */
  function wrapSolanaProvider(solanaProvider: any) {
    console.log('🟣 Vetra injected: wrapping provider…');

    const wrappedSolana = new Proxy(solanaProvider, {
      get(target, prop, receiver) {
        const original = Reflect.get(target, prop, receiver);

        if (prop === 'signTransaction' || prop === 'signAllTransactions') {
          return async function (...args: any[]) {
            const requestId = Math.random().toString(36).substring(7);

            // manda pra extension analisar
            window.postMessage(
              {
                type: 'VETRA_TRANSACTION_REQUEST',
                id: requestId,
                payload: {
                  method: prop,
                  transaction: args[0],
                },
              },
              '*'
            );

            // espera resposta ou dá timeout
            await new Promise((resolve) => {
              const timeout = setTimeout(() => {
                resolve(true); // segue mesmo sem resposta
              }, 5000);

              const listener = (event: MessageEvent) => {
                if (
                  event.source === window &&
                  event.data?.type === 'VETRA_TRANSACTION_RESPONSE' &&
                  event.data?.id === requestId
                ) {
                  clearTimeout(timeout);
                  window.removeEventListener('message', listener);
                  resolve(true);
                }
              };

              window.addEventListener('message', listener);
            });

            // no MVP, deixa a carteira seguir o fluxo normal
            return original.apply(target, args);
          };
        }

        return original;
      },
    });

    // tenta trocar o window.solana sem quebrar sites
    try {
      Object.defineProperty(window, 'solana', {
        value: wrappedSolana,
        writable: false,
        configurable: true,
      });
    } catch {
      // fallback
      (window as any).solana = wrappedSolana;
    }

    console.log('🟣 Vetra injected: provider wrapped!');
  }

  /**
   * tenta achar provider e envolver; se não tiver ainda, fica tentando um pouco
   */
  const tryWrap = () => {
    const prov =
      pickProvider('auto') ||
      (window as any).solana ||
      (window as any).backpack ||
      (window as any).solflare;

    if (prov) {
      wrapSolanaProvider(prov);
      return true;
    }
    return false;
  };

  if (!tryWrap()) {
    // não tinha ainda → ficar olhando por ~5s
    let attempts = 0;
    const maxAttempts = 50;
    const iv = setInterval(() => {
      attempts++;
      if (tryWrap()) {
        clearInterval(iv);
      } else if (attempts >= maxAttempts) {
        clearInterval(iv);
        console.warn('⚠️ Vetra injected: no Solana provider found after 5s');
      }
    }, 100);
  }
}