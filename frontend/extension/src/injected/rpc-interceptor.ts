// RPC Interceptor - Intercepts Solana RPC calls at network level
// This approach is more reliable than wrapping wallet providers

console.log('🔥 Vetra RPC Interceptor loading...');

// Track intercepted transactions
const interceptedTransactions = new Map<string, any>();

/**
 * Check if a request is a Solana sendTransaction RPC call
 */
function isSolanaTransaction(url: string, body: any): boolean {
  // Check if URL is a Solana RPC endpoint
  const isSolanaRPC = url.includes('solana') || 
                      url.includes('mainnet') || 
                      url.includes('devnet') ||
                      url.includes('testnet') ||
                      url.includes('rpcpool');
  
  if (!isSolanaRPC) return false;
  
  // Check if method is sendTransaction or sendRawTransaction
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

/**
 * Extract transaction data from RPC request
 */
function extractTransactionData(body: string): any {
  try {
    const parsed = JSON.parse(body);
    return {
      method: parsed.method,
      params: parsed.params,
      id: parsed.id,
    };
  } catch {
    return null;
  }
}

/**
 * Intercept fetch() calls
 */
const originalFetch = window.fetch;
(window as any).fetch = async function(...args: any[]) {
  const [urlOrRequest, options] = args;
  const url = typeof urlOrRequest === 'string' ? urlOrRequest : urlOrRequest.url;
  const body = options?.body || (typeof urlOrRequest === 'object' ? urlOrRequest.body : null);

  console.log('🌐 Fetch intercepted:', url);

  // Check if this is a Solana transaction
  if (isSolanaTransaction(url, body)) {
    console.log('🔥 SOLANA TRANSACTION DETECTED VIA FETCH!');
    console.log('📦 URL:', url);
    console.log('📦 Body:', body);

    const txData = extractTransactionData(body);
    console.log('📦 Transaction data:', txData);

    // Send to Vetra for analysis
    window.postMessage({
      type: 'VETRA_RPC_TRANSACTION',
      id: Math.random().toString(36).substring(7),
      payload: {
        url,
        method: txData?.method,
        params: txData?.params,
        body,
      }
    }, '*');

    // For now, allow the transaction to proceed
    console.log('✅ Allowing transaction to proceed (analysis sent)');
  }

  // Call original fetch
  return originalFetch.apply(this, args);
};

console.log('✅ Fetch interceptor installed');

/**
 * Intercept XMLHttpRequest
 */
const originalXHROpen = XMLHttpRequest.prototype.open;
const originalXHRSend = XMLHttpRequest.prototype.send;

XMLHttpRequest.prototype.open = function(method: string, url: string | URL, ...args: any[]) {
  (this as any)._vetraUrl = url.toString();
  return originalXHROpen.apply(this, [method, url, ...args]);
};

XMLHttpRequest.prototype.send = function(body?: Document | XMLHttpRequestBodyInit | null) {
  const url = (this as any)._vetraUrl;
  
  if (url && isSolanaTransaction(url, body)) {
    console.log('🔥 SOLANA TRANSACTION DETECTED VIA XHR!');
    console.log('📦 URL:', url);
    console.log('📦 Body:', body);

    const txData = extractTransactionData(body as string);

    // Send to Vetra for analysis
    window.postMessage({
      type: 'VETRA_RPC_TRANSACTION',
      id: Math.random().toString(36).substring(7),
      payload: {
        url,
        method: txData?.method,
        params: txData?.params,
        body,
      }
    }, '*');

    console.log('✅ Allowing transaction to proceed (analysis sent)');
  }

  return originalXHRSend.apply(this, [body]);
};

console.log('✅ XMLHttpRequest interceptor installed');

/**
 * Listen for transaction responses from extension
 */
window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  
  const message = event.data;
  
  if (message?.type === 'VETRA_RPC_ANALYSIS_COMPLETE') {
    console.log('📊 Vetra analysis complete:', message.analysis);
    
    // Could show notification or update UI here
    if (message.analysis?.riskLevel === 'high') {
      console.warn('⚠️ HIGH RISK TRANSACTION DETECTED!');
      // Could block here, but for now just log
    }
  }
});

console.log('✅ Vetra RPC Interceptor fully initialized!');
console.log('🛡️ Monitoring all Solana RPC calls...');

export {};

