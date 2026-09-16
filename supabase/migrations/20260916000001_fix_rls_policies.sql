-- ==============================================================================
-- MIGRACIÓN DE POLÍTICAS RLS (ROW LEVEL SECURITY) Y MULTI-TENANT ISOLATION
-- Aplicar en Supabase SQL Editor o automáticamente vía Supabase CLI / GitHub
-- ==============================================================================

-- 0. FUNCIONES AUXILIARES SECURITY DEFINER (Evitan recursión infinita RLS 42P17)
CREATE OR REPLACE FUNCTION public.get_mi_empresa_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT empresa_id FROM public.perfiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.es_superadmin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol = 'SUPERADMIN'
  );
$$;

CREATE OR REPLACE FUNCTION public.es_personal_administrativo()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.perfiles 
    WHERE id = auth.uid() 
    AND rol IN ('PROPIETARIO', 'ADMIN', 'CONTADOR', 'SUPERADMIN')
  );
$$;

-- 1. POLÍTICAS PARA LA TABLA EMPRESAS
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir insercion empresa a autenticados" ON public.empresas;
CREATE POLICY "Permitir insercion empresa a autenticados" 
ON public.empresas 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir lectura de su propia empresa" ON public.empresas;
DROP POLICY IF EXISTS "Lectura de empresas por autenticados" ON public.empresas;
CREATE POLICY "Permitir lectura de su propia empresa" 
ON public.empresas 
FOR SELECT 
TO authenticated 
USING (
  id = public.get_mi_empresa_id() 
  OR propietario_usuario_id = auth.uid()
  OR public.es_superadmin()
);

DROP POLICY IF EXISTS "Permitir actualizacion de su propia empresa" ON public.empresas;
CREATE POLICY "Permitir actualizacion de su propia empresa" 
ON public.empresas 
FOR UPDATE 
TO authenticated 
USING (
  id = public.get_mi_empresa_id() 
  OR propietario_usuario_id = auth.uid()
  OR public.es_superadmin()
);

-- 2. POLÍTICAS PARA LA TABLA ESTABLECIMIENTOS (CAMPOS / ESTANCIAS)
ALTER TABLE public.establecimientos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir insercion establecimiento a autenticados" ON public.establecimientos;
CREATE POLICY "Permitir insercion establecimiento a autenticados" 
ON public.establecimientos 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir lectura de sus establecimientos" ON public.establecimientos;
DROP POLICY IF EXISTS "Lectura de establecimientos por autenticados" ON public.establecimientos;
CREATE POLICY "Permitir lectura de sus establecimientos" 
ON public.establecimientos 
FOR SELECT 
TO authenticated 
USING (
  empresa_id = public.get_mi_empresa_id()
  OR public.es_superadmin()
);

DROP POLICY IF EXISTS "Permitir actualizacion de sus establecimientos" ON public.establecimientos;
CREATE POLICY "Permitir actualizacion de sus establecimientos" 
ON public.establecimientos 
FOR UPDATE 
TO authenticated 
USING (
  empresa_id = public.get_mi_empresa_id()
  OR public.es_superadmin()
);

-- 3. POLÍTICAS PARA LA TABLA PERFILES
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir insercion de su propio perfil" ON public.perfiles;
CREATE POLICY "Permitir insercion de su propio perfil" 
ON public.perfiles 
FOR INSERT 
TO authenticated 
WITH CHECK (
  id = auth.uid() 
  OR public.es_superadmin()
);

DROP POLICY IF EXISTS "Permitir lectura de perfiles de la misma empresa" ON public.perfiles;
DROP POLICY IF EXISTS "Lectura de perfiles por autenticados" ON public.perfiles;
CREATE POLICY "Permitir lectura de perfiles de la misma empresa" 
ON public.perfiles 
FOR SELECT 
TO authenticated 
USING (
  id = auth.uid() 
  OR (empresa_id IS NOT NULL AND empresa_id = public.get_mi_empresa_id())
  OR public.es_superadmin()
);

DROP POLICY IF EXISTS "Permitir actualizacion de su propio perfil" ON public.perfiles;
CREATE POLICY "Permitir actualizacion de su propio perfil" 
ON public.perfiles 
FOR UPDATE 
TO authenticated 
USING (
  id = auth.uid() 
  OR public.es_superadmin()
);

-- 4. POLÍTICAS PARA LA TABLA ESTABLECIMIENTO_USUARIOS
ALTER TABLE public.establecimiento_usuarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir insercion establecimiento_usuarios" ON public.establecimiento_usuarios;
CREATE POLICY "Permitir insercion establecimiento_usuarios" 
ON public.establecimiento_usuarios 
FOR INSERT 
TO authenticated 
WITH CHECK (
  perfil_id = auth.uid() 
  OR public.es_superadmin()
);

DROP POLICY IF EXISTS "Permitir lectura establecimiento_usuarios" ON public.establecimiento_usuarios;
CREATE POLICY "Permitir lectura establecimiento_usuarios" 
ON public.establecimiento_usuarios 
FOR SELECT 
TO authenticated 
USING (
  perfil_id = auth.uid() 
  OR public.es_superadmin()
);

-- 5. POLÍTICAS PARA FINANZAS Y RECIBOS (SIN RECURSIÓN)
ALTER TABLE public.transacciones_financieras ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura de finanzas restringida por rol" ON public.transacciones_financieras;
CREATE POLICY "Lectura de finanzas restringida por rol" 
ON public.transacciones_financieras FOR SELECT TO authenticated 
USING (public.es_personal_administrativo());

DROP POLICY IF EXISTS "Inserción de finanzas por roles autorizados" ON public.transacciones_financieras;
CREATE POLICY "Inserción de finanzas por roles autorizados" 
ON public.transacciones_financieras FOR INSERT TO authenticated 
WITH CHECK (public.es_personal_administrativo());

ALTER TABLE public.recibos_sueldo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Empleados leen exclusivamente sus propios recibos de sueldo" ON public.recibos_sueldo;
CREATE POLICY "Empleados leen exclusivamente sus propios recibos de sueldo" 
ON public.recibos_sueldo FOR SELECT TO authenticated 
USING (
  usuario_id = auth.uid()
  OR public.es_personal_administrativo()
);

DROP POLICY IF EXISTS "Administracion gestiona recibos de sueldo" ON public.recibos_sueldo;
CREATE POLICY "Administracion gestiona recibos de sueldo" 
ON public.recibos_sueldo FOR ALL TO authenticated 
USING (public.es_personal_administrativo());

-- 6. POLÍTICAS PARA LA TABLA SOLICITUDES_REGISTRO (PRE-ALTA DE EMPRESAS)
ALTER TABLE public.solicitudes_registro ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.solicitudes_registro ALTER COLUMN rut DROP NOT NULL;
ALTER TABLE public.solicitudes_registro ALTER COLUMN telefono DROP NOT NULL;
ALTER TABLE public.solicitudes_registro ALTER COLUMN departamento DROP NOT NULL;
ALTER TABLE public.solicitudes_registro ALTER COLUMN hectareas_estimadas DROP NOT NULL;

DROP POLICY IF EXISTS "Permitir insercion solicitudes publica" ON public.solicitudes_registro;
DROP POLICY IF EXISTS "Permitir insercion solicitudes a anonimos y autenticados" ON public.solicitudes_registro;
CREATE POLICY "Permitir insercion solicitudes publica" 
ON public.solicitudes_registro 
FOR INSERT 
TO public 
WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir lectura solicitudes a autenticados" ON public.solicitudes_registro;
CREATE POLICY "Permitir lectura solicitudes a autenticados" 
ON public.solicitudes_registro 
FOR SELECT 
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Permitir actualizacion solicitudes a autenticados" ON public.solicitudes_registro;
CREATE POLICY "Permitir actualizacion solicitudes a autenticados" 
ON public.solicitudes_registro 
FOR UPDATE 
TO authenticated 
USING (true);
