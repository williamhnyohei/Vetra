import { test, expect, chromium } from '@playwright/test';
import { existsSync, mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const extensionPath = resolve(root, 'dist');

test.beforeAll(() => {
  test.skip(
    !existsSync(join(extensionPath, 'manifest.json')),
    'Extensão não buildada: rode `pnpm run build` em frontend/extension'
  );
});

test('fixture: hook e signTransaction após solana tardio', async () => {
  test.skip(process.env.SKIP_PLAYWRIGHT_E2E === '1', 'SKIP_PLAYWRIGHT_E2E=1');

  const userDataDir = mkdtempSync(join(tmpdir(), 'vetra-pw-'));
  let context;
  try {
    context = await chromium.launchPersistentContext(userDataDir, {
      headless: !!process.env.CI,
      // O Chromium do Playwright passa --disable-extensions por padrão, o que anula --load-extension.
      ignoreDefaultArgs: ['--disable-extensions'],
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--no-sandbox',
      ],
    });
  } catch (e: unknown) {
    const msg = String((e as Error)?.message ?? e);
    if (/EPERM|spawn/i.test(msg)) {
      test.skip(true, 'Ambiente bloqueou o spawn do Chrome (EPERM). Rode `pnpm exec playwright test` localmente.');
    }
    throw e;
  }

  try {
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:8765/wallet-mock.html', {
      waitUntil: 'domcontentloaded',
    });

    await page.waitForFunction(
      () =>
        ['installed', 'late_patched'].includes(String((window as any).__VETRA_HOOK__)),
      { timeout: 15_000 }
    );

    const hook = await page.evaluate(() => (window as any).__VETRA_HOOK__);
    expect(['installed', 'late_patched']).toContain(hook);

    await page.getByRole('button', { name: 'Sign mock' }).click();

    await page.waitForFunction(() => (window as any).__signCalls >= 1, { timeout: 10_000 });

    const signCalls = await page.evaluate(() => (window as any).__signCalls);
    expect(signCalls).toBeGreaterThanOrEqual(1);
  } finally {
    await context.close();
    try {
      rmSync(userDataDir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
});
