import React from 'react';
import { Building2, Sprout, Sparkles, PlusCircle } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useEmpresasStore } from '../../stores/useEmpresasStore';
import { useEstanciasStore } from '../../stores/useEstanciasStore';

interface Props {
  onAbrirWizard: () => void;
}

export const BannerOnboardingBienvenida: React.FC<Props> = ({ onAbrirWizard }) => {
  const { usuario } = useAuthStore();
  const { empresas } = useEmpresasStore();
  const { estancias } = useEstanciasStore();

  const sinEmpresa = !usuario?.empresa_ids || usuario.empresa_ids.length === 0 || empresas.length === 0;
  const sinEstancias = estancias.length === 0;

  if (!sinEmpresa && !sinEstancias) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 rounded-2xl p-5 text-white shadow-xl border border-emerald-700/50 mb-4 relative overflow-hidden">
      {/* Background decoration design */}
      <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute right-20 top-0 w-32 h-32 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center space-x-2 bg-emerald-700/60 text-emerald-200 text-xs px-3 py-1 rounded-full font-medium border border-emerald-500/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>Bienvenido a AgroUY</span>
          </div>

          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            ¡Comienza a gestionar tu campo de forma profesional!
          </h2>

          <p className="text-emerald-100 text-xs md:text-sm leading-relaxed">
            {sinEmpresa 
              ? 'Aún no registraste tu primera Empresa o Razón Social. Configura tus datos para habilitar la carga de hacienda, lluvias y finanzas.'
              : 'Ya tienes tu empresa registrada, pero aún no agregaste un Establecimiento (Campo) activo.'
            }
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto shrink-0">
          <button
            onClick={onAbrirWizard}
            className="inline-flex items-center justify-center space-x-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-lg hover:shadow-amber-500/20 transition-all text-xs md:text-sm"
          >
            <PlusCircle className="w-4 h-4 text-slate-950" />
            <span>Configurar Empresa y Campo</span>
          </button>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-emerald-700/40 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-emerald-200">
        <div className="flex items-center space-x-2">
          <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span><strong>Paso 1:</strong> Crea la Razón Social y RUT de tu empresa.</span>
        </div>
        <div className="flex items-center space-x-2">
          <Sprout className="w-4 h-4 text-emerald-400 shrink-0" />
          <span><strong>Paso 2:</strong> Asigna tu establecimiento con DICOSE y Hectáreas.</span>
        </div>
      </div>
    </div>
  );
};
