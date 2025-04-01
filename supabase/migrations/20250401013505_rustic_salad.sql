/*
  # Add ping function for connection testing

  1. Changes
    - Add a simple ping function to test database connectivity
    - Function returns true if connection is successful
*/

-- Create a simple ping function for connection testing
CREATE OR REPLACE FUNCTION ping()
RETURNS boolean AS $$
BEGIN
  RETURN true;
END;
$$ LANGUAGE plpgsql;