import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const root = fileURLToPath(new URL('.', import.meta.url));
const distDir = resolve(root, 'dist');

if (!existsSync(resolve(distDir, 'manifest.json'))) {
  // eslint-disable-next-line no-console
  console.warn(
    '[playwright] dist/manifest.json não encontrado. Execute `pnpm run build` na pasta frontend/extension antes dos e2e.'
  );
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 20_000 },
  reporter: [['list']],
  use: {
    ...devices['Desktop Chrome'],
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npx http-server test/fixtures -p 8765 -c-1 --silent',
    url: 'http://127.0.0.1:8765/wallet-mock.html',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
