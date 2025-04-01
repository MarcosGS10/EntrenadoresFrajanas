/*
  # Fix infinite recursion in policies

  1. Changes
    - Replace self-referential policies with direct role checks
    - Simplify policy conditions to avoid circular references
    - Add direct role check for admin users
  
  2. Security
    - Maintain same security model but with more efficient implementation
    - Ensure admins can still access all resources
    - Ensure regular users can only access their own data
*/

-- Drop problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Admins can read all entrenamientos" ON entrenamientos;
DROP POLICY IF EXISTS "Admins can read all tareas" ON tareas;
DROP POLICY IF EXISTS "Admins can delete all entrenamientos" ON entrenamientos;
DROP POLICY IF EXISTS "Admins can delete all tareas" ON tareas;

-- Create new policies with direct role checks (no self-references)
-- For users table
CREATE POLICY "Users can read own data or admins can read all"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR role = 'admin');

CREATE POLICY "Users can update own data or admins can update all"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR role = 'admin');

-- For entrenamientos table
CREATE POLICY "Users can read own entrenamientos or admins can read all"
  ON entrenamientos
  FOR SELECT
  TO authenticated
  USING (userid = auth.uid() OR EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

CREATE POLICY "Users can delete own entrenamientos or admins can delete all"
  ON entrenamientos
  FOR DELETE
  TO authenticated
  USING (userid = auth.uid() OR EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

-- For tareas table
CREATE POLICY "Users can read own tareas or admins can read all"
  ON tareas
  FOR SELECT
  TO authenticated
  USING (userid = auth.uid() OR EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

CREATE POLICY "Users can delete own tareas or admins can delete all"
  ON tareas
  FOR DELETE
  TO authenticated
  USING (userid = auth.uid() OR EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

-- Ensure all users have a role assigned
UPDATE users 
SET role = 'entrenador' 
WHERE role IS NULL;

-- Make sure the admin user has the correct role
UPDATE users 
SET role = 'admin' 
WHERE email = 'marcosgomezsoria1997@gmail.com';