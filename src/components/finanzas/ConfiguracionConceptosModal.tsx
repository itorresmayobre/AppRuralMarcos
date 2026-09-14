import React, { useState } from 'react';
import { useConceptosFinancierosStore } from '../../stores/useConceptosFinancierosStore';
import { useToastStore } from '../../stores/useToastStore';
import { conceptosService } from '../../services/api/conceptosService';
import type { TipoTransaccion } from '../../types';
import {
  X,
  Settings,
  CheckCircle2,
  XCircle,
  Sparkles,
  Loader2,
  Check,
  TrendingUp,
  TrendingDown,
  Layers
} from 'lucide-react';

interface ConfiguracionConceptosModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConfiguracionConceptosModal: React.FC<ConfiguracionConceptosModalProps> = ({ isOpen, onClose }) => {
  const {
    catalog,
    conceptosActivosIds,
    toggleConcepto,
    activarTodosGrupo,
    obtenerGruposPorTipo
  } = useConceptosFinancierosStore();

  const { mostrarToast } = useToastStore();
  const [tipoFiltro, setTipoFiltro] = useState<TipoTransaccion>('INGRESO');
  const [guardando, setGuardando] = useState(false);

  if (!isOpen) return null;

  const conceptosDelTipo = catalog.filter((c) => c.tipo === tipoFiltro);
  const gruposDelTipo = obtenerGruposPorTipo(tipoFiltro);

  const totalActivosIngresos = catalog.filter(c => c.tipo === 'INGRESO' && conceptosActivosIds.includes(c.id)).length;
  const totalActivosEgresos = catalog.filter(c => c.tipo === 'EGRESO' && conceptosActivosIds.includes(c.id)).length;

  const handleGuardarEnSupabase = async () => {
    setGuardando(true);
    try {
      await conceptosService.guardarConfiguracionConceptos(conceptosActivosIds);
      setGuardando(false);
      mostrarToast(
        '¡Rubros Sincronizados!',
        `Se han actualizado los conceptos activos en Supabase (${conceptosActivosIds.length} habilitados).`,
        'EXITO'
      );
      onClose();
    } catch (err: unknown) {
      setGuardando(false);
      const msg = err instanceof Error ? err.message : 'Error al guardar la configuración';
      mostrarToast('Error al Guardar', msg, 'ERROR');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Cabecera del Panel de Configuración de Rubros */}
        <header className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-600 text-white rounded-2xl shadow-md">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold flex items-center gap-2">
                <span>Catálogo de Rubros Plan Agropecuario</span>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 font-mono px-2 py-0.5 rounded-full border border-emerald-800">
                  ADMIN
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Activa o desactiva qué conceptos requerirá tu empresa en los formularios diarios.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Pestaña de Selección (INGRESOS vs EGRESOS) + Resumen de Activos */}
        <div className="p-4 bg-slate-50 border-b border-slate-200/90 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
          
          <div className="flex bg-slate-200/90 p-1 rounded-2xl w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setTipoFiltro('INGRESO')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-black flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                tipoFiltro === 'INGRESO'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-slate-300/60'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>INGRESOS / ENTRADAS ({totalActivosIngresos})</span>
            </button>

            <button
              type="button"
              onClick={() => setTipoFiltro('EGRESO')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-black flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                tipoFiltro === 'EGRESO'
                  ? 'bg-rose-700 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-slate-300/60'
              }`}
            >
              <TrendingDown className="w-4 h-4" />
              <span>EGRESOS / SALIDAS ({totalActivosEgresos})</span>
            </button>
          </div>

          <div className="text-right text-xs font-medium text-slate-500 hidden sm:block">
            Habilitados: <strong className="text-emerald-700">{conceptosActivosIds.length}</strong> de {catalog.length} rubros
          </div>
        </div>

        {/* Lista de Grupos y Conceptos Configurables */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {gruposDelTipo.map((grupoNombre) => {
            const conceptosDelGrupo = conceptosDelTipo.filter((c) => c.grupo === grupoNombre);
            const activosEnGrupo = conceptosDelGrupo.filter((c) => conceptosActivosIds.includes(c.id)).length;
            const todosActivos = activosEnGrupo === conceptosDelGrupo.length;

            return (
              <section key={grupoNombre} className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 space-y-3">
                
                {/* Cabecera del Grupo */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">{grupoNombre}</h4>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      {activosEnGrupo} / {conceptosDelGrupo.length} activos
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => activarTodosGrupo(grupoNombre, !todosActivos)}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-all cursor-pointer"
                  >
                    {todosActivos ? 'Desactivar Todos' : 'Activar Todos'}
                  </button>
                </div>

                {/* Grid de Ítems del Grupo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {conceptosDelGrupo.map((concepto) => {
                    const esActivo = conceptosActivosIds.includes(concepto.id);
                    return (
                      <div
                        key={concepto.id}
                        onClick={() => toggleConcepto(concepto.id)}
                        className={`p-3 rounded-2xl border flex items-center justify-between transition-all duration-150 cursor-pointer active:scale-98 select-none ${
                          esActivo
                            ? 'bg-emerald-950/90 text-white border-emerald-600 shadow-sm ring-1 ring-emerald-500/30'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 truncate">
                          <span className="text-base flex-shrink-0">{concepto.icono}</span>
                          <span className={`text-xs font-bold truncate ${esActivo ? 'text-white' : 'text-slate-800'}`}>
                            {concepto.nombre}
                          </span>
                        </div>

                        <div className="flex-shrink-0 ml-2">
                          {esActivo ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <XCircle className="w-5 h-5 text-slate-300" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

              </section>
            );
          })}
        </div>

        {/* Footer con Botón Guardar Sincronizado */}
        <footer className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-2 text-xs text-slate-300">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Los cambios afectan inmediatamente los formularios de caja.</span>
          </div>

          <button
            type="button"
            onClick={handleGuardarEnSupabase}
            disabled={guardando}
            className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-extrabold text-xs px-5 py-3 rounded-xl shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center space-x-2 cursor-pointer min-h-[42px]"
          >
            {guardando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Sincronizando con Supabase...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>Guardar Selección de Rubros</span>
              </>
            )}
          </button>
        </footer>

      </div>
    </div>
  );
};
