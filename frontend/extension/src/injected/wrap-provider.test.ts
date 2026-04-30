import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  installSolanaInterceptor,
  tryMonkeyPatchExistingProvider,
  VETRA_TRANSACTION_REQUEST,
} from './wrap-provider';

describe('wrap-provider', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  function makeWindow(): any {
    const w: any = {
      postMessage: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      setTimeout: (fn: () => void, ms?: number) => globalThis.setTimeout(fn, ms ?? 0),
      clearTimeout: (id: ReturnType<typeof setTimeout>) => globalThis.clearTimeout(id),
    };
    return w;
  }

  it('installSolanaInterceptor: assignment triggers postMessage on signTransaction', async () => {
    const w = makeWindow();
    installSolanaInterceptor(w, { awaitAnalysis: false });

    const inner = vi.fn(async (tx: unknown) => tx);
    w.solana = { isPhantom: true, signTransaction: inner };

    const client = w.solana;
    expect(client).toBeTruthy();
    await client.signTransaction({ x: 1 });

    expect(w.postMessage).toHaveBeenCalled();
    const call = w.postMessage.mock.calls.find(
      (c: any[]) => c[0]?.type === VETRA_TRANSACTION_REQUEST
    );
    expect(call).toBeTruthy();
    expect(call[0].payload.method).toBe('signTransaction');
    expect(inner).toHaveBeenCalledWith({ x: 1 });
  });

  it('tryMonkeyPatchExistingProvider patches in place when awaitAnalysis is false', async () => {
    const w = makeWindow();
    const inner = vi.fn(async (tx: unknown) => tx);
    w.solana = { signTransaction: inner };

    const ok = tryMonkeyPatchExistingProvider(w, false, 5000);
    expect(ok).toBe(true);

    await w.solana.signTransaction({ y: 2 });

    expect(w.postMessage).toHaveBeenCalled();
    const msg = w.postMessage.mock.calls.find(
      (c: any[]) => c[0]?.type === VETRA_TRANSACTION_REQUEST
    )?.[0];
    expect(msg?.payload?.transaction).toEqual({ y: 2 });
    expect(inner).toHaveBeenCalled();
  });
});
