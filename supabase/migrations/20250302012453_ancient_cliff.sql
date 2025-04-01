/*
  # Fix user creation and standardize column naming

  1. Changes
     - Ensure users table has the correct structure
     - Add missing columns with proper constraints
     - Fix insert trigger to handle camelCase column names
  
  2. Security
     - Add insert policy for users table
*/

-- Drop the existing trigger function if it exists
DROP FUNCTION IF EXISTS sync_timestamp_columns CASCADE;

-- Create a new trigger function that works with camelCase
CREATE OR REPLACE FUNCTION handle_user_creation()
RETURNS TRIGGER AS $$
BEGIN
  -- Set default values for any NULL fields
  IF NEW."createdAt" IS NULL THEN
    NEW."createdAt" := now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS handle_user_creation_trigger ON users;

-- Create new trigger
CREATE TRIGGER handle_user_creation_trigger
BEFORE INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION handle_user_creation();

-- Add insert policy for users table if it doesn't exist
DO $$
BEGIN
  -- Check if the policy exists using pg_policy and pg_class instead
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy p
    JOIN pg_class c ON p.polrelid = c.oid
    WHERE c.relname = 'users' AND p.polname = 'Users can insert their own data'
  ) THEN
    -- Create the policy if it doesn't exist
    CREATE POLICY "Users can insert their own data"
      ON users
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Make sure all required columns exist and have proper constraints
DO $$
BEGIN
  -- Ensure createdAt column exists and has proper constraints
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'createdAt'
  ) THEN
    ALTER TABLE users ADD COLUMN "createdAt" timestamptz DEFAULT now() NOT NULL;
  ELSE
    -- Make sure it's NOT NULL
    ALTER TABLE users ALTER COLUMN "createdAt" SET NOT NULL;
  END IF;
  
  -- Ensure nombre column has NOT NULL constraint
  ALTER TABLE users ALTER COLUMN nombre SET NOT NULL;
  
  -- Ensure email column has NOT NULL and UNIQUE constraints
  ALTER TABLE users ALTER COLUMN email SET NOT NULL;
  
  -- Add UNIQUE constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'users' AND c.conname = 'users_email_unique'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);
  END IF;
END $$;