/*
  # Fix RLS policies to prevent infinite recursion

  1. Changes
    - Drop existing policies that may cause recursion
    - Create simplified policies that avoid circular dependencies
    - Add basic indexes for performance
  
  2. Security
    - Allow all authenticated users to read user data
    - Allow users to modify only their own data
    - Maintain admin role assignment
*/

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "select_users" ON users;
DROP POLICY IF EXISTS "update_users" ON users;
DROP POLICY IF EXISTS "insert_users" ON users;
DROP POLICY IF EXISTS "allow_read" ON users;
DROP POLICY IF EXISTS "allow_insert" ON users;
DROP POLICY IF EXISTS "allow_update" ON users;
DROP POLICY IF EXISTS "allow_select" ON users;
DROP POLICY IF EXISTS "allow_select_all" ON users;
DROP POLICY IF EXISTS "allow_insert_own" ON users;
DROP POLICY IF EXISTS "allow_update_own" ON users;

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create minimal policies without any recursion
CREATE POLICY "allow_select_all"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "allow_insert_own"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "allow_update_own"
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