// src/injected/index.ts

// evita rodar 2x se o content mandar injetar de novo
if ((window as any).__VETRA_INJECTED__) {
  console.log('🟣 Vetra injected: already present, skipping');
} else {
  (window as any).__VETRA_INJECTED__ = true;
  console.log('🟣 Vetra injected script loaded');

  // ✅ CRÍTICO: Instalar property setter IMEDIATAMENTE, ANTES de tudo!
  // Isso intercepta quando Phantom tentar definir window.solana
  let _solanaProvider: any = null;
  let _wrappedProvider: any = null;
  
  console.log('🔥 CRITICAL: Installing property setter BEFORE Phantom loads...');
  
  try {
    Object.defineProperty(window, 'solana', {
      get() {
        const result = _wrappedProvider || _solanaProvider;
        if (result) {
          console.log('🔍 Vetra Getter: Returning', result === _wrappedProvider ? 'WRAPPED ✅' : 'ORIGINAL ❌');
        }
        return result;
      },
      set(newProvider) {
        console.log('🔥 Vetra Setter: Phantom is setting window.solana NOW!');
        
        if (newProvider && !_wrappedProvider) {
          _solanaProvider = newProvider;
          
          console.log('🔥 Creating Proxy INLINE...');
          
          // Criar Proxy inline
          _wrappedProvider = new Proxy(newProvider, {
            get(target, prop, receiver) {
              if (prop === 'signTransaction' || prop === 'signAllTransactions') {
                console.log(`🔍 Vetra Proxy: Accessing ${String(prop)}`);
              }
              
              const original = Reflect.get(target, prop, receiver);

              if (prop === 'signTransaction' || prop === 'signAllTransactions') {
                console.log(`🎯 Vetra Proxy: Returning intercepted ${String(prop)}`);
                
                return async function (...args: any[]) {
                  console.log('🔐🔐🔐 VETRA: INTERCEPTING TRANSACTION! 🔐🔐🔐');
                  console.log('🔐 Vetra: Transaction data:', args[0]);

                  // Enviar para análise
                  window.postMessage(
                    {
                      type: 'VETRA_TRANSACTION_REQUEST',
                      id: Math.random().toString(36).substring(7),
                      payload: { method: prop, transaction: args[0] },
                    },
                    '*'
                  );

                  // Por enquanto, permitir (vamos adicionar bloqueio depois)
                  console.log('✅ Vetra: Proceeding with transaction (analysis sent to backend)');
                  return original.apply(target, args);
                };
              }

              return original;
            },
          });
          
          console.log('✅ Vetra Setter: Proxy created and saved to _wrappedProvider!');
        } else if (newProvider) {
          // Já foi wrappado
          console.log('⏭️ Vetra Setter: Already wrapped, skipping');
          _solanaProvider = newProvider;
        }
      },
      configurable: true,
      enumerable: true
    });
    console.log('🔥 SUCCESS: Property setter installed BEFORE Phantom!');
  } catch (e) {
    console.error('❌ FAILED to install property setter:', e);
  }

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

    // ✅ FIX: NÃO sobrescrever se property setter já está ativo!
    // Se window.solana já tem um getter/setter customizado, não mexer!
    const descriptor = Object.getOwnPropertyDescriptor(window, 'solana');
    const hasCustomSetter = descriptor && (descriptor.get || descriptor.set);
    
    if (hasCustomSetter) {
      console.log('🟣 Vetra: Skipping defineProperty (custom setter already active)');
      // Property setter já está gerenciando, não sobrescrever!
      return;
    }

    // tenta trocar o window.solana sem quebrar sites (se não tiver setter customizado)
    try {
      Object.defineProperty(window, 'solana', {
        value: wrappedSolana,
        writable: false,
        configurable: true,
      });
      console.log('🟣 Vetra injected: provider wrapped via defineProperty!');
    } catch {
      // fallback
      (window as any).solana = wrappedSolana;
      console.log('🟣 Vetra injected: provider wrapped via assignment!');
    }
  }

  // ✅ Property setter já foi instalado no início do script!
  console.log('✅ Vetra: Property setter strategy active - waiting for Phantom to load...');

  // =============================================================================
  // 🔥 ESTRATÉGIA ADICIONAL: INTERCEPTAR RPC CALLS (NETWORK LEVEL)
  // =============================================================================
  // Esta é mais confiável pois não depende de wrapping de providers
  
  console.log('🌐 Installing RPC interceptors (fetch + XMLHttpRequest)...');

  /**
   * Check if request is a Solana sendTransaction
   */
  function isSolanaTransaction(url: string, body: any): boolean {
    const isSolanaRPC = url && (
      url.includes('solana') || 
      url.includes('mainnet') || 
      url.includes('devnet') ||
      url.includes('testnet') ||
      url.includes('rpcpool')
    );
    
    if (!isSolanaRPC) return false;
    
    if (typeof body === 'string') {
      try {
        const parsed = JSON.parse(body);
        return parsed.method === 'sendTransaction' || 
               parsed.method === 'sendRawTransaction';
      } catch {
        return false;
      }
    }
    
    return false;
  }

  // Intercept fetch()
  const originalFetch = window.fetch;
  (window as any).fetch = async function(...args: any[]) {
    const [urlOrRequest, options] = args;
    const url = typeof urlOrRequest === 'string' ? urlOrRequest : urlOrRequest?.url;
    const body = options?.body || (typeof urlOrRequest === 'object' ? urlOrRequest?.body : null);

    if (url && isSolanaTransaction(url, body)) {
      console.log('🔥🔥🔥 SOLANA TRANSACTION DETECTED VIA FETCH! 🔥🔥🔥');
      console.log('📦 URL:', url);
      console.log('📦 Body:', body);

      try {
        const txData = JSON.parse(body);
        console.log('📊 Transaction method:', txData.method);
        console.log('📊 Transaction params:', txData.params);

        // Send to Vetra background for analysis
        window.postMessage({
          type: 'VETRA_RPC_TRANSACTION',
          id: Math.random().toString(36).substring(7),
          payload: {
            url,
            method: txData.method,
            params: txData.params,
            body,
          }
        }, '*');

        console.log('✅ Transaction sent to Vetra for analysis');
      } catch (e) {
        console.warn('⚠️ Could not parse transaction body:', e);
      }
    }

    return originalFetch.apply(this, args);
  };

  console.log('✅ Fetch interceptor installed');

  // Intercept XMLHttpRequest
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function(method: string, url: string | URL, ...args: any[]) {
    (this as any)._vetraUrl = url.toString();
    return originalXHROpen.apply(this, [method, url, ...args]);
  };

  XMLHttpRequest.prototype.send = function(body?: Document | XMLHttpRequestBodyInit | null) {
    const url = (this as any)._vetraUrl;
    
    if (url && isSolanaTransaction(url, body)) {
      console.log('🔥🔥🔥 SOLANA TRANSACTION DETECTED VIA XHR! 🔥🔥🔥');
      console.log('📦 URL:', url);
      console.log('📦 Body:', body);

      try {
        const txData = JSON.parse(body as string);
        
        window.postMessage({
          type: 'VETRA_RPC_TRANSACTION',
          id: Math.random().toString(36).substring(7),
          payload: {
            url,
            method: txData.method,
            params: txData.params,
            body,
          }
        }, '*');

        console.log('✅ Transaction sent to Vetra for analysis');
      } catch (e) {
        console.warn('⚠️ Could not parse XHR transaction body:', e);
      }
    }

    return originalXHRSend.apply(this, [body]);
  };

  console.log('✅ XMLHttpRequest interceptor installed');
  console.log('🛡️ Vetra now monitoring all Solana RPC calls!');
}