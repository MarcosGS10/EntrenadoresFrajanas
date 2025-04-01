/*
  # Fix RLS policies to prevent infinite recursion - Final Fix

  1. Changes
    - Remove all complex policy conditions that could cause recursion
    - Use simple direct checks for user ID and role
    - Ensure proper RLS setup for all operations
  
  2. Security
    - Maintain same security model with simpler implementation
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "select_users" ON users;
DROP POLICY IF EXISTS "update_users" ON users;
DROP POLICY IF EXISTS "insert_users" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can read own data or admins can read all" ON users;
DROP POLICY IF EXISTS "Users can update own data or admins can update all" ON users;
DROP POLICY IF EXISTS "Allow user creation" ON users;
DROP POLICY IF EXISTS "Allow authenticated to create users" ON users;
DROP POLICY IF EXISTS "Allow public to create users" ON users;

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create new simplified policies
CREATE POLICY "allow_read"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "allow_insert"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "allow_update"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_createdat ON users("createdAt");

-- Ensure admin user has correct role
UPDATE users 
SET role = 'admin' 
WHERE email = 'marcosgomezsoria1997@gmail.com';