/**
 * EARLY INJECTION - Runs BEFORE everything else
 * This is injected directly into the page via content script
 * BEFORE any other scripts (including Phantom) load
 */

(function() {
  'use strict';
  
  console.log('🔥🔥🔥 VETRA EARLY INJECTION - RUNNING BEFORE ALL SCRIPTS 🔥🔥🔥');
  
  // Flag to prevent double injection
  if ((window as any).__VETRA_EARLY_INJECTED__) {
    console.log('⏭️ Already injected, skipping');
    return;
  }
  (window as any).__VETRA_EARLY_INJECTED__ = true;

  // Storage for the wrapped provider
  let _wrappedProvider: any = null;
  let _originalProvider: any = null;
  
  /**
   * Define property setter IMMEDIATELY before anything else
   */
  try {
    console.log('🔥 Defining window.solana property setter NOW (before Phantom)...');
    
    Object.defineProperty(window, 'solana', {
      get() {
        const result = _wrappedProvider || _originalProvider;
        if (result && _wrappedProvider) {
          console.log('🟢 Getter: Returning WRAPPED provider');
        } else if (result) {
          console.log('🟡 Getter: Returning ORIGINAL provider (not wrapped yet)');
        }
        return result;
      },
      
      set(newProvider) {
        console.log('🔥🔥🔥 PHANTOM IS SETTING window.solana RIGHT NOW! 🔥🔥🔥');
        console.log('Provider:', newProvider);
        
        if (!newProvider) {
          _originalProvider = null;
          _wrappedProvider = null;
          return;
        }
        
        _originalProvider = newProvider;
        
        // Create wrapped version IMMEDIATELY
        console.log('🔨 Creating Proxy wrapper...');
        
        _wrappedProvider = new Proxy(newProvider, {
          get(target, prop, receiver) {
            const original = Reflect.get(target, prop, receiver);
            
            // Intercept signing methods
            if (prop === 'signTransaction' || prop === 'signAllTransactions' || prop === 'signAndSendTransaction') {
              console.log(`🎯 Proxy: Intercepting ${String(prop)}!`);
              
              return async function(...args: any[]) {
                console.log('🔐🔐🔐 ===== VETRA INTERCEPTED TRANSACTION ===== 🔐🔐🔐');
                console.log(`Method: ${String(prop)}`);
                console.log('Arguments:', args);
                console.log('Transaction:', args[0]);
                
                // Send to extension for analysis
                window.postMessage({
                  type: 'VETRA_TRANSACTION_INTERCEPTED',
                  method: String(prop),
                  transaction: args[0],
                  timestamp: Date.now(),
                }, '*');
                
                // For now, allow transaction (we'll add blocking later)
                console.log('✅ Allowing transaction to proceed (analysis sent to backend)');
                return original.apply(target, args);
              };
            }
            
            return original;
          }
        });
        
        console.log('✅✅✅ PROXY CREATED AND SAVED! ✅✅✅');
        console.log('🛡️ All future signTransaction calls will be intercepted!');
      },
      
      configurable: true,
      enumerable: true
    });
    
    console.log('✅✅✅ PROPERTY SETTER INSTALLED SUCCESSFULLY! ✅✅✅');
    console.log('🛡️ Vetra is now ready to intercept Phantom!');
    
  } catch (error) {
    console.error('❌❌❌ CRITICAL ERROR: Could not install property setter!', error);
  }
  
})();

export {};

