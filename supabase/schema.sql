-- ==============================================================================
-- ESQUEMA COMPLETO Y ACTUALIZADO SQL - AGRO UY (SISTEMA DE GESTIÓN RURAL URUGUAY)
-- Ejecutar en el Editor SQL de Supabase (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. TIPOS ENUMERADOS (DOMINIO URUGUAY)
CREATE TYPE rol_usuario AS ENUM ('ADMIN', 'CAPATAZ', 'CONTADOR', 'OPERARIO');
CREATE TYPE tipo_moneda AS ENUM ('USD', 'UYU');
CREATE TYPE tipo_transaccion AS ENUM ('INGRESO', 'EGRESO');
CREATE TYPE tipo_tenencia AS ENUM ('PROPIO', 'ARRENDADO', 'PASTOREO');
CREATE TYPE prioridad_nota AS ENUM ('BAJA', 'MEDIA', 'ALTA');

-- 2. TABLA DE ESTABLECIMIENTOS RURALES (ESTANCIAS / CAMPOS / DICOSE)
CREATE TABLE public.establecimientos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  dicose VARCHAR(12) NOT NULL UNIQUE, -- Formato DICOSE Uruguay (ej: 04-123456-7)
  hectareas_totales NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (hectareas_totales >= 0),
  hectareas_pastoreables NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (hectareas_pastoreables >= 0),
  departamento TEXT NOT NULL,
  ubicacion_localidad TEXT,
  tipo_tenencia tipo_tenencia NOT NULL DEFAULT 'PROPIO',
  activa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABLA DE PERFILES DE USUARIO (REEMPLAZA Y EXTIENDE auth.users)
CREATE TABLE public.perfiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT NOT NULL UNIQUE, -- Formato nombre.apellido (sin @)
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  rol rol_usuario NOT NULL DEFAULT 'OPERARIO',
  activo BOOLEAN NOT NULL DEFAULT true,
  fecha_alta DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TABLA INTERMEDIA: ASIGNACIÓN DE EMPLEADOS A MÚLTIPLES ESTANCIAS
CREATE TABLE public.establecimiento_usuarios (
  establecimiento_id UUID REFERENCES public.establecimientos(id) ON DELETE CASCADE NOT NULL,
  perfil_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (establecimiento_id, perfil_id)
);

-- 5. TABLA DE STOCK GANADERO (VACUNOS Y OVINOS)
CREATE TABLE public.stock_ganadero (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  establecimiento_id UUID REFERENCES public.establecimientos(id) ON DELETE CASCADE NOT NULL,
  especie TEXT NOT NULL CHECK (especie IN ('VACUNO', 'OVINO')),
  categoria TEXT NOT NULL, -- ej: VACAS_DE_CRIA, NOVILLOS_1_2, TERNEROS, OVEJAS_CRIA
  cabezas INT NOT NULL DEFAULT 0 CHECK (cabezas >= 0),
  kilos_promedio NUMERIC(6,2),
  ultima_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. TABLA DE TRANSACCIONES FINANCIERAS (INGRESOS Y EGRESOS BIMONEDA USD / UYU)
CREATE TABLE public.transacciones_financieras (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  establecimiento_id UUID REFERENCES public.establecimientos(id) ON DELETE CASCADE NOT NULL,
  tipo tipo_transaccion NOT NULL,
  moneda tipo_moneda NOT NULL DEFAULT 'USD',
  monto NUMERIC(12,2) NOT NULL CHECK (monto >= 0),
  categoria TEXT NOT NULL, -- ej: VENTA_HACIENDA, INSUMOS_VETERINARIOS, COMBUSTIBLE
  descripcion TEXT,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  creado_por UUID REFERENCES public.perfiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. TABLA DE PLUVIÓMETRO (REGISTRO DIARIO DE PRECIPITACIONES MM)
CREATE TABLE public.registros_pluviometro (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  establecimiento_id UUID REFERENCES public.establecimientos(id) ON DELETE CASCADE NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  milimetros NUMERIC(5,1) NOT NULL CHECK (milimetros >= 0),
  observacion TEXT,
  registrado_por UUID REFERENCES public.perfiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. TABLA DE NOTAS DE CAMPO / ALERTAS OPERATIVAS
CREATE TABLE public.notas_campo (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  establecimiento_id UUID REFERENCES public.establecimientos(id) ON DELETE CASCADE NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  prioridad prioridad_nota NOT NULL DEFAULT 'MEDIA',
  creado_por UUID REFERENCES public.perfiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- SEGURIDAD: ROW LEVEL SECURITY (RLS) Y POLÍTICAS DE ACCESO POR ROL
-- ==============================================================================

ALTER TABLE public.establecimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.establecimiento_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_ganadero ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacciones_financieras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros_pluviometro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notas_campo ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS GENERALES DE LECTURA (Todos los usuarios autenticados)
CREATE POLICY "Lectura de establecimientos por autenticados" 
  ON public.establecimientos FOR SELECT TO authenticated USING (true);

CREATE POLICY "Lectura de perfiles por autenticados" 
  ON public.perfiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Lectura de stock por autenticados" 
  ON public.stock_ganadero FOR SELECT TO authenticated USING (true);

CREATE POLICY "Lectura de pluviometro por autenticados" 
  ON public.registros_pluviometro FOR SELECT TO authenticated USING (true);

CREATE POLICY "Lectura de notas de campo por autenticados" 
  ON public.notas_campo FOR SELECT TO authenticated USING (true);

-- POLÍTICA DE FINANZAS: Solo ADMIN y CONTADOR pueden ver dinero
CREATE POLICY "Lectura de finanzas restringida por rol" 
  ON public.transacciones_financieras FOR SELECT TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.perfiles 
      WHERE perfiles.id = auth.uid() 
      AND perfiles.rol IN ('ADMIN', 'CONTADOR')
    )
  );

-- POLÍTICA DE INSERCIÓN EN FINANZAS: Solo ADMIN y CONTADOR
CREATE POLICY "Inserción de finanzas por ADMIN y CONTADOR" 
  ON public.transacciones_financieras FOR INSERT TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.perfiles 
      WHERE perfiles.id = auth.uid() 
      AND perfiles.rol IN ('ADMIN', 'CONTADOR')
    )
  );

-- POLÍTICAS DE ESCRITURA EN PLUVIÓMETRO Y NOTAS (Cualquier operario o capataz)
CREATE POLICY "Insercion de pluviometro por usuarios" 
  ON public.registros_pluviometro FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Insercion de notas de campo por usuarios" 
  ON public.notas_campo FOR INSERT TO authenticated WITH CHECK (true);
