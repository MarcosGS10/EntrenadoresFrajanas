/*
  # Actualización de campo role en users

  1. Cambios en Tablas Existentes
    - Renombrar columna `role_name` a `role` en la tabla `users` si existe
    - Asegurar compatibilidad con el código existente
    
  2. Actualización de Políticas
    - Actualizar políticas para usar el nuevo nombre de columna
*/

-- Verificar si existe la columna role_name y renombrarla a role
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'role_name'
  ) THEN
    ALTER TABLE users RENAME COLUMN role_name TO role;
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'role'
  ) THEN
    -- Si no existe ni role_name ni role, crear la columna role
    ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'entrenador';
  END IF;
END $$;

-- Actualizar políticas para usar el nuevo nombre de columna
DO $$
BEGIN
  -- Actualizar política para entrenamientos
  DROP POLICY IF EXISTS "Admins can read all entrenamientos" ON entrenamientos;
  
  CREATE POLICY "Admins can read all entrenamientos"
    ON entrenamientos
    FOR SELECT
    TO authenticated
    USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));
    
  -- Actualizar política para tareas
  DROP POLICY IF EXISTS "Admins can read all tareas" ON tareas;
  
  CREATE POLICY "Admins can read all tareas"
    ON tareas
    FOR SELECT
    TO authenticated
    USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));
    
  -- Actualizar políticas para users
  DROP POLICY IF EXISTS "Admins can read all users" ON users;
  
  CREATE POLICY "Admins can read all users"
    ON users
    FOR SELECT
    TO authenticated
    USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));
    
  DROP POLICY IF EXISTS "Admins can update all users" ON users;
  
  CREATE POLICY "Admins can update all users"
    ON users
    FOR UPDATE
    TO authenticated
    USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));
    
  -- Actualizar políticas de eliminación
  DROP POLICY IF EXISTS "Admins can delete all entrenamientos" ON entrenamientos;
  
  CREATE POLICY "Admins can delete all entrenamientos"
    ON entrenamientos
    FOR DELETE
    TO authenticated
    USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));
    
  DROP POLICY IF EXISTS "Admins can delete all tareas" ON tareas;
  
  CREATE POLICY "Admins can delete all tareas"
    ON tareas
    FOR DELETE
    TO authenticated
    USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));
END $$;

-- Asegurarse de que el usuario administrador tenga el rol correcto
UPDATE users 
SET role = 'admin' 
WHERE email = 'marcosgomezsoria1997@gmail.com';

-- Asegurarse de que todos los usuarios tengan un rol asignado
UPDATE users 
SET role = 'entrenador' 
WHERE role IS NULL;