import React, { useState } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useEstanciasStore } from '../../stores/useEstanciasStore';
import { useCampoNotasStore } from '../../stores/useCampoNotasStore';
import { AccionesRapidasModal } from './AccionesRapidasModal';
import {
  Zap,
  DollarSign,
  CloudDrizzle,
  FileText,
  Beef,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AccionesRapidasBar: React.FC = () => {
  const { usuario } = useAuthStore();
  const { estanciaSeleccionadaId } = useEstanciasStore();
  const { obtenerPluviometroEstancia, obtenerNotasEstancia } = useCampoNotasStore();
  const navigate = useNavigate();

  const currentRole = usuario?.rol || 'OPERARIO';
  const puedeVerFinanzas = currentRole === 'ADMIN' || currentRole === 'CONTADOR';

  const [modalAbierto, setModalAbierto] = useState(false);
  const [tabInicialModal, setTabInicialModal] = useState<'FINANZAS' | 'PLUVIOMETRO' | 'NOTA'>('FINANZAS');

  const abrirModalConTab = (tab: 'FINANZAS' | 'PLUVIOMETRO' | 'NOTA') => {
    setTabInicialModal(tab);
    setModalAbierto(true);
  };

  const lecturasPluviometro = obtenerPluviometroEstancia(estanciaSeleccionadaId);
  const notasCampo = obtenerNotasEstancia(estanciaSeleccionadaId);

  const ultimaLluvia = lecturasPluviometro[0];

  return (
    <section aria-label="Acciones Rápidas y Bitácora del Campo" className="space-y-4">

      {/* Botonera de Acciones Rápidas */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Acciones Rápidas Operativas</h3>
              <p className="text-[11px] text-slate-500">Acceso directo a operaciones diarias del establecimiento</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">

          {/* Acción 1: Transacción Financiera */}
          {puedeVerFinanzas ? (
            <button
              onClick={() => abrirModalConTab('FINANZAS')}
              className="p-3 rounded-2xl bg-gradient-to-br from-emerald-50 to-slate-50 hover:from-emerald-100 hover:to-emerald-50 border border-emerald-200/80 text-emerald-950 font-bold text-xs flex flex-col items-start space-y-2 transition-all shadow-sm hover:shadow-md active:scale-98 cursor-pointer group"
            >
              <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-sm group-hover:scale-105 transition-transform">
                <DollarSign className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="block font-black text-xs text-emerald-950">+ Transacción</span>
                <span className="text-[10px] text-emerald-700 font-medium">Ingreso / Egreso caja</span>
              </div>
            </button>
          ) : (
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 text-xs flex flex-col items-start space-y-2 opacity-60">
              <div className="p-2 bg-slate-200 text-slate-500 rounded-xl">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <span className="block font-bold text-xs">Caja Restringida</span>
                <span className="text-[10px]">Solo Admin/Contador</span>
              </div>
            </div>
          )}

          {/* Acción 2: Pluviómetro */}
          <button
            onClick={() => abrirModalConTab('PLUVIOMETRO')}
            className="p-3 rounded-2xl bg-gradient-to-br from-blue-50 to-slate-50 hover:from-blue-100 hover:to-blue-50 border border-blue-200/80 text-blue-950 font-bold text-xs flex flex-col items-start space-y-2 transition-all shadow-sm hover:shadow-md active:scale-98 cursor-pointer group"
          >
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-sm group-hover:scale-105 transition-transform">
              <CloudDrizzle className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="block font-black text-xs text-blue-950">+ Pluviómetro</span>
              <span className="text-[10px] text-blue-700 font-medium">Lluvia caída (mm)</span>
            </div>
          </button>

          {/* Acción 3: Nota / Alerta Campo */}
          <button
            onClick={() => abrirModalConTab('NOTA')}
            className="p-3 rounded-2xl bg-gradient-to-br from-purple-50 to-slate-50 hover:from-purple-100 hover:to-purple-50 border border-purple-200/80 text-purple-950 font-bold text-xs flex flex-col items-start space-y-2 transition-all shadow-sm hover:shadow-md active:scale-98 cursor-pointer group"
          >
            <div className="p-2 bg-purple-600 text-white rounded-xl shadow-sm group-hover:scale-105 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="block font-black text-xs text-purple-950">+ Nota de Campo</span>
              <span className="text-[10px] text-purple-700 font-medium">Alerta o trabajo</span>
            </div>
          </button>

          {/* Acción 4: Ir a Movimientos Ganado */}
          <button
            onClick={() => navigate('/ganado')}
            className="p-3 rounded-2xl bg-gradient-to-br from-amber-50 to-slate-50 hover:from-amber-100 hover:to-amber-50 border border-amber-200/80 text-amber-950 font-bold text-xs flex flex-col items-start space-y-2 transition-all shadow-sm hover:shadow-md active:scale-98 cursor-pointer group"
          >
            <div className="p-2 bg-amber-600 text-white rounded-xl shadow-sm group-hover:scale-105 transition-transform">
              <Beef className="w-4 h-4" />
            </div>
            <div className="text-left flex items-center justify-between w-full">
              <div>
                <span className="block font-black text-xs text-amber-950">Mover Hacienda</span>
                <span className="text-[10px] text-amber-700 font-medium">Guías & recuento</span>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-700" />
            </div>
          </button>

        </div>
      </div>

      {/* Bitácora Reciente: Pluviómetro y Notas del Establecimiento */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Pluviómetro Reciente */}
        <article className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
              <CloudDrizzle className="w-4 h-4 text-blue-600" />
              <span>Últimas Precipitaciones (Pluviómetro)</span>
            </h4>
            <span className="text-[10px] text-slate-400 font-semibold">{lecturasPluviometro.length} registros</span>
          </div>

          {ultimaLluvia ? (
            <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="text-xl font-black text-blue-900">{ultimaLluvia.milimetros} mm</span>
                  <span className="text-[10px] text-blue-700 font-bold bg-blue-100 px-2 py-0.5 rounded-full">
                    {ultimaLluvia.fecha}
                  </span>
                </div>
                {ultimaLluvia.observacion && (
                  <p className="text-xs text-slate-600 italic font-medium">{ultimaLluvia.observacion}</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic py-2 text-center">Sin registros recientes de pluviómetro</p>
          )}
        </article>

        {/* Notas / Alertas del Campo */}
        <article className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
              <FileText className="w-4 h-4 text-purple-600" />
              <span>Observaciones del Campo</span>
            </h4>
            <span className="text-[10px] text-slate-400 font-semibold">{notasCampo.length} notas</span>
          </div>

          <div className="space-y-2 max-h-36 overflow-y-auto">
            {notasCampo.length > 0 ? (
              notasCampo.slice(0, 2).map((nota) => (
                <div key={nota.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-900">{nota.titulo}</span>
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${nota.prioridad === 'ALTA'
                          ? 'bg-rose-100 text-rose-800'
                          : nota.prioridad === 'MEDIA'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}>
                        {nota.prioridad}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-1">{nota.descripcion}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic py-2 text-center">Sin notas ni observaciones registradas</p>
            )}
          </div>
        </article>

      </div>

      {/* Modal Interactivo de Acciones Rápidas */}
      <AccionesRapidasModal
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        tabInicial={tabInicialModal}
      />

    </section>
  );
};
