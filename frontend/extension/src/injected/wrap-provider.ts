/**
 * MAIN-world Solana provider interception (unit-testable).
 * Posts VETRA_TRANSACTION_REQUEST to the page; content script bridges to the background.
 */

import { VETRA_AWAIT_ANALYSIS } from './vetra-config';

export type VetraHookStatus = 'installed' | 'failed' | 'late_patched' | 'pending';

export const VETRA_TRANSACTION_REQUEST = 'VETRA_TRANSACTION_REQUEST' as const;

/** Legacy message types still bridged by content script */
export const LEGACY_INTERCEPT_TYPES = [
  'VETRA_TX_INTERCEPTED',
  'VETRA_TRANSACTION_INTERCEPTED',
] as const;

const SIGN_METHODS = [
  'signTransaction',
  'signAllTransactions',
  'signAndSendTransaction',
] as const;

export type SignMethod = (typeof SIGN_METHODS)[number];

function isSignMethod(prop: string | symbol): prop is SignMethod {
  return typeof prop === 'string' && (SIGN_METHODS as readonly string[]).includes(prop);
}

function randomId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function setHookFlag(w: Window, status: VetraHookStatus, detail?: string): void {
  try {
    (w as any).__VETRA_HOOK__ = status;
    if (detail) (w as any).__VETRA_HOOK_DETAIL__ = detail;
  } catch {
    /* ignore */
  }
}

function postIntercept(
  w: Window,
  method: string | symbol,
  transaction: unknown,
  requestId: string
): void {
  w.postMessage(
    {
      type: VETRA_TRANSACTION_REQUEST,
      id: requestId,
      payload: { method: String(method), transaction },
    },
    '*'
  );
}

function waitForAnalysisResponse(
  w: Window,
  requestId: string,
  timeoutMs: number
): Promise<{ approved: boolean; shouldBlock: boolean }> {
  return new Promise((resolve) => {
    const timeout = w.setTimeout(() => {
      w.removeEventListener('message', listener);
      resolve({ approved: true, shouldBlock: false });
    }, timeoutMs);

    const listener = (event: MessageEvent) => {
      if (
        event.source === w &&
        event.data?.type === 'VETRA_TRANSACTION_RESPONSE' &&
        event.data?.id === requestId
      ) {
        w.clearTimeout(timeout);
        w.removeEventListener('message', listener);
        const response = event.data?.response || {};
        const shouldBlock = response.riskLevel === 'high' && !response.userApproved;
        resolve({
          approved: response.userApproved ?? true,
          shouldBlock,
        });
      }
    };

    w.addEventListener('message', listener);
  });
}

export function createSigningProxy(
  target: any,
  w: Window,
  options: { awaitAnalysis: boolean; analysisTimeoutMs: number }
): any {
  return new Proxy(target, {
    get(t, prop, receiver) {
      const original = Reflect.get(t, prop, receiver);

      if (!isSignMethod(prop) || typeof original !== 'function') {
        return original;
      }

      return async function interceptSign(this: unknown, ...args: any[]) {
        const requestId = randomId();
        postIntercept(w, prop, args[0], requestId);

        if (options.awaitAnalysis) {
          const decision = await waitForAnalysisResponse(w, requestId, options.analysisTimeoutMs);
          if (decision.shouldBlock || !decision.approved) {
            throw new Error('Transaction blocked by Vetra security analysis');
          }
        }

        return original.apply(t, args);
      };
    },
  });
}

/**
 * If window.solana already exists as a plain object, patch methods in place (non-configurable property fallback).
 */
export function tryMonkeyPatchExistingProvider(
  w: any,
  awaitAnalysis: boolean,
  analysisTimeoutMs: number
): boolean {
  const sol = w.solana;
  if (!sol || typeof sol !== 'object') return false;
  if ((sol as any).__vetra_method_patched) return true;

  let patched = 0;
  for (const m of SIGN_METHODS) {
    const orig = sol[m];
    if (typeof orig !== 'function') continue;
    const methodName = m;
    (sol as any)[m] = async function patchedSign(this: unknown, ...args: any[]) {
      const requestId = randomId();
      postIntercept(w as Window, methodName, args[0], requestId);
      if (awaitAnalysis) {
        const decision = await waitForAnalysisResponse(w as Window, requestId, analysisTimeoutMs);
        if (decision.shouldBlock || !decision.approved) {
          throw new Error('Transaction blocked by Vetra security analysis');
        }
      }
      return orig.apply(sol, args);
    };
    patched += 1;
  }
  if (patched > 0) {
    try {
      (sol as any).__vetra_method_patched = true;
    } catch {
      /* ignore */
    }
  }
  return patched > 0;
}

export interface InstallSolanaInterceptorOptions {
  /** Wait for VETRA_TRANSACTION_RESPONSE before calling the wallet (default from VETRA_AWAIT_ANALYSIS env). */
  awaitAnalysis?: boolean;
  analysisTimeoutMs?: number;
}

/**
 * Installs getter/setter on window.solana so the first assignment (wallet) is wrapped with a Proxy.
 */
export function installSolanaInterceptor(
  w: Window & typeof globalThis,
  options: InstallSolanaInterceptorOptions = {}
): void {
  const awaitAnalysis = options.awaitAnalysis ?? VETRA_AWAIT_ANALYSIS;
  const analysisTimeoutMs = options.analysisTimeoutMs ?? 30_000;

  if ((w as any).__VETRA_INTERCEPTOR__) {
    setHookFlag(w, 'installed', 'already_present');
    return;
  }
  (w as any).__VETRA_INTERCEPTOR__ = true;

  let stored: any = null;
  let wrapped: any = null;

  setHookFlag(w, 'pending');

  try {
    Object.defineProperty(w, 'solana', {
      get() {
        return wrapped || stored;
      },
      set(newProvider: any) {
        stored = newProvider;
        if (!newProvider) {
          wrapped = null;
          return;
        }
        wrapped = createSigningProxy(newProvider, w, { awaitAnalysis, analysisTimeoutMs });
      },
      configurable: true,
      enumerable: true,
    });
    setHookFlag(w, 'installed');
  } catch (e: any) {
    setHookFlag(w, 'failed', e?.message || String(e));
    if (tryMonkeyPatchExistingProvider(w, awaitAnalysis, analysisTimeoutMs)) {
      setHookFlag(w, 'late_patched', 'monkey_patch_existing');
    }
  }

  if ((w as any).__VETRA_HOOK__ === 'failed') {
    const pollUntil = Date.now() + 10_000;
    const tick = () => {
      if (
        (w as any).solana &&
        tryMonkeyPatchExistingProvider(w, awaitAnalysis, analysisTimeoutMs)
      ) {
        setHookFlag(w, 'late_patched', 'polling_monkey_patch');
        return;
      }
      if (Date.now() < pollUntil) {
        w.setTimeout(tick, 250);
      }
    };
    w.setTimeout(tick, 0);
  }
}
