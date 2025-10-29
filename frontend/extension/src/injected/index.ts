// Injected Script - Runs in page context, has access to window.solana
console.log('🟣 Vetra injected script loaded');
console.log('🔍 Checking for window.solana...');

// ---- small helper to find a Solana provider (Phantom/Backpack) ----
function getSolanaProvider(): any | null {
  const w = window as any;

  // Phantom (mais comum em window.solana)
  if (w.solana && (w.solana.isPhantom || w.solana.signTransaction)) return w.solana;

  // Backpack costuma expor em window.backpack.solana ou window.backpack
  if (w.backpack?.solana && (w.backpack.solana.connect || w.backpack.solana.signTransaction)) {
    return w.backpack.solana;
  }
  if (w.backpack && (w.backpack.connect || w.backpack.signTransaction)) {
    return w.backpack;
  }

  return null;
}

// === CONNECT handler: recebe pedido do content/popup e tenta abrir a wallet ===
window.addEventListener('message', async (ev) => {
  const msg = ev.data || {};
  if (msg?.type !== 'VETRA_CONNECT') return;

  const id = msg.id;
  try {
    const provider = getSolanaProvider();
    if (!provider) throw new Error('No Solana provider found (Phantom/Backpack)');

    // tenta conexão (Phantom/Backpack aceitam connect())
    const resp = await provider.connect?.({ onlyIfTrusted: false }) ?? {};
    const pubkey =
      resp?.publicKey?.toString?.() ||
      provider.publicKey?.toString?.() ||
      (typeof provider.publicKey === 'string' ? provider.publicKey : null);

    if (!pubkey) throw new Error('Could not read public key from provider');

    window.postMessage({ type: 'VETRA_CONNECT_RES', id, ok: true, publicKey: pubkey }, '*');
  } catch (e: any) {
    window.postMessage(
      { type: 'VETRA_CONNECT_RES', id, ok: false, error: String(e?.message || e) },
      '*'
    );
  }
});

// Function to wrap solana provider
function wrapSolanaProvider(solanaProvider: any) {
  console.log('✅ Wrapping window.solana provider...');
  console.log('📦 Original Solana:', solanaProvider);

  // Create proxy to intercept method calls
  const wrappedSolana = new Proxy(solanaProvider, {
    get(target, prop) {
      const original = (target as any)[prop];

      // Intercept signTransaction and signAllTransactions
      if (prop === 'signTransaction' || prop === 'signAllTransactions') {
        return async function (...args: any[]) {
          console.log(`🎯 INTERCEPTED ${String(prop)}!!!`, args);
          console.log('📦 Transaction object:', args[0]);

          // Generate request ID
          const requestId = Math.random().toString(36).substring(7);

          // Send to content script for analysis
          window.postMessage(
            {
              type: 'VETRA_TRANSACTION_REQUEST',
              id: requestId,
              payload: {
                method: prop,
                transaction: args[0], // Transaction object
              },
            },
            '*'
          );

          // Wait for response (with timeout)
          const response = await new Promise((resolve) => {
            const timeout = setTimeout(() => {
              resolve({ approved: true }); // Default to allow if timeout
            }, 5000);

            const listener = (event: MessageEvent) => {
              if (
                event.source === window &&
                event.data?.type === 'VETRA_TRANSACTION_RESPONSE' &&
                event.data?.id === requestId
              ) {
                clearTimeout(timeout);
                window.removeEventListener('message', listener);
                resolve(event.data.response);
              }
            };

            window.addEventListener('message', listener);
          });

          console.log('Transaction analysis response:', response);

          // For now, always allow - TODO: Show approval UI
          return original.apply(target, args);
        };
      }

      return original;
    },
  });

  // Replace window.solana (sem quebrar se já for non-writable)
  try {
    Object.defineProperty(window, 'solana', {
      value: wrappedSolana,
      writable: false,
      configurable: true,
    });
  } catch {
    // fallback: só atribui se possível
    (window as any).solana = wrappedSolana;
  }

  console.log('✅ window.solana wrapped successfully!');
  console.log('🔗 New window.solana:', wrappedSolana);

  return wrappedSolana;
}

// Store original window.solana
const originalSolana = (window as any).solana;

if (originalSolana) {
  // Wrap existing solana provider
  wrapSolanaProvider(originalSolana);
} else {
  console.warn('⚠️ window.solana not found yet. Setting up observer...');

  // Watch for window.solana to be added
  let attempts = 0;
  const maxAttempts = 50; // 5 seconds total (50 * 100ms)

  const solanaCheckInterval = setInterval(() => {
    attempts++;

    const prov = getSolanaProvider() || (window as any).solana;
    if (prov) {
      console.log('✅ Solana provider detected! Wrapping now...');
      clearInterval(solanaCheckInterval);
      wrapSolanaProvider(prov);
    } else if (attempts >= maxAttempts) {
      console.warn('⚠️ Solana provider not found after 5 seconds.');
      console.log('💡 Tip: Make sure the page has Phantom/Backpack installed (window.solana/backpack)');
      clearInterval(solanaCheckInterval);
    }
  }, 100); // Check every 100ms
}

export {};