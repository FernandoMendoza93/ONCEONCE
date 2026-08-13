-- ============================================================
-- FIX: POLÍTICA RLS ADMIN - RESERVAS
-- Problema: La política anterior usaba una subconsulta a `clientes`
-- desde `reservas`, pero `clientes` también tiene RLS activo → loop.
-- Solución: Crear una función SECURITY DEFINER que lee el rol
-- saltando RLS y usarla en la política de reservas.
-- ============================================================

-- PASO 1: Función helper para obtener el rol del usuario actual
-- SECURITY DEFINER = se ejecuta con permisos del OWNER, no del usuario
-- Esto evita el loop de RLS al consultar la tabla clientes.
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT rol FROM clientes WHERE id = auth.uid();
$$;

-- PASO 2: Eliminar la política anterior que causaba el loop
DROP POLICY IF EXISTS "Lectura de reservas para usuarios y admin" ON reservas;

-- PASO 3: Crear la política corregida usando la función helper
CREATE POLICY "Lectura de reservas para usuarios y admin"
ON reservas FOR SELECT
USING (
  auth.uid() = cliente_id
  OR get_my_role() = 'admin'
);

-- PASO 4: Arreglar también la política de UPDATE para admins
DROP POLICY IF EXISTS "Solo admins actualizan reservas" ON reservas;

CREATE POLICY "Solo admins actualizan reservas"
ON reservas FOR UPDATE
USING (
  get_my_role() = 'admin'
);

-- VERIFICACIÓN: Ejecuta esto para confirmar que las políticas existen
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'reservas';
