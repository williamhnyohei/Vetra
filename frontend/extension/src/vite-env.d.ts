/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SOLANA_RPC_URL: string;
  readonly VITE_SOLANA_NETWORK: string;
  readonly VITE_ATTESTATION_PROGRAM_ID: string;
  readonly VITE_ENABLE_ATTESTATIONS: string;
  readonly VITE_ENABLE_ANALYTICS: string;
  readonly VITE_DEBUG: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}


