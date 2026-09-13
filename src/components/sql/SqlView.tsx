import React, { useState } from 'react';
import { Database, CheckCircle2, Code2, KeyRound, Copy, Check } from 'lucide-react';
import { useToastStore } from '../../stores/useToastStore';

export const SqlView: React.FC = () => {
  const { mostrarToast } = useToastStore();
  const [copiado, setCopiado] = useState(false);

  const sqlExtracto = `-- ESQUEMA ACTUALIZADO EN SUPABASE (PostgreSQL)

-- 1. Tabla de Perfiles con usernames sin '@' (nombre.apellido)
CREATE TABLE public.perfiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT NOT NULL UNIQUE, -- ej: "marcos.propietario"
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  rol rol_usuario NOT NULL DEFAULT 'OPERARIO'
);

-- 2. Tabla Intermedia: Empleados asignados a Múltiples Estancias
CREATE TABLE public.establecimiento_usuarios (
  establecimiento_id UUID REFERENCES public.establecimientos(id) ON DELETE CASCADE,
  perfil_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE,
  PRIMARY KEY (establecimiento_id, perfil_id)
);

-- 3. Tabla de Pluviómetro (Registro Diario de Precipitaciones mm)
CREATE TABLE public.registros_pluviometro (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  establecimiento_id UUID REFERENCES public.establecimientos(id) ON DELETE CASCADE NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  milimetros NUMERIC(5,1) NOT NULL CHECK (milimetros >= 0),
  observacion TEXT,
  registrado_por UUID REFERENCES public.perfiles(id)
);

-- 4. Tabla de Notas de Campo y Alertas Operativas
CREATE TABLE public.notas_campo (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  establecimiento_id UUID REFERENCES public.establecimientos(id) ON DELETE CASCADE NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  prioridad prioridad_nota NOT NULL DEFAULT 'MEDIA',
  creado_por UUID REFERENCES public.perfiles(id)
);`;

  const handleCopiarSQL = () => {
    navigator.clipboard.writeText(sqlExtracto);
    setCopiado(true);
    mostrarToast('Copiado al Portapapeles', 'El extracto del esquema SQL ha sido copiado', 'EXITO');
    setTimeout(() => setCopiado(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Database className="w-6 h-6 text-emerald-600" />
          Integración SQL & Supabase (PostgreSQL)
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Esquema de base de datos relacional actualizado con perfiles sin `@`, pluviómetro, notas de campo y reglas de RLS.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 text-emerald-700 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Esquema SQL Actualizado</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Se ha actualizado el archivo <code className="bg-slate-100 px-1.5 py-0.5 rounded text-emerald-800 font-mono text-[11px]">supabase/schema.sql</code> en el repositorio con todas las migraciones recientes.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 text-blue-700 font-bold text-sm">
            <KeyRound className="w-5 h-5 text-blue-600" />
            <span>Variables en Vercel & .env</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Variables listas para conexión en vivo con <code className="bg-slate-100 px-1.5 py-0.5 rounded text-blue-800 font-mono text-[11px]">VITE_SUPABASE_URL</code> y <code className="bg-slate-100 px-1.5 py-0.5 rounded text-blue-800 font-mono text-[11px]">VITE_SUPABASE_ANON_KEY</code>.
          </p>
        </div>
      </div>

      {/* Preview del Código SQL */}
      <div className="bg-slate-900 text-slate-200 p-5 rounded-2xl border border-slate-800 font-mono text-xs overflow-x-auto space-y-3 shadow-xl">
        <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-3">
          <span className="flex items-center gap-2 text-white font-bold">
            <Code2 className="w-4 h-4 text-emerald-400" />
            supabase/schema.sql (Tablas & Migraciones)
          </span>
          <button
            onClick={handleCopiarSQL}
            className="inline-flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl border border-slate-700 text-[11px] font-sans transition-all cursor-pointer"
          >
            {copiado ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiado ? '¡Copiado!' : 'Copiar SQL'}</span>
          </button>
        </div>
        <pre className="text-emerald-400/90 leading-relaxed overflow-x-auto py-2">
          {sqlExtracto}
        </pre>
      </div>
    </div>
  );
};
