/*
  # Sistema de roles para usuarios

  1. Nuevas Tablas
    - `roles` - Tabla para almacenar los tipos de roles disponibles
      - `id` (serial, primary key)
      - `name` (text, unique)
      - `description` (text)
      - `created_at` (timestamptz)

  2. Cambios en Tablas Existentes
    - Añadir columna `role_name` a la tabla `users`
    
  3. Seguridad
    - Políticas para que los administradores puedan ver todos los datos
    - Políticas para que los entrenadores solo vean sus propios datos
*/

-- Crear tabla de roles si no existe
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Añadir campo de rol a la tabla users si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'role_name'
  ) THEN
    ALTER TABLE users ADD COLUMN role_name TEXT DEFAULT 'entrenador';
  END IF;
END $$;

-- Insertar roles predefinidos si no existen
INSERT INTO roles (name, description)
VALUES 
  ('admin', 'Acceso total al sistema y gestión de usuarios'),
  ('entrenador', 'Acceso limitado a sus propios entrenamientos')
ON CONFLICT (name) DO NOTHING;

-- Asignar rol de administrador al usuario específico
UPDATE users 
SET role_name = 'admin' 
WHERE email = 'marcosgomezsoria1997@gmail.com';

-- Actualizar usuarios existentes para asegurar que tengan un rol asignado
UPDATE users 
SET role_name = 'entrenador' 
WHERE role_name IS NULL;

-- Añadir políticas para administradores en la tabla entrenamientos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy p
    JOIN pg_class c ON p.polrelid = c.oid
    WHERE c.relname = 'entrenamientos' AND p.polname = 'Admins can read all entrenamientos'
  ) THEN
    CREATE POLICY "Admins can read all entrenamientos"
      ON entrenamientos
      FOR SELECT
      TO authenticated
      USING (auth.uid() IN (SELECT id FROM users WHERE role_name = 'admin'));
  END IF;
END $$;

-- Añadir políticas para administradores en la tabla tareas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy p
    JOIN pg_class c ON p.polrelid = c.oid
    WHERE c.relname = 'tareas' AND p.polname = 'Admins can read all tareas'
  ) THEN
    CREATE POLICY "Admins can read all tareas"
      ON tareas
      FOR SELECT
      TO authenticated
      USING (auth.uid() IN (SELECT id FROM users WHERE role_name = 'admin'));
  END IF;
END $$;

-- Añadir políticas para administradores en la tabla users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy p
    JOIN pg_class c ON p.polrelid = c.oid
    WHERE c.relname = 'users' AND p.polname = 'Admins can read all users'
  ) THEN
    CREATE POLICY "Admins can read all users"
      ON users
      FOR SELECT
      TO authenticated
      USING (auth.uid() IN (SELECT id FROM users WHERE role_name = 'admin'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy p
    JOIN pg_class c ON p.polrelid = c.oid
    WHERE c.relname = 'users' AND p.polname = 'Admins can update all users'
  ) THEN
    CREATE POLICY "Admins can update all users"
      ON users
      FOR UPDATE
      TO authenticated
      USING (auth.uid() IN (SELECT id FROM users WHERE role_name = 'admin'));
  END IF;
END $$;

-- Añadir políticas para que los administradores puedan eliminar datos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy p
    JOIN pg_class c ON p.polrelid = c.oid
    WHERE c.relname = 'entrenamientos' AND p.polname = 'Admins can delete all entrenamientos'
  ) THEN
    CREATE POLICY "Admins can delete all entrenamientos"
      ON entrenamientos
      FOR DELETE
      TO authenticated
      USING (auth.uid() IN (SELECT id FROM users WHERE role_name = 'admin'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy p
    JOIN pg_class c ON p.polrelid = c.oid
    WHERE c.relname = 'tareas' AND p.polname = 'Admins can delete all tareas'
  ) THEN
    CREATE POLICY "Admins can delete all tareas"
      ON tareas
      FOR DELETE
      TO authenticated
      USING (auth.uid() IN (SELECT id FROM users WHERE role_name = 'admin'));
  END IF;
END $$;