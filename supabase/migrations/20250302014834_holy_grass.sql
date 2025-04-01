/*
  # Fix numJugadores column in entrenamientos table

  1. Changes
    - Ensure numJugadores column exists in entrenamientos table
    - Fix column name casing issues
    - Add missing column if it doesn't exist

  2. Security
    - No changes to security policies
*/

-- Ensure numJugadores column exists in entrenamientos table
DO $$
BEGIN
  -- Check if numJugadores column exists (camelCase)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'entrenamientos' AND column_name = 'numJugadores'
  ) THEN
    -- Check if numjugadores column exists (lowercase)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'entrenamientos' AND column_name = 'numjugadores'
    ) THEN
      -- Rename to camelCase
      ALTER TABLE entrenamientos RENAME COLUMN numjugadores TO "numJugadores";
    ELSE
      -- Add the column if it doesn't exist in any form
      ALTER TABLE entrenamientos ADD COLUMN "numJugadores" integer DEFAULT 10 NOT NULL;
    END IF;
  END IF;
END $$;

-- Update existing rows to have a default value if the column was just added
UPDATE entrenamientos SET "numJugadores" = 10 WHERE "numJugadores" IS NULL;

-- Ensure entrenamientoId column exists in tareas table with proper casing
DO $$
BEGIN
  -- Check if entrenamientoId column exists (camelCase)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tareas' AND column_name = 'entrenamientoId'
  ) THEN
    -- Check if entrenamientoid column exists (lowercase)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'tareas' AND column_name = 'entrenamientoid'
    ) THEN
      -- Rename to camelCase
      ALTER TABLE tareas RENAME COLUMN entrenamientoid TO "entrenamientoId";
    END IF;
  END IF;
END $$;

-- Create index for entrenamientoId if it doesn't exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tareas' AND column_name = 'entrenamientoId'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_tareas_entrenamientoId ON tareas("entrenamientoId");
  END IF;
END $$;