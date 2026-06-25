-- ==============================================================================
-- SCRIPT DE SEGURIDAD Y CONCURRENCIA PARA ONCE:ONCE PILATES STUDIO
-- Objetivo: Cerrar vulnerabilidades, evitar condiciones de carrera y dobles reservas.
-- Entorno: Ejecutar primero en Staging, luego en Producción.
-- ==============================================================================

-- 1. ACTIVAR ROW LEVEL SECURITY (RLS)
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE clases ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;

-- 2. POLÍTICAS PARA LA TABLA: clientes
-- Permitir que usuarios nuevos puedan insertar su registro (Registro Auth)
CREATE POLICY "Usuarios pueden crear su propio perfil" 
ON clientes FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Permitir leer solo su propio perfil, excepto los administradores que pueden leer todos
CREATE POLICY "Lectura perfil propio o admin" 
ON clientes FOR SELECT 
USING (auth.uid() = id OR rol = 'admin');

-- Permitir al usuario actualizar su propio perfil (teléfono, lesiones, etc.)
CREATE POLICY "Update perfil propio" 
ON clientes FOR UPDATE 
USING (auth.uid() = id);

-- 3. POLÍTICAS PARA LA TABLA: clases
-- Permitir que cualquier visitante (incluso sin login) pueda ver el horario de clases
CREATE POLICY "Acceso de lectura a clases para todos" 
ON clases FOR SELECT 
USING (true);

-- 4. POLÍTICAS PARA LA TABLA: reservas
-- Los clientes leen sus reservas. Los administradores leen todas.
CREATE POLICY "Lectura de reservas para usuarios y admin" 
ON reservas FOR SELECT 
USING (auth.uid() = cliente_id OR (SELECT rol FROM clientes WHERE id = auth.uid()) = 'admin');

-- NOTA: No hay política de INSERT para clientes aquí. 
-- Todo INSERT pasará exclusivamente por la función segura 'agendar_clase_atomic'.

-- Solo los administradores pueden hacer UPDATE (para cambiar estatus_pago a Confirmado)
CREATE POLICY "Solo admins actualizan reservas" 
ON reservas FOR UPDATE 
USING ( (SELECT rol FROM clientes WHERE id = auth.uid()) = 'admin' );

-- 5. CONSTRAINT CONTRA DOBLES RESERVAS DEL MISMO USUARIO
ALTER TABLE reservas ADD CONSTRAINT unique_reserva_por_dia UNIQUE (cliente_id, clase_id, fecha);

-- 6. EXTENSIÓN PG_CRON PARA LIBERAR LUGARES (RN-15)
-- Asegurar que la extensión está habilitada
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Programar tarea que corre cada hora en el minuto 0 para borrar reservas pendientes de más de 3 horas
SELECT cron.schedule(
    'liberar-lugares-no-pagados', 
    '0 * * * *', 
    $$ DELETE FROM reservas WHERE estatus_pago = 'Pendiente' AND created_at < NOW() - INTERVAL '3 hours' $$
);

-- 7. FUNCIÓN ATÓMICA DE RESERVAS CON BLOQUEO (RACE CONDITION FIX)
CREATE OR REPLACE FUNCTION agendar_clase_atomic(p_clase_id UUID, p_fecha DATE)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Se ejecuta con permisos de creador, bypass de RLS de INSERT.
AS $$
DECLARE
    v_cliente_id UUID;
    v_capacidad_maxima INT;
    v_cupos_actuales INT;
    v_lock_key BIGINT;
BEGIN
    -- A. Obtener el ID del usuario autenticado de forma segura
    v_cliente_id := auth.uid();
    
    IF v_cliente_id IS NULL THEN
        RAISE EXCEPTION 'SESION_EXPIRADA';
    END IF;

    -- B. Generar una llave numérica basada en el ID de la clase y la fecha
    v_lock_key := hashtext(p_clase_id::TEXT || p_fecha::TEXT);
    
    -- C. Tomar el bloqueo transaccional. (Forma fila india invisible bajo carga).
    PERFORM pg_advisory_xact_lock(v_lock_key);

    -- D. Validar que la clase exista y obtener su capacidad máxima
    SELECT capacidad_maxima INTO v_capacidad_maxima
    FROM clases WHERE id = p_clase_id AND activo = true;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'CLASE_NO_ENCONTRADA';
    END IF;

    -- E. Contar cupos actuales (incluyendo pendientes)
    SELECT count(*) INTO v_cupos_actuales
    FROM reservas WHERE clase_id = p_clase_id AND fecha = p_fecha;

    IF v_cupos_actuales >= v_capacidad_maxima THEN
        RAISE EXCEPTION 'CUPO_LLENO';
    END IF;

    -- F. Intentar la inserción (el constraint UNIQUE atrapará intentos dobles)
    BEGIN
        INSERT INTO reservas (cliente_id, clase_id, fecha, estatus_pago)
        VALUES (v_cliente_id, p_clase_id, p_fecha, 'Pendiente');
    EXCEPTION WHEN unique_violation THEN
        RAISE EXCEPTION 'RESERVA_DUPLICADA';
    END;

    -- El bloqueo se libera automáticamente al terminar la transacción (RETURN).
    RETURN json_build_object('status', 'success');
END;
$$;
