#!/usr/bin/env bash
# Deploy Vetra attestation program to Solana devnet
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v anchor >/dev/null 2>&1; then
  echo "Install Anchor (https://www.anchor-lang.com/docs/installation) first."
  exit 1
fi

if ! command -v solana >/dev/null 2>&1; then
  echo "Install Solana CLI first."
  exit 1
fi

echo "→ Configuring Solana CLI for devnet"
solana config set --url https://api.devnet.solana.com

echo "→ Building"
anchor build

PROGRAM_ID="$(solana address -k target/deploy/attestation-keypair.json 2>/dev/null || true)"
if [[ -z "${PROGRAM_ID}" ]]; then
  echo "Generating program keypair…"
  solana-keygen new -o target/deploy/attestation-keypair.json --no-bip39-passphrase --force
  PROGRAM_ID="$(solana address -k target/deploy/attestation-keypair.json)"
fi

echo "Program ID: ${PROGRAM_ID}"
echo "Update declare_id! and Anchor.toml + ATTESTATION_PROGRAM_ID env to: ${PROGRAM_ID}"

echo "→ Deploying to devnet"
anchor deploy --provider.cluster devnet

echo "→ Copy IDL"
mkdir -p attestation
cp -f target/idl/attestation.json attestation/idl.json 2>/dev/null || \
  cp -f target/idl/*.json attestation/idl.json

echo "Done. Set in backend .env:"
echo "  ATTESTATION_PROGRAM_ID=${PROGRAM_ID}"
echo "  ATTESTATION_AUTHORITY_SECRET=[...64-byte secret key JSON array...]"
echo "  VITE_ATTESTATION_PROGRAM_ID=${PROGRAM_ID}"
