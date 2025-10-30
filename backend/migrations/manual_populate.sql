-- Manual script to consolidate preferences into settings
-- Run this directly in Railway's PostgreSQL console

-- Step 1: Check current state
SELECT 
  id,
  email,
  settings
FROM users
LIMIT 5;

-- Step 2: Merge preferences into settings (consolidates everything)
UPDATE users
SET settings = settings || preferences,
    updated_at = CURRENT_TIMESTAMP
WHERE preferences IS NOT NULL 
  AND preferences != '{}'::jsonb;

-- Step 3: Populate default settings for empty settings
UPDATE users
SET
  settings = '{
    "language": "en",
    "theme": "dark",
    "soundAlerts": true,
    "notifications": {
      "email": true,
      "push": true,
      "risk_alerts": true,
      "attestation_updates": true
    },
    "ai_language": "en",
    "aiLanguage": "en",
    "ai_rigidity": 50,
    "aiRigidity": 50,
    "share_insights": false,
    "shareInsights": false,
    "risk_threshold": 50,
    "auto_block_high_risk": false,
    "show_attestations": true,
    "network": "mainnet-beta",
    "rpc_endpoint": "https://api.mainnet-beta.solana.com",
    "transaction_memory": true,
    "transactionMemory": true,
    "smart_contract_fingerprints": true,
    "smartContractFingerprints": true
  }'::jsonb,
  updated_at = CURRENT_TIMESTAMP
WHERE settings = '{}'::jsonb OR settings IS NULL;

-- Step 4: Drop preferences column
ALTER TABLE users DROP COLUMN IF EXISTS preferences;

-- Step 5: Verify the update
SELECT 
  id,
  email,
  settings,
  updated_at
FROM users
ORDER BY updated_at DESC
LIMIT 10;
