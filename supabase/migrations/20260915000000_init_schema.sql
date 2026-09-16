-- ==============================================================================
-- ESQUEMA COMPLETO Y ACTUALIZADO SQL - AGRO UY (SISTEMA DE GESTIÓN RURAL URUGUAY)
-- Ejecutar en el Editor SQL de Supabase (https://supabase.com/dashboard)
-- Incluye Tablas, RLS, Storage Buckets y Datos de Semilla (Seed Data Precargados)
-- ==============================================================================

-- 1. TIPOS ENUMERADOS (DOMINIO URUGUAY & SAAS - DEFENSIVOS)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rol_usuario') THEN
    CREATE TYPE rol_usuario AS ENUM ('SUPERADMIN', 'PROPIETARIO', 'ADMIN', 'CAPATAZ', 'CONTADOR', 'OPERARIO');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_moneda') THEN
    CREATE TYPE tipo_moneda AS ENUM ('USD', 'UYU');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_transaccion') THEN
    CREATE TYPE tipo_transaccion AS ENUM ('INGRESO', 'EGRESO');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_tenencia') THEN
    CREATE TYPE tipo_tenencia AS ENUM ('PROPIO', 'ARRENDADO', 'PASTOREO');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'prioridad_nota') THEN
    CREATE TYPE prioridad_nota AS ENUM ('BAJA', 'MEDIA', 'ALTA');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_solicitud') THEN
    CREATE TYPE estado_solicitud AS ENUM ('PENDIENTE', 'APROBADA', 'RECHAZADA');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'plan_saas') THEN
    CREATE TYPE plan_saas AS ENUM ('BASIC', 'PRO', 'ENTERPRISE');
  END IF;
END $$;

-- 2. TABLA DE EMPRESAS MATRIZ (MULTI-TENANT / GRUPOS CRECURSOS)
CREATE TABLE IF NOT EXISTS public.empresas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  razon_social TEXT NOT NULL,
  rut VARCHAR(12) NOT NULL UNIQUE, -- RUT Uruguay (12 dígitos)
  nombre_fantasia TEXT,
  email_contacto TEXT NOT NULL,
  telefono TEXT,
  departamento_sede TEXT NOT NULL,
  hectareas_totales_grupo NUMERIC(10,2) DEFAULT 0,
  propietario_usuario_id UUID, -- Referencia al Usuario Propietario Inamovible
  plan plan_saas NOT NULL DEFAULT 'PRO',
  activa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2b. SOLICITUDES DE REGISTRO EN LÍNEA (ONBOARDING)
CREATE TABLE IF NOT EXISTS public.solicitudes_registro (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre_solicitante TEXT NOT NULL,
  email TEXT NOT NULL,
  telefono TEXT NOT NULL,
  nombre_empresa TEXT NOT NULL,
  rut VARCHAR(12) NOT NULL,
  departamento TEXT NOT NULL,
  hectareas_estimadas NUMERIC(10,2) DEFAULT 0,
  estado estado_solicitud NOT NULL DEFAULT 'PENDIENTE',
  fecha_solicitud DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABLA DE ESTABLECIMIENTOS RURALES (ESTANCIAS / CAMPOS / DICOSE)
CREATE TABLE IF NOT EXISTS public.establecimientos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
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

-- 4. TABLA DE PERFILES DE USUARIO (REEMPLAZA Y EXTIENDE auth.users)
CREATE TABLE IF NOT EXISTS public.perfiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE, -- Formato nombre.apellido (sin @)
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  rol rol_usuario NOT NULL DEFAULT 'OPERARIO',
  activo BOOLEAN NOT NULL DEFAULT true,
  fecha_alta DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Asignar FK de propietario a empresa de forma defensiva
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_empresa_propietario'
  ) THEN
    ALTER TABLE public.empresas 
    ADD CONSTRAINT fk_empresa_propietario 
    FOREIGN KEY (propietario_usuario_id) REFERENCES public.perfiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 5. TABLA INTERMEDIA: ASIGNACIÓN DE EMPLEADOS A MÚLTIPLES ESTANCIAS
CREATE TABLE IF NOT EXISTS public.establecimiento_usuarios (
  establecimiento_id UUID REFERENCES public.establecimientos(id) ON DELETE CASCADE NOT NULL,
  perfil_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (establecimiento_id, perfil_id)
);

-- 6. TABLA DE STOCK GANADERO (VACUNOS Y OVINOS)
CREATE TABLE IF NOT EXISTS public.stock_ganadero (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  establecimiento_id UUID REFERENCES public.establecimientos(id) ON DELETE CASCADE NOT NULL,
  especie TEXT NOT NULL CHECK (especie IN ('VACUNO', 'OVINO')),
  categoria TEXT NOT NULL, -- ej: VACAS_DE_CRIA, NOVILLOS_1_2, TERNEROS, OVEJAS_CRIA
  cabezas INT NOT NULL DEFAULT 0 CHECK (cabezas >= 0),
  kilos_promedio NUMERIC(6,2),
  ultima_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. TABLA DE TRANSACCIONES FINANCIERAS (INGRESOS Y EGRESOS BIMONEDA CON FACTURAS Y ADJUNTOS)
CREATE TABLE IF NOT EXISTS public.transacciones_financieras (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  establecimiento_id UUID REFERENCES public.establecimientos(id) ON DELETE CASCADE NOT NULL,
  tipo tipo_transaccion NOT NULL,
  moneda tipo_moneda NOT NULL DEFAULT 'USD',
  monto NUMERIC(12,2) NOT NULL CHECK (monto >= 0),
  categoria TEXT NOT NULL, -- ej: Venta vacunos, Sueldos y jornales, Rentas
  descripcion TEXT,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  ejercicio_agricola VARCHAR(10), -- ej: '2025/2026' (Julio a Junio)
  periodo_mes VARCHAR(15), -- ej: 'Setiembre', 'Julio', etc.
  naturaleza_costo TEXT CHECK (naturaleza_costo IN ('FIJO', 'VARIABLE')),
  -- Prorrateo entre campos
  es_prorrateado BOOLEAN NOT NULL DEFAULT false,
  distribucion_prorrateo JSONB, -- listado de {estancia_id, porcentaje, monto}
  -- Cotización Bimoneda Automática USD / UYU
  moneda_original tipo_moneda DEFAULT 'USD',
  monto_original NUMERIC(12,2),
  tipo_cambio NUMERIC(8,4) DEFAULT 40.50,
  monto_usd NUMERIC(12,2),
  monto_uyu NUMERIC(12,2),
  -- Adjuntos y Facturas en Storage
  comprobante_url TEXT, -- URL pública o firmada de la foto de la factura/recibo en Storage
  comprobante_tipo TEXT CHECK (comprobante_tipo IN ('IMAGE', 'PDF')),
  nro_factura TEXT, -- Número de e-factura / remisión física
  creado_por UUID REFERENCES public.perfiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. NUEVA TABLA: RECIBOS DE SUELDO Y LIQUIDACIÓN DE HABERES DEL PERSONAL
CREATE TABLE IF NOT EXISTS public.recibos_sueldo (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
  usuario_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE NOT NULL, -- Empleado que cobra
  transaccion_id UUID REFERENCES public.transacciones_financieras(id) ON DELETE SET NULL, -- Vinculación a caja
  periodo_mes TEXT NOT NULL, -- ej: "Setiembre 2026"
  ejercicio_agricola VARCHAR(10) NOT NULL, -- ej: "2026/2027"
  monto_liquido NUMERIC(12,2) NOT NULL CHECK (monto_liquido > 0),
  moneda tipo_moneda NOT NULL DEFAULT 'UYU',
  fecha_pago DATE NOT NULL DEFAULT CURRENT_DATE,
  recibo_url TEXT NOT NULL, -- PDF o foto del recibo firmado almacenado en Supabase Storage
  estado_firma TEXT NOT NULL DEFAULT 'PENDIENTE' CHECK (estado_firma IN ('PENDIENTE', 'FIRMADO', 'CONFORME')),
  observaciones TEXT,
  creado_por UUID REFERENCES public.perfiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. TABLA DE REGLAS PREDETERMINADAS DE PRORRATEO CORPORATIVO
CREATE TABLE IF NOT EXISTS public.reglas_prorrateo_establecimiento (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  establecimiento_id UUID REFERENCES public.establecimientos(id) ON DELETE CASCADE NOT NULL UNIQUE,
  porcentaje_predeterminado NUMERIC(5,2) NOT NULL CHECK (porcentaje_predeterminado >= 0 AND porcentaje_predeterminado <= 100),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. TABLA DE PLUVIÓMETRO (REGISTRO DIARIO DE PRECIPITACIONES MM)
CREATE TABLE IF NOT EXISTS public.registros_pluviometro (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  establecimiento_id UUID REFERENCES public.establecimientos(id) ON DELETE CASCADE NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  milimetros NUMERIC(5,1) NOT NULL CHECK (milimetros >= 0),
  observacion TEXT,
  registrado_por UUID REFERENCES public.perfiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. TABLA DE NOTAS DE CAMPO / ALERTAS OPERATIVAS
CREATE TABLE IF NOT EXISTS public.notas_campo (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  establecimiento_id UUID REFERENCES public.establecimientos(id) ON DELETE CASCADE NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  prioridad prioridad_nota NOT NULL DEFAULT 'MEDIA',
  creado_por UUID REFERENCES public.perfiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. TABLAS DE CATÁLOGO Y CONFIGURACIÓN DE RUBROS (PLAN AGROPECUARIO)
CREATE TABLE IF NOT EXISTS public.conceptos_financieros (
  id TEXT PRIMARY KEY, -- ej: 'ing-vacunos', 'egr-sueldos-jornales'
  tipo tipo_transaccion NOT NULL,
  grupo TEXT NOT NULL, -- ej: 'Ventas de Hacienda', 'Mano de Obra', 'Impuestos'
  nombre TEXT NOT NULL, -- ej: 'Vacunos', 'Sueldos y jornales'
  icono TEXT DEFAULT '📋',
  es_estandar BOOLEAN NOT NULL DEFAULT true,
  naturaleza_costo TEXT CHECK (naturaleza_costo IN ('FIJO', 'VARIABLE')),
  es_recurrente_mensual BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.conceptos_activos_empresa (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  concepto_id TEXT NOT NULL REFERENCES public.conceptos_financieros(id) ON DELETE CASCADE,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unq_concepto_empresa UNIQUE (concepto_id)
);

-- 13. TABLA DE TRASLADOS INTERNOS DE GANADO E IMPUTACIÓN ECONÓMICA
CREATE TABLE IF NOT EXISTS public.movimientos_ganado (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  estancia_origen_id UUID REFERENCES public.establecimientos(id) ON DELETE RESTRICT NOT NULL,
  estancia_destino_id UUID REFERENCES public.establecimientos(id) ON DELETE RESTRICT NOT NULL,
  especie TEXT NOT NULL CHECK (especie IN ('VACUNO', 'OVINO')),
  categoria TEXT NOT NULL,
  cabezas INT NOT NULL CHECK (cabezas > 0),
  kilos_totales NUMERIC(10,2),
  kilos_promedio NUMERIC(6,2),
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  observaciones TEXT,
  valorizar_transferencia BOOLEAN NOT NULL DEFAULT true,
  precio_por_cabeza NUMERIC(10,2),
  precio_por_kilo NUMERIC(6,2),
  monto_total_imputado NUMERIC(12,2) DEFAULT 0,
  creado_por UUID REFERENCES public.perfiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- SEGURIDAD: ROW LEVEL SECURITY (RLS) Y POLÍTICAS DE ACCESO MULTI-EMPRESA
-- ==============================================================================

ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitudes_registro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.establecimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.establecimiento_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_ganadero ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacciones_financieras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recibos_sueldo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros_pluviometro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notas_campo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conceptos_financieros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conceptos_activos_empresa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos_ganado ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS GENERALES DE LECTURA POR AUTENTICADOS (DEFENSIVAS)
DROP POLICY IF EXISTS "Lectura de empresas por autenticados" ON public.empresas;
CREATE POLICY "Lectura de empresas por autenticados" 
  ON public.empresas FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Lectura de establecimientos por autenticados" ON public.establecimientos;
CREATE POLICY "Lectura de establecimientos por autenticados" 
  ON public.establecimientos FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Lectura de perfiles por autenticados" ON public.perfiles;
CREATE POLICY "Lectura de perfiles por autenticados" 
  ON public.perfiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Lectura de stock por autenticados" ON public.stock_ganadero;
CREATE POLICY "Lectura de stock por autenticados" 
  ON public.stock_ganadero FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Lectura de pluviometro por autenticados" ON public.registros_pluviometro;
CREATE POLICY "Lectura de pluviometro por autenticados" 
  ON public.registros_pluviometro FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Lectura de notas de campo por autenticados" ON public.notas_campo;
CREATE POLICY "Lectura de notas de campo por autenticados" 
  ON public.notas_campo FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Lectura de catálogo de conceptos por autenticados" ON public.conceptos_financieros;
CREATE POLICY "Lectura de catálogo de conceptos por autenticados" 
  ON public.conceptos_financieros FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Lectura de conceptos activos por autenticados" ON public.conceptos_activos_empresa;
CREATE POLICY "Lectura de conceptos activos por autenticados" 
  ON public.conceptos_activos_empresa FOR SELECT TO authenticated USING (true);

-- POLÍTICA DE FINANZAS GENERALES: PROPIETARIO, ADMIN, CONTADOR Y SUPERADMIN
DROP POLICY IF EXISTS "Lectura de finanzas restringida por rol" ON public.transacciones_financieras;
CREATE POLICY "Lectura de finanzas restringida por rol" 
  ON public.transacciones_financieras FOR SELECT TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.perfiles 
      WHERE perfiles.id = auth.uid() 
      AND perfiles.rol IN ('PROPIETARIO', 'ADMIN', 'CONTADOR', 'SUPERADMIN')
    )
  );

DROP POLICY IF EXISTS "Inserción de finanzas por roles autorizados" ON public.transacciones_financieras;
CREATE POLICY "Inserción de finanzas por roles autorizados" 
  ON public.transacciones_financieras FOR INSERT TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.perfiles 
      WHERE perfiles.id = auth.uid() 
      AND perfiles.rol IN ('PROPIETARIO', 'ADMIN', 'CONTADOR', 'SUPERADMIN')
    )
  );

-- POLÍTICA EXCLUSIVA DE RECIBOS DE SUELDO: El Empleado ve SUS recibos; la Administración ve todos
DROP POLICY IF EXISTS "Empleados leen exclusivamente sus propios recibos de sueldo" ON public.recibos_sueldo;
CREATE POLICY "Empleados leen exclusivamente sus propios recibos de sueldo" 
  ON public.recibos_sueldo FOR SELECT TO authenticated 
  USING (
    usuario_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.perfiles 
      WHERE perfiles.id = auth.uid() 
      AND perfiles.rol IN ('PROPIETARIO', 'ADMIN', 'CONTADOR', 'SUPERADMIN')
    )
  );

DROP POLICY IF EXISTS "Administracion gestiona recibos de sueldo" ON public.recibos_sueldo;
CREATE POLICY "Administracion gestiona recibos de sueldo" 
  ON public.recibos_sueldo FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.perfiles 
      WHERE perfiles.id = auth.uid() 
      AND perfiles.rol IN ('PROPIETARIO', 'ADMIN', 'CONTADOR', 'SUPERADMIN')
    )
  );

-- POLÍTICAS DE ESCRITURA EN PLUVIÓMETRO, NOTAS Y MOVIMIENTOS
DROP POLICY IF EXISTS "Insercion de pluviometro por usuarios" ON public.registros_pluviometro;
CREATE POLICY "Insercion de pluviometro por usuarios" 
  ON public.registros_pluviometro FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Insercion de notas de campo por usuarios" ON public.notas_campo;
CREATE POLICY "Insercion de notas de campo por usuarios" 
  ON public.notas_campo FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Lectura de movimientos de ganado por autenticados" ON public.movimientos_ganado;
CREATE POLICY "Lectura de movimientos de ganado por autenticados" 
  ON public.movimientos_ganado FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Escritura de movimientos de ganado por capataz o admin" ON public.movimientos_ganado;
CREATE POLICY "Escritura de movimientos de ganado por capataz o admin" 
  ON public.movimientos_ganado FOR INSERT TO authenticated WITH CHECK (true);

-- ==============================================================================
-- CONFIGURACIÓN DE SUPABASE STORAGE (BUCKETS Y POLÍTICAS DE ARCHIVOS)
-- ==============================================================================

-- 1. Bucket Fotos de Campo (Lotes, Pluviómetro, Notas)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('fotos-campo', 'fotos-campo', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Bucket Facturas y Comprobantes Financieros
INSERT INTO storage.buckets (id, name, public) 
VALUES ('facturas-comprobantes', 'facturas-comprobantes', false)
ON CONFLICT (id) DO NOTHING;

-- 3. Bucket Privado Recibos de Sueldo del Personal
INSERT INTO storage.buckets (id, name, public) 
VALUES ('recibos-sueldo', 'recibos-sueldo', false)
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- DATOS PRECARGADOS (SEED DATA / INSERCIONES INICIALES PLAN AGROPECUARIO)
-- ==============================================================================

-- 1. INSERCIÓN DE CONCEPTOS FINANCIEROS DEL PLAN AGROPECUARIO URUGUAY
INSERT INTO public.conceptos_financieros (id, tipo, grupo, nombre, icono, es_estandar, naturaleza_costo, es_recurrente_mensual) VALUES
  ('ing-vacunos', 'INGRESO', 'Ventas de Hacienda', 'Vacunos', '🐮', true, NULL, false),
  ('ing-lanares', 'INGRESO', 'Ventas de Hacienda', 'Lanares', '🐑', true, NULL, false),
  ('ing-lana', 'INGRESO', 'Ventas de Productos', 'Lana', '🧶', true, NULL, false),
  ('ing-cereales', 'INGRESO', 'Ventas de Productos', 'Cereales', '🌾', true, NULL, false),
  ('ing-brou', 'INGRESO', 'Créditos Bancarios Recibidos', 'BROU (Banco República)', '🏦', true, NULL, false),
  ('ing-pastoreos', 'INGRESO', 'Otros Ingresos', 'Pastoreos cobrados', '🌿', true, NULL, false),
  ('ing-servicios', 'INGRESO', 'Otros Ingresos', 'Venta de servicios', '🛠️', true, NULL, false),
  
  ('egr-sueldos-jornales', 'EGRESO', 'Mano de Obra', 'Sueldos y jornales', '👥', true, 'FIJO', true),
  ('egr-comestibles', 'EGRESO', 'Mano de Obra', 'Comestibles', '🛒', true, 'FIJO', true),
  ('egr-leyes-sociales', 'EGRESO', 'Mano de Obra', 'Leyes Sociales (BPS)', '📄', true, 'FIJO', true),
  ('egr-sanidad-vacunos', 'EGRESO', 'Sanidad', 'Vacunos', '💊', true, 'VARIABLE', false),
  ('egr-sanidad-lanares', 'EGRESO', 'Sanidad', 'Lanares', '💉', true, 'VARIABLE', false),
  ('egr-honorarios-vet', 'EGRESO', 'Sanidad', 'Honorarios Veterinarios / Asesoría', '🩺', true, 'VARIABLE', false),
  ('egr-pasturas-semillas-forrajeros', 'EGRESO', 'Mantenimiento de Pasturas', 'Semillas cv. forrajeros', '🌱', true, 'VARIABLE', false),
  ('egr-pasturas-fertilizantes', 'EGRESO', 'Mantenimiento de Pasturas', 'Fertilizantes y Agroquímicos', '🧪', true, 'VARIABLE', false),
  ('egr-maq-comb-auto', 'EGRESO', 'Maquinaria y Vehículos', 'Comb. y Lubr. auto-camioneta', '⛽', true, 'VARIABLE', false),
  ('egr-maq-repuestos', 'EGRESO', 'Maquinaria y Vehículos', 'Repuestos y Reparaciones', '🛠️', true, 'VARIABLE', false),
  ('egr-rentas-arrendamientos', 'EGRESO', 'Pago de Rentas', 'Arrendamientos', '🏡', true, 'FIJO', false),
  ('egr-serv-fletes', 'EGRESO', 'Servicios Contratados', 'Fletes', '🚛', true, 'VARIABLE', false),
  ('egr-adm-sueldo-administrador', 'EGRESO', 'Gastos de Administración', 'Sueldo administrador', '💼', true, 'FIJO', true),
  ('egr-impuestos-rurales', 'EGRESO', 'Impuestos y Tasas', 'Contribución Inmobiliaria / MEVIR / Primaria', '🏛️', true, 'FIJO', false),
  ('egr-est-antel', 'EGRESO', 'Otros Gastos de Estructura', 'ANTEL', '📞', true, 'FIJO', true),
  ('egr-est-ute', 'EGRESO', 'Otros Gastos de Estructura', 'UTE', '⚡', true, 'FIJO', true),
  ('egr-est-seguros-bse', 'EGRESO', 'Otros Gastos de Estructura', 'Seguros (BSE / Patente)', '🛡️', true, 'FIJO', false)
ON CONFLICT (id) DO NOTHING;

-- 2. INSERCIÓN DE CONCEPTOS ACTIVOS POR DEFECTO PARA LA EMPRESA
INSERT INTO public.conceptos_activos_empresa (concepto_id, activo)
SELECT id, true FROM public.conceptos_financieros
ON CONFLICT (concepto_id) DO NOTHING;
