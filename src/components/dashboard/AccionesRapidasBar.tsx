import React, { useState } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useEstanciasStore } from '../../stores/useEstanciasStore';
import { useCampoNotasStore } from '../../stores/useCampoNotasStore';
import { PluviometroModal } from '../modals/PluviometroModal';
import { TransaccionModal } from '../modals/TransaccionModal';
import { NotaCampoModal } from '../modals/NotaCampoModal';
import { TrasladoGanadoModal } from '../modals/TrasladoGanadoModal';
import { formatearFechaUY } from '../../utils/fechas';
import {
  CloudDrizzle,
  FileText,
  Plus
} from 'lucide-react';

export const AccionesRapidasBar: React.FC = () => {
  const { usuario } = useAuthStore();
  const { estanciaSeleccionadaId } = useEstanciasStore();
  const { obtenerPluviometroEstancia, obtenerNotasEstancia } = useCampoNotasStore();

  const currentRole = usuario?.rol || 'OPERARIO';
  const puedeVerFinanzas = currentRole === 'ADMIN' || currentRole === 'CONTADOR' || currentRole === 'PROPIETARIO' || currentRole === 'SUPERADMIN';

  const [modalTransaccionAbierto, setModalTransaccionAbierto] = useState(false);
  const [modalPluviometroAbierto, setModalPluviometroAbierto] = useState(false);
  const [modalNotaAbierto, setModalNotaAbierto] = useState(false);
  const [modalTrasladoAbierto, setModalTrasladoAbierto] = useState(false);

  const lecturasPluviometro = obtenerPluviometroEstancia(estanciaSeleccionadaId);
  const notasCampo = obtenerNotasEstancia(estanciaSeleccionadaId);

  return (
    <section aria-label="Acciones Rápidas y Bitácora del Campo" className="space-y-3">

      {/* Botonera de Acciones Rápidas */}
      <div className="app-card space-y-2">
        <h3 className="app-metric-label">Acciones Rápidas</h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {puedeVerFinanzas && (
            <button
              onClick={() => setModalTransaccionAbierto(true)}
              className="p-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs text-center transition-all cursor-pointer min-h-[36px]"
            >
              + Transacción
            </button>
          )}

          <button
            onClick={() => setModalPluviometroAbierto(true)}
            className="p-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs text-center transition-all cursor-pointer min-h-[36px]"
          >
            + Pluviómetro
          </button>

          <button
            onClick={() => setModalNotaAbierto(true)}
            className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs text-center transition-all cursor-pointer min-h-[36px]"
          >
            + Nota de Campo
          </button>

          <button
            onClick={() => setModalTrasladoAbierto(true)}
            className="p-2.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs text-center transition-all cursor-pointer min-h-[36px]"
          >
            + Traslado Ganado
          </button>
        </div>
      </div>

      {/* Bitácora Reciente: Pluviómetro y Notas del Establecimiento */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

        {/* Pluviómetro Reciente */}
        <article className="app-card space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="app-metric-label flex items-center gap-1.5">
              <CloudDrizzle className="w-4 h-4 text-blue-600" />
              <span>Últimas Precipitaciones (Pluviómetro)</span>
            </h4>
            <button
              onClick={() => setModalPluviometroAbierto(true)}
              className="inline-flex items-center space-x-1 text-[10px] font-extrabold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-lg cursor-pointer transition-all active:scale-95"
            >
              <Plus className="w-3 h-3 text-blue-600" />
              <span>Cargar Lluvia</span>
            </button>
          </div>

          {lecturasPluviometro.length > 0 ? (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {lecturasPluviometro.slice(0, 5).map((lluvia) => (
                <div key={lluvia.id} className="bg-blue-50/70 border border-blue-200/80 rounded-lg p-2 flex items-center justify-between">
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-blue-900">{lluvia.milimetros} mm</span>
                      <span className="text-[10px] text-blue-800 font-bold bg-blue-100 px-1.5 py-0.2 rounded border border-blue-200">
                        {formatearFechaUY(lluvia.fecha)}
                      </span>
                    </div>
                    {lluvia.observacion && (
                      <p className="text-[11px] text-slate-600 italic font-medium truncate">{lluvia.observacion}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-3 space-y-2">
              <p className="text-xs text-slate-400 italic">Sin registros recientes de pluviómetro</p>
              <button
                onClick={() => setModalPluviometroAbierto(true)}
                className="inline-flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-sm cursor-pointer transition-all active:scale-95"
              >
                <CloudDrizzle className="w-3.5 h-3.5" />
                <span>+ Registrar Lluvia Caída</span>
              </button>
            </div>
          )}
        </article>

        {/* Notas / Alertas del Campo */}
        <article className="app-card space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="app-metric-label flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-purple-600" />
              <span>Observaciones del Campo</span>
            </h4>
            <button
              onClick={() => setModalNotaAbierto(true)}
              className="inline-flex items-center space-x-1 text-[10px] font-extrabold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2 py-0.5 rounded-lg cursor-pointer transition-all active:scale-95"
            >
              <Plus className="w-3 h-3 text-purple-600" />
              <span>Nueva Nota</span>
            </button>
          </div>

          {notasCampo.length > 0 ? (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {notasCampo.slice(0, 5).map((nota) => (
                <div key={nota.id} className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 flex items-start justify-between">
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-900 truncate">{nota.titulo}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded flex-shrink-0 ${
                        nota.prioridad === 'ALTA'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : nota.prioridad === 'MEDIA'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-slate-200 text-slate-700'
                      }`}>
                        {nota.prioridad}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-1">{nota.descripcion}</p>
                    <span className="text-[9px] text-slate-400 font-mono block pt-0.5">{formatearFechaUY(nota.fecha)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-3 space-y-2">
              <p className="text-xs text-slate-400 italic">Sin notas ni observaciones registradas</p>
              <button
                onClick={() => setModalNotaAbierto(true)}
                className="inline-flex items-center space-x-1 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs px-3 py-1.5 rounded-xl shadow-sm cursor-pointer transition-all active:scale-95"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>+ Registrar Nueva Nota</span>
              </button>
            </div>
          )}
        </article>

      </div>

      {/* Modales Exclusivos y Desacoplados por Dominio */}
      <TransaccionModal
        isOpen={modalTransaccionAbierto}
        onClose={() => setModalTransaccionAbierto(false)}
      />

      <PluviometroModal
        isOpen={modalPluviometroAbierto}
        onClose={() => setModalPluviometroAbierto(false)}
      />

      <NotaCampoModal
        isOpen={modalNotaAbierto}
        onClose={() => setModalNotaAbierto(false)}
      />

      <TrasladoGanadoModal
        isOpen={modalTrasladoAbierto}
        onClose={() => setModalTrasladoAbierto(false)}
      />

    </section>
  );
};
