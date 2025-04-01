/*
  # Fix user synchronization and timestamps

  1. Changes
    - Ensure proper timestamp handling
    - Fix user synchronization
    - Add proper indexes
    - Update trigger function
  
  2. Security
    - Maintain existing security policies
*/

-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_auth_user_creation();

-- Create improved trigger function
CREATE OR REPLACE FUNCTION handle_auth_user_creation()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update user profile with proper timestamps
  INSERT INTO public.users (
    id,
    email,
    nombre,
    role,
    "createdAt"
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'nombre',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    CASE 
      WHEN NEW.email = 'marcosgomezsoria1997@gmail.com' THEN 'admin'
      ELSE 'entrenador'
    END,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    nombre = COALESCE(
      EXCLUDED.nombre,
      users.nombre,
      split_part(EXCLUDED.email, '@', 1)
    ),
    role = CASE 
      WHEN EXCLUDED.email = 'marcosgomezsoria1997@gmail.com' THEN 'admin'
      ELSE users.role 
    END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_auth_user_creation();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_createdat ON users("createdAt");

-- Synchronize all existing auth users
INSERT INTO public.users (
  id,
  email,
  nombre,
  role,
  "createdAt"
)
SELECT 
  au.id,
  au.email,
  COALESCE(
    au.raw_user_meta_data->>'nombre',
    au.raw_user_meta_data->>'name',
    split_part(au.email, '@', 1)
  ),
  CASE 
    WHEN au.email = 'marcosgomezsoria1997@gmail.com' THEN 'admin'
    ELSE 'entrenador'
  END,
  NOW()
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.id = au.id
)
ON CONFLICT (id) DO UPDATE
SET
  email = EXCLUDED.email,
  nombre = COALESCE(
    EXCLUDED.nombre,
    users.nombre,
    split_part(EXCLUDED.email, '@', 1)
  ),
  role = CASE 
    WHEN EXCLUDED.email = 'marcosgomezsoria1997@gmail.com' THEN 'admin'
    ELSE users.role 
  END;

-- Update timestamps for existing users that might have NULL values
UPDATE public.users
SET "createdAt" = NOW()
WHERE "createdAt" IS NULL;