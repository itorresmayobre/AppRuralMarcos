-- ==============================================================================
-- MIGRACIÓN DE POLÍTICAS RLS (ROW LEVEL SECURITY) Y MULTI-TENANT ISOLATION
-- Aplicar en Supabase SQL Editor o automáticamente vía Supabase CLI / GitHub
-- ==============================================================================

-- 1. POLÍTICAS PARA LA TABLA EMPRESAS
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir insercion empresa a autenticados" ON public.empresas;
CREATE POLICY "Permitir insercion empresa a autenticados" 
ON public.empresas 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir lectura de su propia empresa" ON public.empresas;
CREATE POLICY "Permitir lectura de su propia empresa" 
ON public.empresas 
FOR SELECT 
TO authenticated 
USING (
  id IN (SELECT empresa_id FROM public.perfiles WHERE id = auth.uid()) 
  OR propietario_usuario_id = auth.uid()
);

DROP POLICY IF EXISTS "Permitir actualizacion de su propia empresa" ON public.empresas;
CREATE POLICY "Permitir actualizacion de su propia empresa" 
ON public.empresas 
FOR UPDATE 
TO authenticated 
USING (
  id IN (SELECT empresa_id FROM public.perfiles WHERE id = auth.uid()) 
  OR propietario_usuario_id = auth.uid()
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
CREATE POLICY "Permitir lectura de sus establecimientos" 
ON public.establecimientos 
FOR SELECT 
TO authenticated 
USING (
  empresa_id IN (SELECT empresa_id FROM public.perfiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Permitir actualizacion de sus establecimientos" ON public.establecimientos;
CREATE POLICY "Permitir actualizacion de sus establecimientos" 
ON public.establecimientos 
FOR UPDATE 
TO authenticated 
USING (
  empresa_id IN (SELECT empresa_id FROM public.perfiles WHERE id = auth.uid())
);

-- 3. POLÍTICAS PARA LA TABLA PERFILES
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir insercion de su propio perfil" ON public.perfiles;
CREATE POLICY "Permitir insercion de su propio perfil" 
ON public.perfiles 
FOR INSERT 
TO authenticated 
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Permitir lectura de perfiles de la misma empresa" ON public.perfiles;
CREATE POLICY "Permitir lectura de perfiles de la misma empresa" 
ON public.perfiles 
FOR SELECT 
TO authenticated 
USING (
  id = auth.uid() 
  OR empresa_id IN (SELECT empresa_id FROM public.perfiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Permitir actualizacion de su propio perfil" ON public.perfiles;
CREATE POLICY "Permitir actualizacion de su propio perfil" 
ON public.perfiles 
FOR UPDATE 
TO authenticated 
USING (id = auth.uid());

-- 4. POLÍTICAS PARA LA TABLA ESTABLECIMIENTO_USUARIOS
ALTER TABLE public.establecimiento_usuarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir insercion establecimiento_usuarios" ON public.establecimiento_usuarios;
CREATE POLICY "Permitir insercion establecimiento_usuarios" 
ON public.establecimiento_usuarios 
FOR INSERT 
TO authenticated 
WITH CHECK (
  perfil_id = auth.uid() 
  OR perfil_id IN (SELECT id FROM public.perfiles WHERE empresa_id IN (SELECT empresa_id FROM public.perfiles WHERE id = auth.uid()))
);

DROP POLICY IF EXISTS "Permitir lectura establecimiento_usuarios" ON public.establecimiento_usuarios;
CREATE POLICY "Permitir lectura establecimiento_usuarios" 
ON public.establecimiento_usuarios 
FOR SELECT 
TO authenticated 
USING (
  perfil_id = auth.uid() 
  OR perfil_id IN (SELECT id FROM public.perfiles WHERE empresa_id IN (SELECT empresa_id FROM public.perfiles WHERE id = auth.uid()))
);
