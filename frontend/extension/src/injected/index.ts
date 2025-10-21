// Injected Script - Runs in page context, has access to window.solana
console.log('Vetra injected script loaded');

// Store original window.solana
const originalSolana = (window as any).solana;

if (originalSolana) {
  console.log('Wrapping window.solana provider');

  // Create proxy to intercept method calls
  const wrappedSolana = new Proxy(originalSolana, {
    get(target, prop) {
      const original = target[prop];

      // Intercept signTransaction and signAllTransactions
      if (prop === 'signTransaction' || prop === 'signAllTransactions') {
        return async function (...args: any[]) {
          console.log(`Intercepting ${String(prop)}`, args);

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

  console.log('window.solana wrapped successfully');
}

export {};

