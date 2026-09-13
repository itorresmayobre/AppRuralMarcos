import React from 'react';
import { Database, CheckCircle2, Code2, KeyRound } from 'lucide-react';

export const SqlView: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Database className="w-6 h-6 text-emerald-600" />
          Integración SQL & Supabase (PostgreSQL)
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Estructura de tablas SQL relacionales y variables de entorno para Vercel.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 text-emerald-700 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Esquema SQL Creado</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Se ha preparado el archivo <code className="bg-slate-100 px-1.5 py-0.5 rounded text-emerald-800 font-mono text-[11px]">supabase/schema.sql</code> listo para copiar y pegar en el Editor SQL de tu panel de Supabase.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 text-blue-700 font-bold text-sm">
            <KeyRound className="w-5 h-5 text-blue-600" />
            <span>Variables en Vercel</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Las llaves de tu base de datos se configuran en el archivo <code className="bg-slate-100 px-1.5 py-0.5 rounded text-blue-800 font-mono text-[11px]">.env</code> con <code className="font-mono">VITE_SUPABASE_URL</code> y <code className="font-mono">VITE_SUPABASE_ANON_KEY</code>.
          </p>
        </div>
      </div>

      {/* SQL Snippet Preview */}
      <div className="bg-slate-900 text-slate-200 p-5 rounded-xl border border-slate-800 font-mono text-xs overflow-x-auto space-y-2">
        <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2 mb-2">
          <span className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-emerald-400" />
            supabase/schema.sql (Extracto de Tablas)
          </span>
          <span className="text-[10px] text-emerald-400 font-sans font-semibold">PostgreSQL</span>
        </div>
        <pre className="text-slate-300">
{`-- Tabla de Perfiles de Usuario con Roles
CREATE TABLE public.perfiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  nombre TEXT NOT NULL,
  rol rol_usuario NOT NULL DEFAULT 'OPERARIO'
);

-- Tabla de Stock Ganadero por DICOSE
CREATE TABLE public.stock_ganadero (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  especie TEXT CHECK (especie IN ('VACUNO', 'OVINO')),
  categoria TEXT NOT NULL,
  cabezas INT NOT NULL DEFAULT 0
);`}
        </pre>
      </div>
    </div>
  );
};
