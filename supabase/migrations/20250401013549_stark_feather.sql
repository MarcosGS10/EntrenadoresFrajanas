/*
  # Add ping function for connection testing

  1. Changes
    - Add a simple ping function to test database connectivity
    - Grant execute permission to authenticated users
    - Function returns true if connection is successful
*/

-- Create a simple ping function for connection testing
CREATE OR REPLACE FUNCTION public.ping()
RETURNS boolean AS $$
BEGIN
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.ping() TO authenticated;