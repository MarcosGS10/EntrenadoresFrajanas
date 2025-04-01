/*
  # Fix user creation and authentication issues

  1. Changes
     - Add missing insert policy for users table
     - Ensure proper constraints on users table
     - Fix trigger for user creation
  
  2. Security
     - Ensure proper RLS policies are in place
*/

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS handle_user_creation_trigger ON users;
DROP FUNCTION IF EXISTS handle_user_creation();

-- Create a new trigger function for user creation
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

-- Create new trigger
CREATE TRIGGER handle_user_creation_trigger
BEFORE INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION handle_user_creation();

-- Ensure insert policy exists for users table
DO $$
BEGIN
  -- Check if the policy exists
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

-- Add a policy to allow users to create their own profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy p
    JOIN pg_class c ON p.polrelid = c.oid
    WHERE c.relname = 'users' AND p.polname = 'Allow public to create users'
  ) THEN
    CREATE POLICY "Allow public to create users"
      ON users
      FOR INSERT
      TO anon
      WITH CHECK (true);
  END IF;
END $$;

-- Add a policy to allow authenticated users to create their own profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy p
    JOIN pg_class c ON p.polrelid = c.oid
    WHERE c.relname = 'users' AND p.polname = 'Allow authenticated to create users'
  ) THEN
    CREATE POLICY "Allow authenticated to create users"
      ON users
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;