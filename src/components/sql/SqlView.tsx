import React, { useState } from 'react';
import { Database, CheckCircle2, Code2, Copy, Check, FileCheck, Lock } from 'lucide-react';
import { useToastStore } from '../../stores/useToastStore';

export const SqlView: React.FC = () => {
  const { mostrarToast } = useToastStore();
  const [copiado, setCopiado] = useState(false);

  const sqlExtracto = `-- ==============================================================================
-- AGRO UY (SISTEMA DE GESTIÓN RURAL URUGUAY) - ESQUEMA SUPABASE POSTGRESQL
-- ==============================================================================

-- 1. ROLES Y DOMINIO URUGUAY
CREATE TYPE rol_usuario AS ENUM ('SUPERADMIN', 'PROPIETARIO', 'ADMIN', 'CAPATAZ', 'CONTADOR', 'OPERARIO');
CREATE TYPE tipo_moneda AS ENUM ('USD', 'UYU');
CREATE TYPE tipo_transaccion AS ENUM ('INGRESO', 'EGRESO');

-- 2. TRANSACCIONES FINANCIERAS CON COMPROBANTES / FACTURAS ADJUNTAS
CREATE TABLE public.transacciones_financieras (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  establecimiento_id UUID REFERENCES public.establecimientos(id) ON DELETE CASCADE NOT NULL,
  tipo tipo_transaccion NOT NULL,
  moneda tipo_moneda NOT NULL DEFAULT 'USD',
  monto NUMERIC(12,2) NOT NULL CHECK (monto >= 0),
  categoria TEXT NOT NULL,
  descripcion TEXT,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  ejercicio_agricola VARCHAR(10),
  periodo_mes VARCHAR(15),
  naturaleza_costo TEXT CHECK (naturaleza_costo IN ('FIJO', 'VARIABLE')),
  -- Facturas y Comprobantes en Storage
  comprobante_url TEXT, -- URL en Supabase Storage
  comprobante_tipo TEXT CHECK (comprobante_tipo IN ('IMAGE', 'PDF')),
  nro_factura TEXT,
  creado_por UUID REFERENCES public.perfiles(id)
);

-- 3. LIQUIDACIÓN DE SUELDOS Y RECIBOS DEL PERSONAL
CREATE TABLE public.recibos_sueldo (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
  usuario_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE NOT NULL, -- Empleado
  transaccion_id UUID REFERENCES public.transacciones_financieras(id) ON DELETE SET NULL,
  periodo_mes TEXT NOT NULL,
  ejercicio_agricola VARCHAR(10) NOT NULL,
  monto_liquido NUMERIC(12,2) NOT NULL CHECK (monto_liquido > 0),
  moneda tipo_moneda NOT NULL DEFAULT 'UYU',
  fecha_pago DATE NOT NULL DEFAULT CURRENT_DATE,
  recibo_url TEXT NOT NULL, -- PDF o Foto en Storage
  estado_firma TEXT NOT NULL DEFAULT 'PENDIENTE',
  creado_por UUID REFERENCES public.perfiles(id)
);

-- 4. POLÍTICAS RLS: El Empleado ve exclusivamente SUS propios recibos
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

-- 5. BUCKETS SUPABASE STORAGE
INSERT INTO storage.buckets (id, name, public) VALUES ('fotos-campo', 'fotos-campo', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('facturas-comprobantes', 'facturas-comprobantes', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('recibos-sueldo', 'recibos-sueldo', false);`;

  const handleCopiarSQL = () => {
    navigator.clipboard.writeText(sqlExtracto);
    setCopiado(true);
    mostrarToast('Copiado al Portapapeles', 'El extracto del esquema SQL ha sido copiado', 'EXITO');
    setTimeout(() => setCopiado(false), 3000);
  };

  return (
    <section aria-label="Vista Integración SQL Supabase" className="space-y-6 max-w-5xl">
      <header>
        <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
          <Database className="w-6 h-6 text-emerald-600" />
          <span>Integración SQL & Supabase (PostgreSQL)</span>
        </h2>
        <p className="text-xs text-slate-500 font-medium mt-1">
          Esquema de base de datos relacional con RLS, soporte multi-tenant, recibos de sueldo del personal y buckets de almacenamiento.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <article className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center space-x-2 text-emerald-700 font-extrabold text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Esquema SQL Actualizado</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Archivo <code className="bg-slate-100 px-1.5 py-0.5 rounded text-emerald-800 font-mono text-[11px]">supabase/schema.sql</code> listo en la raíz.
          </p>
        </article>

        <article className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center space-x-2 text-purple-700 font-extrabold text-xs">
            <FileCheck className="w-4 h-4 text-purple-600" />
            <span>Recibos de Sueldo & RLS</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Tabla <code className="bg-slate-100 px-1.5 py-0.5 rounded text-purple-800 font-mono text-[11px]">recibos_sueldo</code> con aislamiento para que cada empleado vea solo sus recibos.
          </p>
        </article>

        <article className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center space-x-2 text-blue-700 font-extrabold text-xs">
            <Lock className="w-4 h-4 text-blue-600" />
            <span>Buckets de Storage</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Buckets para <code className="bg-slate-100 px-1.5 py-0.5 rounded text-blue-800 font-mono text-[11px]">fotos-campo</code>, <code className="bg-slate-100 px-1.5 py-0.5 rounded text-blue-800 font-mono text-[11px]">facturas-comprobantes</code> y <code className="bg-slate-100 px-1.5 py-0.5 rounded text-blue-800 font-mono text-[11px]">recibos-sueldo</code>.
          </p>
        </article>
      </div>

      {/* Preview del Código SQL */}
      <article className="bg-slate-900 text-slate-200 p-5 rounded-2xl border border-slate-800 font-mono text-xs overflow-x-auto space-y-3 shadow-xl">
        <header className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-3">
          <span className="flex items-center gap-2 text-white font-bold">
            <Code2 className="w-4 h-4 text-emerald-400" />
            supabase/schema.sql (Extrato de Script Supabase)
          </span>
          <button
            onClick={handleCopiarSQL}
            className="inline-flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl border border-slate-700 text-[11px] font-sans transition-all cursor-pointer"
          >
            {copiado ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiado ? '¡Copiado!' : 'Copiar SQL'}</span>
          </button>
        </header>
        <pre className="text-emerald-400/90 leading-relaxed overflow-x-auto py-2">
          {sqlExtracto}
        </pre>
      </article>
    </section>
  );
};
