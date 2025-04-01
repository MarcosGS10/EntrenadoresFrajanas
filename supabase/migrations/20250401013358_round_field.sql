/*
  # Fix RLS policies to prevent infinite recursion - Final Fix

  1. Changes
    - Remove all existing policies and start fresh
    - Implement minimal RLS policies without recursion
    - Use direct auth.uid() checks only
  
  2. Security
    - Maintain basic security with simplified implementation
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "select_users" ON users;
DROP POLICY IF EXISTS "update_users" ON users;
DROP POLICY IF EXISTS "insert_users" ON users;
DROP POLICY IF EXISTS "allow_read" ON users;
DROP POLICY IF EXISTS "allow_insert" ON users;
DROP POLICY IF EXISTS "allow_update" ON users;
DROP POLICY IF EXISTS "allow_select" ON users;

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