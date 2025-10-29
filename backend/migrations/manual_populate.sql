-- Manual script to populate default preferences and settings
-- Run this directly in Railway's PostgreSQL console

UPDATE users
SET 
  preferences = '{
    "language": "en",
    "theme": "dark",
    "notifications": {
      "email": true,
      "push": true,
      "risk_alerts": true,
      "attestation_updates": true
    },
    "ai_language": "en",
    "share_insights": false
  }'::jsonb,
  settings = '{
    "risk_threshold": 50,
    "auto_block_high_risk": false,
    "show_attestations": true,
    "network": "mainnet-beta",
    "rpc_endpoint": "https://api.mainnet-beta.solana.com",
    "ai_rigidity": 50,
    "transaction_memory": true,
    "smart_contract_fingerprints": true
  }'::jsonb,
  updated_at = CURRENT_TIMESTAMP
WHERE 
  (preferences = '{}'::jsonb OR preferences IS NULL)
  OR (settings = '{}'::jsonb OR settings IS NULL);

-- Verify the update
SELECT 
  id,
  email,
  preferences,
  settings
FROM users
LIMIT 5;

