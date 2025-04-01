/*
  # Create entrenamientos and tareas tables

  1. New Tables
    - `entrenamientos` table for storing training sessions
    - `tareas` table for storing tasks within training sessions
  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own data
*/

-- Entrenamientos table
CREATE TABLE IF NOT EXISTS entrenamientos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  fecha date NOT NULL,
  numJugadores integer NOT NULL,
  userId uuid NOT NULL REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Tareas table
CREATE TABLE IF NOT EXISTS tareas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entrenamientoId uuid REFERENCES entrenamientos(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  momento text NOT NULL,
  fase text NOT NULL,
  espacio text,
  consignasIndividuales text[] DEFAULT '{}',
  consignasColectivas text[] DEFAULT '{}',
  duracion integer NOT NULL,
  descripcion text,
  userId uuid NOT NULL REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE entrenamientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tareas ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid errors
DROP POLICY IF EXISTS "Users can create their own entrenamientos" ON entrenamientos;
DROP POLICY IF EXISTS "Users can read their own entrenamientos" ON entrenamientos;
DROP POLICY IF EXISTS "Users can update their own entrenamientos" ON entrenamientos;
DROP POLICY IF EXISTS "Users can delete their own entrenamientos" ON entrenamientos;

DROP POLICY IF EXISTS "Users can create their own tareas" ON tareas;
DROP POLICY IF EXISTS "Users can read their own tareas" ON tareas;
DROP POLICY IF EXISTS "Users can update their own tareas" ON tareas;
DROP POLICY IF EXISTS "Users can delete their own tareas" ON tareas;

-- Policies for entrenamientos
CREATE POLICY "Users can create their own entrenamientos"
  ON entrenamientos
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = userId);

CREATE POLICY "Users can read their own entrenamientos"
  ON entrenamientos
  FOR SELECT
  TO authenticated
  USING (auth.uid() = userId);

CREATE POLICY "Users can update their own entrenamientos"
  ON entrenamientos
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = userId);

CREATE POLICY "Users can delete their own entrenamientos"
  ON entrenamientos
  FOR DELETE
  TO authenticated
  USING (auth.uid() = userId);

-- Policies for tareas
CREATE POLICY "Users can create their own tareas"
  ON tareas
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = userId);

CREATE POLICY "Users can read their own tareas"
  ON tareas
  FOR SELECT
  TO authenticated
  USING (auth.uid() = userId);

CREATE POLICY "Users can update their own tareas"
  ON tareas
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = userId);

CREATE POLICY "Users can delete their own tareas"
  ON tareas
  FOR DELETE
  TO authenticated
  USING (auth.uid() = userId);