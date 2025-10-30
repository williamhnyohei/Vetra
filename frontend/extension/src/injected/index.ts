// Injected Script - Runs in page context, has access to window.solana
console.log('🟣 Vetra injected script loaded');
console.log('🔍 Checking for window.solana...');

// Detect network (will be determined from wallet connection)
let currentNetwork = 'unknown';

// Try to detect network from URL or other indicators
if (window.location.hostname.includes('devnet') || window.location.search.includes('devnet')) {
  currentNetwork = 'devnet';
  console.log('🌐 Network: Solana Devnet (Testing Environment)');
  console.log('💡 Using fake SOL - test safely!');
} else if (window.location.hostname.includes('testnet') || window.location.search.includes('testnet')) {
  currentNetwork = 'testnet';
  console.log('🌐 Network: Solana Testnet');
} else {
  currentNetwork = 'mainnet';
  console.log('🌐 Network: Solana Mainnet');
}

// Serialize transaction to safely pass through messages
function serializeTransaction(transaction: any): any {
  try {
    // If transaction has serialize method, use it
    if (transaction && typeof transaction.serialize === 'function') {
      const serialized = transaction.serialize();
      // Convert to base64 using browser-compatible method
      const base64 = btoa(String.fromCharCode(...Array.from(serialized)));
      return {
        serialized: base64,
        type: 'serialized',
      };
    }
    
    // Extract key properties if it's a transaction object
    if (transaction && typeof transaction === 'object') {
      return {
        instructions: transaction.instructions || [],
        recentBlockhash: transaction.recentBlockhash || null,
        feePayer: transaction.feePayer ? transaction.feePayer.toString() : null,
        signatures: transaction.signatures || [],
        type: 'object',
      };
    }
    
    return transaction;
  } catch (error) {
    console.error('Error serializing transaction:', error);
    return { error: 'Failed to serialize transaction' };
  }
}

// Function to wrap solana provider
function wrapSolanaProvider(solanaProvider: any) {
  console.log('✅ Wrapping window.solana provider...');
  console.log('📦 Original Solana:', solanaProvider);

  // Intercept methods that sign/send transactions
  const methodsToIntercept = [
    'signTransaction',
    'signAllTransactions',
    'signAndSendTransaction',
    'sendTransaction',
    'request' // For generic wallet adapter requests
  ];

  // Create proxy to intercept method calls
  const wrappedSolana = new Proxy(solanaProvider, {
    get(target, prop) {
      const original = target[prop];

      // Intercept transaction signing/sending methods
      if (methodsToIntercept.includes(String(prop))) {
        return async function (...args: any[]) {
          console.log(`🎯 VETRA INTERCEPTED ${String(prop)}!!!`);
          console.log('=' .repeat(50));
          console.log('📦 Arguments:', args);
          console.log('🕐 Timestamp:', new Date().toISOString());

          // Determine transaction from arguments based on method
          let transactionData = null;
          
          if (prop === 'request' && args[0]?.method === 'signTransaction') {
            transactionData = args[0]?.params?.transaction;
          } else if (prop === 'signAllTransactions') {
            // For signAllTransactions, analyze the first transaction
            transactionData = args[0]?.[0];
          } else {
            // For other methods, transaction is usually first argument
            transactionData = args[0];
          }

          // Generate request ID
          const requestId = `vetra_${Date.now()}_${Math.random().toString(36).substring(7)}`;

          console.log('📤 Sending transaction for analysis...');
          
          // Serialize transaction for safe message passing
          const serializedTx = serializeTransaction(transactionData);
          
          // Send to content script for analysis
          window.postMessage(
            {
              type: 'VETRA_TRANSACTION_REQUEST',
              id: requestId,
              payload: {
                method: String(prop),
                transaction: serializedTx,
                url: window.location.href,
                timestamp: Date.now(),
                network: currentNetwork,
              },
            },
            '*'
          );

          // Wait for response (with timeout)
          const response: any = await new Promise((resolve) => {
            const timeout = setTimeout(() => {
              console.warn('⏰ Analysis timeout - allowing transaction');
              resolve({ approved: true, reason: 'timeout' });
            }, 10000); // 10 second timeout

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

          console.log('📥 Transaction analysis response:', response);
          
          // Display risk information
          if (response.riskScore !== undefined) {
            console.log(`⚠️ Risk Score: ${response.riskScore}/100`);
            console.log(`📊 Risk Level: ${response.riskLevel}`);
            if (response.reasons) {
              console.log('🔍 Risk Reasons:', response.reasons);
            }
          }

          // Check if transaction should be blocked
          if (response.blocked === true) {
            console.error('🚫 TRANSACTION BLOCKED BY VETRA');
            console.error('⚠️ Reason:', response.blockReason || 'High risk transaction');
            
            // Throw error to prevent transaction from proceeding
            throw new Error(response.blockReason || '🛡️ Vetra blocked this high-risk transaction for your safety');
          }

          // If approved or requires manual approval (and user approved), proceed
          if (response.approved === true) {
            console.log('✅ Transaction approved by Vetra');
            return original.apply(target, args);
          }

          // If rejected by user, block transaction
          if (response.approved === false) {
            console.warn('🚫 Transaction rejected by user');
            throw new Error('🛡️ Transaction rejected by Vetra user');
          }

          // Default: allow (shouldn't reach here, but safety fallback)
          console.warn('⚠️ Unexpected response, allowing transaction');
          return original.apply(target, args);
        };
      }

      // Return original property/method
      if (typeof original === 'function') {
        return original.bind(target);
      }
      return original;
    },
  });

  // Try to replace window.solana (may fail if wallet already defined it as non-configurable)
  try {
    Object.defineProperty(window, 'solana', {
      value: wrappedSolana,
      writable: false,
      configurable: true,
    });
    console.log('✅ window.solana replaced with Vetra wrapper');
  } catch (error) {
    // If we can't redefine, wrap the methods in-place
    console.log('⚠️ Cannot redefine window.solana (wallet set it as non-configurable)');
    console.log('🔧 Wrapping methods in-place instead...');
    
    // Wrap methods directly on the existing object
    methodsToIntercept.forEach(method => {
      if (typeof solanaProvider[method] === 'function') {
        const original = solanaProvider[method];
        solanaProvider[method] = wrappedSolana[method];
        console.log(`✅ Wrapped ${method} in-place`);
      }
    });
  }

  console.log('✅ window.solana wrapped successfully!');
  console.log('🔗 window.solana:', window.solana);
  console.log('🛡️ Vetra protection active');
  console.log('💼 Wallet:', solanaProvider.isPhantom ? 'Phantom' : solanaProvider.isSolflare ? 'Solflare' : solanaProvider.isBackpack ? 'Backpack' : 'Unknown');
  console.log('🌐 Ready to intercept transactions!');
  
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

