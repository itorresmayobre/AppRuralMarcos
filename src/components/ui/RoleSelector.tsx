import React, { useState, useRef, useEffect } from 'react';
import type { UserRole } from '../../types';
import { useAuthStore } from '../../stores/useAuthStore';
import { Shield, ChevronDown, Check, UserCheck, DollarSign, Tractor, HardHat } from 'lucide-react';

const rolesDetalle: {
  rol: UserRole;
  titulo: string;
  descripcion: string;
  icono: React.ElementType;
  colorBadge: string;
  colorBorder: string;
}[] = [
  {
    rol: 'ADMIN',
    titulo: 'Propietario / Admin',
    descripcion: 'Control total de finanzas USD/UYU, hacienda y usuarios',
    icono: UserCheck,
    colorBadge: 'bg-emerald-950 text-emerald-300 border-emerald-700/60',
    colorBorder: 'border-emerald-500/80 bg-emerald-950/60',
  },
  {
    rol: 'CAPATAZ',
    titulo: 'Capataz de Campo',
    descripcion: 'Registro de existencias, tropas e insumos (sin valores $)',
    icono: Tractor,
    colorBadge: 'bg-amber-950 text-amber-300 border-amber-700/60',
    colorBorder: 'border-amber-500/80 bg-amber-950/60',
  },
  {
    rol: 'CONTADOR',
    titulo: 'Contador / Asesor',
    descripcion: 'Acceso a liquidaciones de hacienda, balances y reportes',
    icono: DollarSign,
    colorBadge: 'bg-blue-950 text-blue-300 border-blue-700/60',
    colorBorder: 'border-blue-500/80 bg-blue-950/60',
  },
  {
    rol: 'OPERARIO',
    titulo: 'Operario de Campo',
    descripcion: 'Visualización de tareas asignadas y lecturas básicas',
    icono: HardHat,
    colorBadge: 'bg-slate-800 text-slate-300 border-slate-700',
    colorBorder: 'border-slate-600 bg-slate-850',
  },
];

export const RoleSelector: React.FC = () => {
  const { usuario, cambiarRolSimulado } = useAuthStore();
  const [estaAbierto, setEstaAbierto] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const rolActivo = usuario?.rol || 'OPERARIO';
  const detalleActivo = rolesDetalle.find((r) => r.rol === rolActivo) || rolesDetalle[0];

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

  const handleSeleccionarRol = (nuevoRol: UserRole) => {
    cambiarRolSimulado(nuevoRol);
    setEstaAbierto(false);
  };

  const IconoActivo = detalleActivo.icono;

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      
      {/* Botón Disparador con Apariencia de Botón Interactivo Elevado */}
      <button
        type="button"
        onClick={() => setEstaAbierto(!estaAbierto)}
        aria-haspopup="true"
        aria-expanded={estaAbierto}
        className="bg-slate-900 hover:bg-slate-850 text-white font-extrabold text-xs rounded-xl px-3 py-2 border border-slate-700/80 hover:border-emerald-500/80 shadow-md shadow-slate-950/50 flex items-center justify-between space-x-2.5 transition-all duration-200 min-h-[40px] cursor-pointer active:scale-98 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
      >
        <div className="flex items-center space-x-2">
          <div className={`p-1 rounded-lg border ${detalleActivo.colorBadge} flex-shrink-0`}>
            <IconoActivo className="w-3.5 h-3.5" />
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none">Rol Simulado</p>
            <p className="text-[11px] font-black text-white leading-tight mt-0.5">
              {detalleActivo.titulo}
            </p>
          </div>
        </div>

        <div className="pl-1 border-l border-slate-800 flex items-center">
          <ChevronDown className={`w-4 h-4 text-emerald-400 flex-shrink-0 transition-transform duration-200 ${estaAbierto ? 'rotate-180 text-white' : ''}`} />
        </div>
      </button>

      {/* Popover Desplegable Estilizado */}
      {estaAbierto && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-slate-900/98 backdrop-blur-xl border border-slate-800 shadow-2xl z-50 p-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
          
          <header className="px-3 py-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-800/80 mb-1">
            <span>Simular Permisos de Usuario</span>
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
          </header>

          <div className="space-y-1">
            {rolesDetalle.map((item) => {
              const Icono = item.icono;
              const esSeleccionado = rolActivo === item.rol;
              return (
                <button
                  key={item.rol}
                  type="button"
                  onClick={() => handleSeleccionarRol(item.rol)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs transition-all duration-150 flex items-center justify-between border cursor-pointer ${
                    esSeleccionado
                      ? `${item.colorBorder} text-white shadow-md`
                      : 'hover:bg-slate-800/60 border-transparent text-slate-300'
                  }`}
                >
                  <div className="flex items-start space-x-2.5">
                    <div className={`p-1.5 rounded-lg mt-0.5 flex-shrink-0 border ${item.colorBadge}`}>
                      <Icono className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="font-extrabold text-white">{item.titulo}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{item.descripcion}</p>
                    </div>
                  </div>

                  {esSeleccionado && (
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
