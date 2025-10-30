-- Manual script to allow NULL user_id in transactions table
-- Run this in Railway PostgreSQL console

-- Step 1: Check current constraint
SELECT 
  column_name, 
  is_nullable, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'transactions' 
  AND column_name = 'user_id';

-- Step 2: Alter column to allow NULL
ALTER TABLE transactions 
ALTER COLUMN user_id DROP NOT NULL;

-- Step 3: Verify the change
SELECT 
  column_name, 
  is_nullable, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'transactions' 
  AND column_name = 'user_id';

-- Should show: is_nullable = 'YES'

-- Step 4: Test with sample insert (will rollback)
BEGIN;
INSERT INTO transactions (
  user_id,
  signature,
  type,
  from_address,
  to_address,
  amount,
  risk_score,
  risk_level
) VALUES (
  NULL,  -- Testing NULL user_id
  'test_signature_' || NOW()::text,
  'transfer',
  'test_from',
  'test_to',
  0.1,
  50,
  'medium'
);
ROLLBACK;  -- Don't keep the test data

-- ✅ If no error above, NULL user_id is working!

