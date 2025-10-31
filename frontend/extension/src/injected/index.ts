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

            console.log('🔐 Vetra: Intercepting transaction signature request');

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

            // espera resposta com decisão do usuário
            const userDecision = await new Promise<{ approved: boolean; shouldBlock: boolean }>((resolve) => {
              const timeout = setTimeout(() => {
                console.warn('⚠️ Vetra: Analysis timeout, proceeding with transaction');
                resolve({ approved: true, shouldBlock: false }); // timeout → permite por segurança
              }, 30000); // 30s timeout

              const listener = (event: MessageEvent) => {
                if (
                  event.source === window &&
                  event.data?.type === 'VETRA_TRANSACTION_RESPONSE' &&
                  event.data?.id === requestId
                ) {
                  clearTimeout(timeout);
                  window.removeEventListener('message', listener);
                  
                  const response = event.data?.response || {};
                  console.log('✅ Vetra: Received analysis response:', response);
                  
                  // Se high risk e usuário não aprovou, bloquear
                  const shouldBlock = response.riskLevel === 'high' && !response.userApproved;
                  resolve({ 
                    approved: response.userApproved ?? true, 
                    shouldBlock 
                  });
                }
              };

              window.addEventListener('message', listener);
            });

            // Se usuário bloqueou, lançar erro
            if (userDecision.shouldBlock || !userDecision.approved) {
              console.log('🚫 Vetra: Transaction blocked by user');
              throw new Error('Transaction blocked by Vetra security analysis');
            }

            console.log('✅ Vetra: Transaction approved, proceeding to sign');
            // permite a carteira seguir o fluxo normal
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

    if (prov && !(window as any).__VETRA_WRAPPED__) {
      wrapSolanaProvider(prov);
      (window as any).__VETRA_WRAPPED__ = true;
      return true;
    }
    return false;
  };

  // ✅ FIX: Usar múltiplas estratégias para interceptar Phantom

  // Estratégia 1: Tentar imediatamente
  if (!tryWrap()) {
    console.log('🟣 Vetra: Provider not found yet, setting up detection...');

    // Estratégia 2: Polling (tentar a cada 100ms por 10s)
    let attempts = 0;
    const maxAttempts = 100; // 10 segundos
    const iv = setInterval(() => {
      attempts++;
      if (tryWrap()) {
        console.log('✅ Vetra: Provider found via polling!');
        clearInterval(iv);
      } else if (attempts >= maxAttempts) {
        clearInterval(iv);
        console.warn('⚠️ Vetra injected: no Solana provider found after 10s');
      }
    }, 100);

    // Estratégia 3: MutationObserver (detectar quando window.solana é adicionado)
    const observer = new MutationObserver(() => {
      if ((window as any).solana && !(window as any).__VETRA_WRAPPED__) {
        console.log('✅ Vetra: Provider detected via MutationObserver!');
        tryWrap();
        observer.disconnect();
        clearInterval(iv);
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: false
    });

    // Desconectar observer após 15s
    setTimeout(() => observer.disconnect(), 15000);

    // Estratégia 4: Property setter (interceptar QUANDO Phantom setar window.solana)
    let _solanaProvider: any = null;
    let _wrappedProvider: any = null;
    
    try {
      Object.defineProperty(window, 'solana', {
        get() {
          // ✅ FIX: Retornar o provider WRAPPADO, não o original!
          return _wrappedProvider || _solanaProvider;
        },
        set(newProvider) {
          console.log('✅ Vetra: Solana provider being set, wrapping now!');
          
          if (newProvider && !(window as any).__VETRA_WRAPPED__) {
            _solanaProvider = newProvider;
            
            // ✅ FIX: Criar wrapper inline e salvar na variável
            console.log('🟣 Vetra: Creating proxy wrapper for provider...');
            
            _wrappedProvider = new Proxy(newProvider, {
              get(target, prop, receiver) {
                const original = Reflect.get(target, prop, receiver);

                if (prop === 'signTransaction' || prop === 'signAllTransactions') {
                  return async function (...args: any[]) {
                    const requestId = Math.random().toString(36).substring(7);
                    console.log('🔐 Vetra: Intercepting transaction signature request');

                    // Enviar para análise
                    window.postMessage(
                      {
                        type: 'VETRA_TRANSACTION_REQUEST',
                        id: requestId,
                        payload: { method: prop, transaction: args[0] },
                      },
                      '*'
                    );

                    // Aguardar resposta do usuário
                    const userDecision = await new Promise<{ approved: boolean }>((resolve) => {
                      const timeout = setTimeout(() => {
                        console.warn('⚠️ Vetra: Analysis timeout, proceeding');
                        resolve({ approved: true });
                      }, 30000);

                      const listener = (event: MessageEvent) => {
                        if (
                          event.source === window &&
                          event.data?.type === 'VETRA_TRANSACTION_RESPONSE' &&
                          event.data?.id === requestId
                        ) {
                          clearTimeout(timeout);
                          window.removeEventListener('message', listener);
                          const response = event.data?.response || {};
                          resolve({ approved: response.userApproved ?? true });
                        }
                      };

                      window.addEventListener('message', listener);
                    });

                    // Bloquear se rejeitado
                    if (!userDecision.approved) {
                      console.log('🚫 Vetra: Transaction blocked by user');
                      throw new Error('Transaction blocked by Vetra security analysis');
                    }

                    console.log('✅ Vetra: Transaction approved, signing...');
                    return original.apply(target, args);
                  };
                }

                return original;
              },
            });
            
            (window as any).__VETRA_WRAPPED__ = true;
            clearInterval(iv);
            observer.disconnect();
            
            console.log('✅ Vetra: Provider successfully wrapped via setter!');
          } else {
            // Já foi wrappado ou provider inválido
            _solanaProvider = newProvider;
          }
        },
        configurable: true,
        enumerable: true
      });
      console.log('✅ Vetra: Property setter installed for window.solana');
    } catch (e) {
      console.warn('⚠️ Vetra: Could not install property setter:', e);
    }
  }
}