/*
  # Add entrenamiento status fields

  1. New Fields
    - `completado` (boolean) - Indicates if the training is completed
    - `fechaCompletado` (timestamp) - When the training was completed
  
  2. Default Values
    - `completado` defaults to false
    - `fechaCompletado` is nullable
*/

-- Add completado field to entrenamientos table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'entrenamientos' AND column_name = 'completado'
  ) THEN
    ALTER TABLE entrenamientos ADD COLUMN completado BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add fechaCompletado field to entrenamientos table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'entrenamientos' AND column_name = 'fechaCompletado'
  ) THEN
    ALTER TABLE entrenamientos ADD COLUMN "fechaCompletado" TIMESTAMPTZ;
  END IF;
END $$;

-- Update existing records to have completado = false if null
UPDATE entrenamientos SET completado = false WHERE completado IS NULL;