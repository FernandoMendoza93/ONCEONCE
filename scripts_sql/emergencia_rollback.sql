-- ==============================================================================
-- SCRIPT DE EMERGENCIA / ROLLBACK PARA ONCE:ONCE
-- Objetivo: Revertir la base de datos a su estado original (inseguro/sin reglas)
-- Uso: Ejecutar SOLO si algo crítico falla en producción tras la implementación.
-- ==============================================================================

-- 1. DESHABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE clases DISABLE ROW LEVEL SECURITY;
ALTER TABLE reservas DISABLE ROW LEVEL SECURITY;

-- 2. BORRAR TODAS LAS POLÍTICAS CREADAS
DROP POLICY IF EXISTS "Usuarios pueden crear su propio perfil" ON clientes;
DROP POLICY IF EXISTS "Lectura perfil propio o admin" ON clientes;
DROP POLICY IF EXISTS "Update perfil propio" ON clientes;

DROP POLICY IF EXISTS "Acceso de lectura a clases para todos" ON clases;

DROP POLICY IF EXISTS "Lectura de reservas para usuarios y admin" ON reservas;
DROP POLICY IF EXISTS "Solo admins actualizan reservas" ON reservas;

-- 3. REMOVER EL CONSTRAINT DE DOBLE RESERVA
ALTER TABLE reservas DROP CONSTRAINT IF EXISTS unique_reserva_por_dia;

-- 4. REMOVER EL CRON JOB DE LIMPIEZA
-- Requiere la extensión pg_cron instalada
SELECT cron.unschedule('liberar-lugares-no-pagados');

-- 5. ELIMINAR LA FUNCIÓN ATÓMICA DE RESERVA
DROP FUNCTION IF EXISTS agendar_clase_atomic(UUID, DATE);

-- ==============================================================================
-- Al terminar de correr este script, tu base de datos regresará exactamente a 
-- como estaba antes de aplicar seguridad_supabase.sql (inserciones directas 
-- desde JS serán permitidas sin bloqueos ni validaciones en BD).
-- ==============================================================================
