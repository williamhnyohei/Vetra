import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync, cpSync } from 'fs';

function copyExtensionStatic() {
  return {
    name: 'copy-extension-static',
    closeBundle() {
      const dist = resolve(__dirname, 'dist');
      mkdirSync(dist, { recursive: true });
      copyFileSync(resolve(__dirname, 'alert.html'), resolve(dist, 'alert.html'));
      const pub = resolve(__dirname, 'public');
      if (existsSync(pub)) {
        cpSync(pub, dist, { recursive: true });
      }
      // UI icons live in ../assets — copy into dist/assets for /assets/*.svg
      const sharedAssets = resolve(__dirname, '../assets');
      const distAssets = resolve(dist, 'assets');
      if (existsSync(sharedAssets)) {
        mkdirSync(distAssets, { recursive: true });
        cpSync(sharedAssets, distAssets, { recursive: true });
      }
    },
  };
}

function iifeContentAndInjected() {
  return {
    name: 'iife-content-and-injected',
    generateBundle(_options: unknown, bundle: Record<string, any>) {
      for (const fileName of ['injected.js', 'content.js']) {
        const chunk = bundle[fileName];
        if (chunk?.type === 'chunk' && typeof chunk.code === 'string') {
          // Strip residual ESM export marks Vite may leave
          const body = chunk.code.replace(/export\s*\{[^}]*\};?/g, '');
          chunk.code = `(function(){\n"use strict";\n${body}\n})();\n`;
        }
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), copyExtensionStatic(), iifeContentAndInjected()],
  define: {
    // Ensure no raw import.meta survives into classic content/injected scripts
    'import.meta.env.VITE_VETRA_AWAIT_ANALYSIS': JSON.stringify('true'),
    'import.meta.env.MODE': JSON.stringify('production'),
    'import.meta.env.DEV': 'false',
    'import.meta.env.PROD': 'true',
  },
  build: {
    outDir: 'dist',
    modulePreload: false,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'index.html'),
        background: resolve(__dirname, 'src/background/index.ts'),
        content: resolve(__dirname, 'src/content/index.ts'),
        injected: resolve(__dirname, 'src/injected/index.ts'),
        alert: resolve(__dirname, 'src/alert/index.ts'),
      },
      output: {
        entryFileNames: () => '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
