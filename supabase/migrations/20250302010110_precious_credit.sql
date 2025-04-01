/*
  # Fix column names and add missing columns

  1. Changes
     - Add createdAt column to users table
     - Add indexes for better performance
     - Add trigger to keep column names in sync
  
  2. Security
     - No changes to existing security policies
*/

-- Check if createdAt column exists in users table, if not add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'createdAt'
  ) THEN
    ALTER TABLE users ADD COLUMN "createdAt" timestamptz DEFAULT now();
  END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_entrenamientos_userId ON entrenamientos(userId);
CREATE INDEX IF NOT EXISTS idx_tareas_userId ON tareas(userId);
CREATE INDEX IF NOT EXISTS idx_tareas_entrenamientoId ON tareas(entrenamientoId);

-- Add triggers to keep both columns in sync
CREATE OR REPLACE FUNCTION sync_timestamp_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.created_at IS NOT NULL AND NEW."createdAt" IS NULL THEN
      NEW."createdAt" := NEW.created_at;
    ELSIF NEW."createdAt" IS NOT NULL AND NEW.created_at IS NULL THEN
      NEW.created_at := NEW."createdAt";
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.created_at IS DISTINCT FROM OLD.created_at AND NEW."createdAt" IS NOT DISTINCT FROM OLD."createdAt" THEN
      NEW."createdAt" := NEW.created_at;
    ELSIF NEW."createdAt" IS DISTINCT FROM OLD."createdAt" AND NEW.created_at IS NOT DISTINCT FROM OLD.created_at THEN
      NEW.created_at := NEW."createdAt";
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS sync_timestamp_trigger ON users;

-- Create trigger
CREATE TRIGGER sync_timestamp_trigger
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION sync_timestamp_columns();