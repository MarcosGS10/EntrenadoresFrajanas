/*
  # Standardize column naming to camelCase

  1. Changes
     - Ensure all tables use camelCase for column names
     - Add missing columns where needed
     - Set appropriate constraints
  
  2. Security
     - No changes to existing security policies
*/

-- Check if users table needs the createdAt column
DO $$
BEGIN
  -- First check if createdAt column exists, if not add it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'createdAt'
  ) THEN
    ALTER TABLE users ADD COLUMN "createdAt" timestamptz DEFAULT now();
  END IF;
  
  -- Do the same for entrenamientos table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'entrenamientos' AND column_name = 'createdAt'
  ) THEN
    ALTER TABLE entrenamientos ADD COLUMN "createdAt" timestamptz DEFAULT now();
  END IF;
  
  -- And for tareas table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tareas' AND column_name = 'createdAt'
  ) THEN
    ALTER TABLE tareas ADD COLUMN "createdAt" timestamptz DEFAULT now();
  END IF;
END $$;

-- Add default values for createdAt where missing
UPDATE users SET "createdAt" = now() WHERE "createdAt" IS NULL;
UPDATE entrenamientos SET "createdAt" = now() WHERE "createdAt" IS NULL;
UPDATE tareas SET "createdAt" = now() WHERE "createdAt" IS NULL;

-- Make createdAt NOT NULL
ALTER TABLE users ALTER COLUMN "createdAt" SET NOT NULL;
ALTER TABLE entrenamientos ALTER COLUMN "createdAt" SET NOT NULL;
ALTER TABLE tareas ALTER COLUMN "createdAt" SET NOT NULL;

-- Add indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_entrenamientos_userId ON entrenamientos(userId);
CREATE INDEX IF NOT EXISTS idx_tareas_userId ON tareas(userId);
CREATE INDEX IF NOT EXISTS idx_tareas_entrenamientoId ON tareas(entrenamientoId);