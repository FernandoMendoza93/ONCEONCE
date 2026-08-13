-- ==============================================================================
-- FIX: VALIDACIÓN DE FECHA/HORA PASADA EN agendar_clase_atomic
-- Objetivo: Evitar reservas en fechas pasadas o clases que ya iniciaron hoy,
--           usando la zona horaria oficial de México (America/Mexico_City).
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query
-- ==============================================================================

CREATE OR REPLACE FUNCTION agendar_clase_atomic(p_clase_id UUID, p_fecha DATE)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_cliente_id    UUID;
    v_capacidad_max INT;
    v_cupos_actuales INT;
    v_lock_key      BIGINT;
    v_hora_inicio   TIME;
    v_fecha_mx      DATE;
    v_hora_mx       TIME;
BEGIN
    -- A. Verificar sesión activa
    v_cliente_id := auth.uid();
    IF v_cliente_id IS NULL THEN
        RAISE EXCEPTION 'SESION_EXPIRADA';
    END IF;

    -- B. Obtener la fecha y hora ACTUALES en México
    --    NOW() AT TIME ZONE convierte el timestamp UTC del servidor a México
    v_fecha_mx := (NOW() AT TIME ZONE 'America/Mexico_City')::DATE;
    v_hora_mx  := (NOW() AT TIME ZONE 'America/Mexico_City')::TIME;

    -- C. Validar que la fecha de la reserva no sea pasada
    IF p_fecha < v_fecha_mx THEN
        RAISE EXCEPTION 'FECHA_PASADA';
    END IF;

    -- D. Validar que la clase exista y obtener capacidad y hora de inicio
    SELECT capacidad_maxima, hora_inicio
    INTO v_capacidad_max, v_hora_inicio
    FROM clases
    WHERE id = p_clase_id AND activo = true;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'CLASE_NO_ENCONTRADA';
    END IF;

    -- E. Si la reserva es para HOY, verificar que la clase no haya iniciado ya
    IF p_fecha = v_fecha_mx AND v_hora_inicio < v_hora_mx THEN
        RAISE EXCEPTION 'HORA_PASADA';
    END IF;

    -- F. Bloqueo transaccional para evitar race conditions
    v_lock_key := hashtext(p_clase_id::TEXT || p_fecha::TEXT);
    PERFORM pg_advisory_xact_lock(v_lock_key);

    -- G. Contar cupos actuales
    SELECT count(*) INTO v_cupos_actuales
    FROM reservas
    WHERE clase_id = p_clase_id AND fecha = p_fecha;

    IF v_cupos_actuales >= v_capacidad_max THEN
        RAISE EXCEPTION 'CUPO_LLENO';
    END IF;

    -- H. Insertar reserva (el UNIQUE constraint atrapa duplicados)
    BEGIN
        INSERT INTO reservas (cliente_id, clase_id, fecha, estatus_pago)
        VALUES (v_cliente_id, p_clase_id, p_fecha, 'Pendiente');
    EXCEPTION WHEN unique_violation THEN
        RAISE EXCEPTION 'RESERVA_DUPLICADA';
    END;

    RETURN json_build_object('status', 'success');
END;
$$;
