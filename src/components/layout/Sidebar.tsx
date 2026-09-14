import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import { useEstanciasStore } from '../../stores/useEstanciasStore';
import type { UserRole } from '../../types';
import { 
  LayoutDashboard, 
  Beef, 
  DollarSign, 
  BarChart3,
  Users, 
  Database, 
  MapPin, 
  X, 
  Building2, 
  Shield, 
  LogOut, 
  User,
  UserCheck,
  Tractor,
  HardHat,
  Check
} from 'lucide-react';

interface SidebarProps {
  isMobileMenuOpen: boolean;
  onCloseMobileMenu: () => void;
}

const rolesDisponibles: { rol: UserRole; label: string; icono: React.ElementType }[] = [
  { rol: 'ADMIN', label: 'Admin / Owner', icono: UserCheck },
  { rol: 'CAPATAZ', label: 'Capataz', icono: Tractor },
  { rol: 'CONTADOR', label: 'Contador', icono: DollarSign },
  { rol: 'OPERARIO', label: 'Operario', icono: HardHat },
];

export const Sidebar: React.FC<SidebarProps> = ({
  isMobileMenuOpen,
  onCloseMobileMenu,
}) => {
  const { usuario, cambiarRolSimulado, cerrarSesion } = useAuthStore();
  const { estancias, obtenerEstanciaActual } = useEstanciasStore();
  const navigate = useNavigate();

  const currentRole = usuario?.rol || 'OPERARIO';
  const canViewFinances = currentRole === 'ADMIN' || currentRole === 'CONTADOR';
  const estanciaActual = obtenerEstanciaActual();

  const handleCerrarSesion = () => {
    cerrarSesion();
    onCloseMobileMenu();
    navigate('/login');
  };

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard General', icon: LayoutDashboard, allowed: true },
    { path: '/estancias', label: 'Establecimientos y Campos', icon: Building2, allowed: true },
    { path: '/ganado', label: 'Ganado y Stock', icon: Beef, allowed: true },
    { path: '/finanzas', label: 'Ingresos / Egresos', icon: DollarSign, allowed: canViewFinances },
    { path: '/estadisticas', label: 'Estadísticas & Análisis', icon: BarChart3, allowed: canViewFinances },
    { path: '/usuarios', label: 'Roles y Permisos', icon: Users, allowed: currentRole === 'ADMIN' },
    { path: '/sql', label: 'Estado SQL (Supabase)', icon: Database, allowed: true },
  ];

  const navContent = (
    <div className="h-full flex flex-col justify-between p-4 overflow-y-auto custom-scrollbar">
      <nav aria-label="Menú principal de gestión rural" className="space-y-3">
        
        {/* Cabecera Móvil */}
        <div className="flex items-center justify-between lg:hidden pb-2 border-b border-slate-800">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Menú del Campo</span>
          <button 
            onClick={onCloseMobileMenu}
            className="p-1 text-slate-400 hover:text-white min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selector de Rol Inline en Móvil (100% Limpio y sin popover desbordado) */}
        <div className="lg:hidden bg-slate-950/90 p-3 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Simular Rol:</span>
            </span>
            <span className="text-[10px] font-black text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800/80">
              {usuario?.rol}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {rolesDisponibles.map((r) => {
              const Icono = r.icono;
              const esActivo = usuario?.rol === r.rol;
              return (
                <button
                  key={r.rol}
                  type="button"
                  onClick={() => cambiarRolSimulado(r.rol)}
                  className={`p-2 rounded-xl text-[11px] font-bold flex items-center justify-between border transition-all cursor-pointer ${
                    esActivo
                      ? 'bg-gradient-to-r from-emerald-950 to-slate-900 border-emerald-500 text-white shadow-sm ring-1 ring-emerald-400/40'
                      : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-1.5 truncate">
                    <Icono className={`w-3.5 h-3.5 flex-shrink-0 ${esActivo ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span className="truncate">{r.label}</span>
                  </div>
                  {esActivo && <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        <header className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800/50 pb-2 mb-3 hidden lg:block">
          Navegación de Campo
        </header>

        {/* Lista de Navegación */}
        <ul className="space-y-1.5">
          {menuItems.filter(i => i.allowed).map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={onCloseMobileMenu}
                  className={({ isActive }) =>
                    `w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl text-sm lg:text-xs font-bold transition-all min-h-[44px] ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-md shadow-emerald-950/40 border border-emerald-500/30'
                        : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={`w-5 h-5 lg:w-4 lg:h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Info del Establecimiento Seleccionado + Botón Salir */}
      <div className="space-y-3 mt-4">
        <section aria-label="Información del Establecimiento Activo" className="p-3.5 bg-slate-950 rounded-xl border border-emerald-900/40 shadow-inner text-xs text-slate-400 space-y-1">
          <div className="flex items-center space-x-1.5 text-emerald-400 font-bold text-xs">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">
              {estanciaActual ? estanciaActual.nombre : 'Consolidado Empresa'}
            </span>
          </div>
          <p className="text-[11px] text-slate-300 font-medium pl-5.5">
            {estanciaActual 
              ? `${estanciaActual.hectareas_totales} Ha • ${estanciaActual.departamento}` 
              : `${estancias.reduce((a, b) => a + b.hectareas_totales, 0)} Ha • ${estancias.length} Establecimientos`}
          </p>
          <p className="text-[10px] text-slate-500 pl-5.5">
            {estanciaActual ? `DICOSE: ${estanciaActual.dicose}` : 'Vista consolidada'}
          </p>
        </section>

        {/* Botón de Cerrar Sesión Prominente en Móvil */}
        <div className="pt-2 border-t border-slate-800/80 lg:hidden space-y-2">
          <div className="flex items-center space-x-2 px-1 text-slate-300 text-xs font-bold">
            <User className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span className="truncate">{usuario?.nombre} ({usuario?.rol})</span>
          </div>
          <button
            onClick={handleCerrarSesion}
            className="w-full bg-gradient-to-r from-rose-950 to-slate-950 hover:from-rose-900 hover:to-rose-950 text-rose-300 hover:text-white font-extrabold text-xs py-3 px-4 rounded-xl border border-rose-800/80 shadow-md flex items-center justify-center space-x-2 transition-all min-h-[44px] cursor-pointer active:scale-95"
          >
            <LogOut className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-slate-900/95 text-slate-200 border-r border-slate-800 min-h-[calc(100vh-4rem)] flex-shrink-0">
        {navContent}
      </aside>

      {/* 2. Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobileMenu}
          />
          <aside className="relative flex-1 max-w-xs w-full bg-slate-900 text-slate-200 shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200 border-r border-slate-800">
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
};
