// Injected Script - Runs in page context, has access to window.solana
console.log('🟣 Vetra injected script loaded');
console.log('🔍 Checking for window.solana...');

// Function to wrap solana provider
function wrapSolanaProvider(solanaProvider: any) {
  console.log('✅ Wrapping window.solana provider...');
  console.log('📦 Original Solana:', solanaProvider);

  // Create proxy to intercept method calls
  const wrappedSolana = new Proxy(solanaProvider, {
    get(target, prop) {
      const original = target[prop];

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
                event.data.type === 'VETRA_TRANSACTION_RESPONSE' &&
                event.data.id === requestId
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

  // Replace window.solana
  Object.defineProperty(window, 'solana', {
    value: wrappedSolana,
    writable: false,
    configurable: true,
  });

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
  let solanaCheckInterval: any;
  let attempts = 0;
  const maxAttempts = 50; // 5 seconds total (50 * 100ms)
  
  solanaCheckInterval = setInterval(() => {
    attempts++;
    
    if ((window as any).solana) {
      console.log('✅ window.solana detected! Wrapping now...');
      clearInterval(solanaCheckInterval);
      wrapSolanaProvider((window as any).solana);
    } else if (attempts >= maxAttempts) {
      console.warn('⚠️ window.solana not found after 5 seconds.');
      console.log('💡 Tip: Make sure the page has a Solana wallet or provides window.solana');
      clearInterval(solanaCheckInterval);
    }
  }, 100); // Check every 100ms
}

export {};

