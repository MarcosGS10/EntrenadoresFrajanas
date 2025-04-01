/*
  # Fix user profile creation for authenticated users

  1. Changes
    - Update trigger function to automatically create user profiles
    - Add trigger to handle auth.users insertions
    - Ensure all authenticated users get a profile
  
  2. Security
    - Maintain existing security policies
*/

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS handle_user_creation_trigger ON users;
DROP FUNCTION IF EXISTS handle_user_creation();

-- Create a new trigger function that creates user profiles
CREATE OR REPLACE FUNCTION handle_auth_user_creation()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a new profile in public.users if it doesn't exist
  INSERT INTO public.users (id, email, nombre, role, "createdAt")
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
    'entrenador',
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_auth_user_creation();

-- Create missing profiles for existing auth users
INSERT INTO public.users (id, email, nombre, role, "createdAt")
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'nombre', split_part(au.email, '@', 1)),
  'entrenador',
  NOW()
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- Ensure admin user has correct role
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'marcosgomezsoria1997@gmail.com';