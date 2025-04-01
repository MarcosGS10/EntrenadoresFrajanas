/*
  # Fix consignasIndividuales and consignasColectivas columns in tareas table

  1. Changes
    - Ensure consignasIndividuales and consignasColectivas columns exist in tareas table
    - Fix column name casing issues
    - Add missing columns if they don't exist

  2. Security
    - No changes to security policies
*/

-- Ensure consignasIndividuales column exists in tareas table
DO $$
BEGIN
  -- Check if consignasIndividuales column exists (camelCase)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tareas' AND column_name = 'consignasIndividuales'
  ) THEN
    -- Check if consignasindividuales column exists (lowercase)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'tareas' AND column_name = 'consignasindividuales'
    ) THEN
      -- Rename to camelCase
      ALTER TABLE tareas RENAME COLUMN consignasindividuales TO "consignasIndividuales";
    ELSE
      -- Add the column if it doesn't exist in any form
      ALTER TABLE tareas ADD COLUMN "consignasIndividuales" text[] DEFAULT '{}';
    END IF;
  END IF;
END $$;

-- Ensure consignasColectivas column exists in tareas table
DO $$
BEGIN
  -- Check if consignasColectivas column exists (camelCase)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tareas' AND column_name = 'consignasColectivas'
  ) THEN
    -- Check if consignascolectivas column exists (lowercase)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'tareas' AND column_name = 'consignascolectivas'
    ) THEN
      -- Rename to camelCase
      ALTER TABLE tareas RENAME COLUMN consignascolectivas TO "consignasColectivas";
    ELSE
      -- Add the column if it doesn't exist in any form
      ALTER TABLE tareas ADD COLUMN "consignasColectivas" text[] DEFAULT '{}';
    END IF;
  END IF;
END $$;

-- Update existing rows to have default values if the columns were just added
UPDATE tareas SET "consignasIndividuales" = '{}' WHERE "consignasIndividuales" IS NULL;
UPDATE tareas SET "consignasColectivas" = '{}' WHERE "consignasColectivas" IS NULL;

-- Create a function to handle array columns in tareas table
CREATE OR REPLACE FUNCTION handle_tareas_arrays()
RETURNS TRIGGER AS $$
BEGIN
  -- Set default values for any NULL array fields
  IF NEW."consignasIndividuales" IS NULL THEN
    NEW."consignasIndividuales" := '{}';
  END IF;
  
  IF NEW."consignasColectivas" IS NULL THEN
    NEW."consignasColectivas" := '{}';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS handle_tareas_arrays_trigger ON tareas;

-- Create trigger
CREATE TRIGGER handle_tareas_arrays_trigger
BEFORE INSERT OR UPDATE ON tareas
FOR EACH ROW
EXECUTE FUNCTION handle_tareas_arrays();