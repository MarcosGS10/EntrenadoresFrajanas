/*
  # Fix column names for consistency

  1. Changes
    - Add migration to ensure consistent column naming in database
    - Fix userId/userid inconsistency
    - Fix createdAt/created_at inconsistency
    - Fix entrenamientoId reference error

  2. Security
    - No changes to security policies
*/

-- Add indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_entrenamientos_userid ON entrenamientos(userid);
CREATE INDEX IF NOT EXISTS idx_tareas_userid ON tareas(userid);

-- Check if entrenamientoId column exists before creating index
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tareas' AND column_name = 'entrenamientoId'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_tareas_entrenamientoId ON tareas("entrenamientoId");
  END IF;
END $$;

-- Ensure userid column exists in entrenamientos (snake_case version)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'entrenamientos' AND column_name = 'userid'
  ) THEN
    -- If userId exists (camelCase), rename it to userid (snake_case)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'entrenamientos' AND column_name = 'userId'
    ) THEN
      ALTER TABLE entrenamientos RENAME COLUMN "userId" TO userid;
    ELSE
      -- If neither exists, add the column
      ALTER TABLE entrenamientos ADD COLUMN userid uuid REFERENCES users(id);
    END IF;
  END IF;
END $$;

-- Ensure userid column exists in tareas (snake_case version)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tareas' AND column_name = 'userid'
  ) THEN
    -- If userId exists (camelCase), rename it to userid (snake_case)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'tareas' AND column_name = 'userId'
    ) THEN
      ALTER TABLE tareas RENAME COLUMN "userId" TO userid;
    ELSE
      -- If neither exists, add the column
      ALTER TABLE tareas ADD COLUMN userid uuid REFERENCES users(id);
    END IF;
  END IF;
END $$;

-- Ensure created_at column exists in all tables (snake_case version)
DO $$
BEGIN
  -- For users table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE users ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;
  
  -- For entrenamientos table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'entrenamientos' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE entrenamientos ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;
  
  -- For tareas table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tareas' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE tareas ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Update policies to use the correct column names
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can create their own entrenamientos" ON entrenamientos;
  DROP POLICY IF EXISTS "Users can read their own entrenamientos" ON entrenamientos;
  DROP POLICY IF EXISTS "Users can update their own entrenamientos" ON entrenamientos;
  DROP POLICY IF EXISTS "Users can delete their own entrenamientos" ON entrenamientos;

  DROP POLICY IF EXISTS "Users can create their own tareas" ON tareas;
  DROP POLICY IF EXISTS "Users can read their own tareas" ON tareas;
  DROP POLICY IF EXISTS "Users can update their own tareas" ON tareas;
  DROP POLICY IF EXISTS "Users can delete their own tareas" ON tareas;

  -- Create policies with correct column names
  CREATE POLICY "Users can create their own entrenamientos"
    ON entrenamientos
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = userid);

  CREATE POLICY "Users can read their own entrenamientos"
    ON entrenamientos
    FOR SELECT
    TO authenticated
    USING (auth.uid() = userid);

  CREATE POLICY "Users can update their own entrenamientos"
    ON entrenamientos
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = userid);

  CREATE POLICY "Users can delete their own entrenamientos"
    ON entrenamientos
    FOR DELETE
    TO authenticated
    USING (auth.uid() = userid);

  -- Policies for tareas
  CREATE POLICY "Users can create their own tareas"
    ON tareas
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = userid);

  CREATE POLICY "Users can read their own tareas"
    ON tareas
    FOR SELECT
    TO authenticated
    USING (auth.uid() = userid);

  CREATE POLICY "Users can update their own tareas"
    ON tareas
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = userid);

  CREATE POLICY "Users can delete their own tareas"
    ON tareas
    FOR DELETE
    TO authenticated
    USING (auth.uid() = userid);
END $$;