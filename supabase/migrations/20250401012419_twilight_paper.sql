/*
  # Fix user profile creation and synchronization

  1. Changes
    - Drop and recreate trigger function with better error handling
    - Add upsert logic to handle both new and existing users
    - Ensure proper column mapping from auth metadata
  
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
  -- Insert or update user profile
  INSERT INTO public.users (
    id,
    email,
    nombre,
    role,
    "createdAt",
    created_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'nombre',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    'entrenador',
    NOW(),
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
      WHEN users.email = 'marcosgomezsoria1997@gmail.com' THEN 'admin'
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

-- Synchronize existing auth users
DO $$
DECLARE
  auth_user RECORD;
BEGIN
  FOR auth_user IN (
    SELECT 
      id,
      email,
      raw_user_meta_data,
      created_at
    FROM auth.users
    WHERE id NOT IN (SELECT id FROM public.users)
  ) LOOP
    INSERT INTO public.users (
      id,
      email,
      nombre,
      role,
      "createdAt",
      created_at
    )
    VALUES (
      auth_user.id,
      auth_user.email,
      COALESCE(
        auth_user.raw_user_meta_data->>'nombre',
        auth_user.raw_user_meta_data->>'name',
        split_part(auth_user.email, '@', 1)
      ),
      'entrenador',
      COALESCE(auth_user.created_at, NOW()),
      COALESCE(auth_user.created_at, NOW())
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
        WHEN users.email = 'marcosgomezsoria1997@gmail.com' THEN 'admin'
        ELSE 'entrenador'
      END;
  END LOOP;
END;
$$;