import React from 'react';
import { useEstanciasStore } from '../../stores/useEstanciasStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { Building2, MapPin, Check, Filter } from 'lucide-react';

export const FiltroEstablecimientosRapido: React.FC = () => {
  const { estancias, estanciaSeleccionadaId, seleccionarEstancia } = useEstanciasStore();
  const { usuario } = useAuthStore();

  const tieneAccesoTodas = usuario?.estancias_asignadas_ids?.includes('TODAS') || usuario?.rol === 'ADMIN' || usuario?.rol === 'PROPIETARIO' || usuario?.rol === 'SUPERADMIN';
  const estanciasPermitidas = tieneAccesoTodas
    ? estancias
    : estancias.filter(e => usuario?.estancias_asignadas_ids?.includes(e.id));

  const totalHectareasEmpresa = estanciasPermitidas.reduce((a, b) => a + b.hectareas_totales, 0);

  const handleSeleccionar = (id: string) => {
    if (id === estanciaSeleccionadaId) return;
    seleccionarEstancia(id);
  };

  return (
    <section aria-label="Filtro Rápido de Establecimientos" className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
      
      {/* Cabecera del Panel de Filtros */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl">
            <Filter className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Filtrar por Establecimiento / Campo</h3>
            <p className="text-[11px] text-slate-500">Acceso rápido para alternar datos entre predios y consolidado</p>
          </div>
        </div>

        <span className="hidden xs:inline-flex items-center text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200">
          {estanciasPermitidas.length} Predios Activos
        </span>
      </div>

      {/* Botonera Tactil de Filtro Rápido */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        
        {/* Opción 1: Consolidado Empresa (Todas) */}
        {tieneAccesoTodas && (
          <button
            type="button"
            onClick={() => handleSeleccionar('TODAS')}
            className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all duration-200 cursor-pointer active:scale-98 group ${
              estanciaSeleccionadaId === 'TODAS'
                ? 'bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 border-emerald-500 text-white shadow-md ring-2 ring-emerald-500/30'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200/90 text-slate-700 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center space-x-2.5 truncate">
              <div className={`p-2 rounded-xl flex-shrink-0 transition-transform group-hover:scale-105 ${
                estanciaSeleccionadaId === 'TODAS' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-200 text-slate-600'
              }`}>
                <Building2 className="w-4 h-4" />
              </div>
              <div className="truncate">
                <span className={`block font-black text-xs truncate ${estanciaSeleccionadaId === 'TODAS' ? 'text-white' : 'text-slate-900'}`}>
                  Consolidado Empresa
                </span>
                <span className={`text-[10px] font-medium block truncate ${estanciaSeleccionadaId === 'TODAS' ? 'text-emerald-300' : 'text-slate-500'}`}>
                  {totalHectareasEmpresa.toLocaleString()} Ha • Todos
                </span>
              </div>
            </div>

            {estanciaSeleccionadaId === 'TODAS' && (
              <div className="p-1 bg-emerald-500 text-white rounded-full flex-shrink-0 ml-1.5 shadow-sm">
                <Check className="w-3.5 h-3.5" />
              </div>
            )}
          </button>
        )}

        {/* Tarjetas de Cada Establecimiento */}
        {estanciasPermitidas.map((estancia) => {
          const esActivo = estanciaSeleccionadaId === estancia.id;
          return (
            <button
              key={estancia.id}
              type="button"
              onClick={() => handleSeleccionar(estancia.id)}
              className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all duration-200 cursor-pointer active:scale-98 group ${
                esActivo
                  ? 'bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 border-emerald-500 text-white shadow-md ring-2 ring-emerald-500/30'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200/90 text-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center space-x-2.5 truncate">
                <div className={`p-2 rounded-xl flex-shrink-0 transition-transform group-hover:scale-105 ${
                  esActivo ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-200 text-slate-600'
                }`}>
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <span className={`block font-black text-xs truncate ${esActivo ? 'text-white' : 'text-slate-900'}`}>
                    {estancia.nombre}
                  </span>
                  <span className={`text-[10px] font-medium block truncate ${esActivo ? 'text-emerald-300' : 'text-slate-500'}`}>
                    DICOSE {estancia.dicose} • {estancia.hectareas_totales} Ha
                  </span>
                </div>
              </div>

              {esActivo && (
                <div className="p-1 bg-emerald-500 text-white rounded-full flex-shrink-0 ml-1.5 shadow-sm">
                  <Check className="w-3.5 h-3.5" />
                </div>
              )}
            </button>
          );
        })}

      </div>

    </section>
  );
};
