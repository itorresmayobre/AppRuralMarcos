-- ========================================================
-- ESQUEMA SQL INICIAL - GESTIÓN DE EMPRESA RURAL EN URUGUAY
-- Ejecutar este archivo en el Editor SQL de Supabase
-- ========================================================

-- 1. Enum de Roles de Usuario
CREATE TYPE rol_usuario AS ENUM ('ADMIN', 'CAPATAZ', 'CONTADOR', 'OPERARIO');

-- 2. Enum de Monedas en Uruguay
CREATE TYPE tipo_moneda AS ENUM ('USD', 'UYU');

-- 3. Enum de Tipo de Transacción
CREATE TYPE tipo_transaccion AS ENUM ('INGRESO', 'EGRESO');

-- 4. Tabla de Establecimientos Rurales (Campos / DICOSE)
CREATE TABLE public.establecimientos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  dicose VARCHAR(12) NOT NULL UNIQUE, -- Código DICOSE Uruguay
  hectareas NUMERIC(10,2) NOT NULL DEFAULT 0,
  departamento TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tabla de Perfiles de Usuario (Extiende auth.users de Supabase)
CREATE TABLE public.perfiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  rol rol_usuario NOT NULL DEFAULT 'OPERARIO',
  establecimiento_id UUID REFERENCES public.establecimientos(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Tabla de Stock Ganadero (Vacunos y Ovinos)
CREATE TABLE public.stock_ganadero (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  establecimiento_id UUID REFERENCES public.establecimientos(id) ON DELETE CASCADE NOT NULL,
  especie TEXT NOT NULL CHECK (especie IN ('VACUNO', 'OVINO')),
  categoria TEXT NOT NULL,
  cabezas INT NOT NULL DEFAULT 0 CHECK (cabezas >= 0),
  kilos_promedio NUMERIC(6,2),
  ultima_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Tabla de Transacciones Financieras (Ingresos y Egresos Bimoneda)
CREATE TABLE public.transacciones_financieras (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  establecimiento_id UUID REFERENCES public.establecimientos(id) ON DELETE CASCADE NOT NULL,
  tipo tipo_transaccion NOT NULL,
  moneda tipo_moneda NOT NULL DEFAULT 'USD',
  monto NUMERIC(12,2) NOT NULL CHECK (monto >= 0),
  categoria TEXT NOT NULL,
  descripcion TEXT,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  creado_por UUID REFERENCES public.perfiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ========================================================
-- SEGURIDAD: ROW LEVEL SECURITY (RLS)
-- ========================================================

ALTER TABLE public.establecimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_ganadero ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacciones_financieras ENABLE ROW LEVEL SECURITY;

-- Política de lectura para usuarios autenticados
CREATE POLICY "Lectura de stock por usuarios del establecimiento" 
  ON public.stock_ganadero FOR SELECT 
  TO authenticated 
  USING (true);

-- Política de finanzas: Solo ADMIN y CONTADOR pueden ver dinero
CREATE POLICY "Lectura de finanzas restringida por rol" 
  ON public.transacciones_financieras FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.perfiles 
      WHERE perfiles.id = auth.uid() 
      AND perfiles.rol IN ('ADMIN', 'CONTADOR')
    )
  );

-- Política de modificación de finanzas: Solo ADMIN
CREATE POLICY "Insercion de finanzas solo por ADMIN" 
  ON public.transacciones_financieras FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.perfiles 
      WHERE perfiles.id = auth.uid() 
      AND perfiles.rol = 'ADMIN'
    )
  );
