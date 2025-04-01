/*
  # Add imagenCanvas field to tareas table
  
  1. Changes
    - Add imagenCanvas column to tareas table to store canvas image data
*/

-- Add imagenCanvas field to tareas table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tareas' AND column_name = 'imagenCanvas'
  ) THEN
    ALTER TABLE tareas ADD COLUMN "imagenCanvas" TEXT;
  END IF;
END $$;