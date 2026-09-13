import React, { useState, useRef, useEffect } from 'react';
import { useEstanciasStore } from '../../stores/useEstanciasStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { MapPin, ChevronDown, Check, Building2, Sparkles } from 'lucide-react';

export const EstanciaSelector: React.FC = () => {
  const { estancias, estanciaSeleccionadaId, seleccionarEstancia, obtenerEstanciaActual } = useEstanciasStore();
  const { usuario } = useAuthStore();
  
  const [estaAbierto, setEstaAbierto] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const estanciaActual = obtenerEstanciaActual();

  // Filtrar estancias permitidas para el usuario autenticado
  const tieneAccesoTodas = usuario?.estancias_asignadas_ids?.includes('TODAS') || usuario?.rol === 'ADMIN';
  const estanciasPermitidas = tieneAccesoTodas
    ? estancias
    : estancias.filter(e => usuario?.estancias_asignadas_ids?.includes(e.id));

  // Cerrar el dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setEstaAbierto(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSeleccionar = (id: string) => {
    seleccionarEstancia(id);
    setEstaAbierto(false);
  };

  const totalHectareasEmpresa = estanciasPermitidas.reduce((a, b) => a + b.hectareas_totales, 0);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      
      {/* Botón Disparador Principal */}
      <button
        type="button"
        onClick={() => setEstaAbierto(!estaAbierto)}
        aria-haspopup="true"
        aria-expanded={estaAbierto}
        className="bg-slate-900 hover:bg-slate-850 text-white font-extrabold text-xs rounded-xl px-2 sm:px-3 py-1.5 sm:py-2 border border-slate-700/80 hover:border-emerald-500/80 shadow-md flex items-center justify-between space-x-1.5 sm:space-x-2.5 transition-all duration-200 min-h-[38px] sm:min-h-[40px] cursor-pointer active:scale-98 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
      >
        <div className="flex items-center space-x-1.5 sm:space-x-2 truncate">
          <div className="p-1 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800/80 flex-shrink-0">
            {estanciaActual ? <MapPin className="w-3.5 h-3.5" /> : <Building2 className="w-3.5 h-3.5" />}
          </div>
          <div className="text-left truncate max-w-[85px] xs:max-w-[120px] sm:max-w-[180px]">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none">Estancia</p>
            <p className="text-[11px] font-black text-white truncate leading-tight mt-0.5">
              {estanciaActual ? estanciaActual.nombre : 'Consolidado Empresa'}
            </p>
          </div>
        </div>

        <div className="pl-1 border-l border-slate-800 flex items-center">
          <ChevronDown className={`w-4 h-4 text-emerald-400 flex-shrink-0 transition-transform duration-200 ${estaAbierto ? 'rotate-180 text-white' : ''}`} />
        </div>
      </button>

      {/* Popover Desplegable Estilizado */}
      {estaAbierto && (
        <div className="absolute right-0 mt-2 w-[calc(100vw-3rem)] max-w-[290px] sm:w-80 rounded-2xl bg-slate-900/98 backdrop-blur-xl border border-emerald-800/60 shadow-2xl z-50 p-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
          
          <header className="px-3 py-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-800/80 mb-1">
            <span>Estancias Asignadas</span>
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          </header>

          {/* Opción Consolidado (Si tiene acceso a todas o es admin) */}
          {tieneAccesoTodas && (
            <button
              type="button"
              onClick={() => handleSeleccionar('TODAS')}
              className={`w-full text-left p-2.5 rounded-xl text-xs transition-all duration-150 flex items-center justify-between border cursor-pointer ${
                estanciaSeleccionadaId === 'TODAS'
                  ? 'bg-gradient-to-r from-emerald-950 to-slate-900 border-emerald-500/80 text-white shadow-md'
                  : 'hover:bg-slate-800/70 border-transparent text-slate-300'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <div className={`p-2 rounded-lg ${estanciaSeleccionadaId === 'TODAS' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-extrabold text-white">Consolidado Empresa (Todas)</p>
                  <p className="text-[10px] text-slate-400">{totalHectareasEmpresa.toLocaleString()} Hectáreas totales • {estanciasPermitidas.length} Predios</p>
                </div>
              </div>

              {estanciaSeleccionadaId === 'TODAS' && (
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              )}
            </button>
          )}

          {tieneAccesoTodas && <div className="h-px bg-slate-800/80 my-1" />}

          {/* Lista de Estancias Permitidas */}
          <div className="space-y-1 max-h-60 overflow-y-auto custom-scrollbar">
            {estanciasPermitidas.map((estancia) => {
              const esActiva = estanciaSeleccionadaId === estancia.id;
              return (
                <button
                  key={estancia.id}
                  type="button"
                  onClick={() => handleSeleccionar(estancia.id)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs transition-all duration-150 flex items-center justify-between border cursor-pointer ${
                    esActiva
                      ? 'bg-emerald-950/80 border-emerald-500/80 text-white shadow-sm'
                      : 'hover:bg-slate-800/60 border-transparent text-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <div className={`p-1.5 rounded-lg flex-shrink-0 ${esActiva ? 'bg-emerald-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-slate-100 truncate">{estancia.nombre}</p>
                      <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-mono mt-0.5">
                        <span>{estancia.departamento}</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-bold">DICOSE {estancia.dicose}</span>
                        <span>•</span>
                        <span>{estancia.hectareas_totales} Ha</span>
                      </div>
                    </div>
                  </div>

                  {esActiva && (
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
