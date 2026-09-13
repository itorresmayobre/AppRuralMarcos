import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import { useEstanciasStore } from '../../stores/useEstanciasStore';
import { LayoutDashboard, Beef, DollarSign, Users, Database, MapPin, X, Building2 } from 'lucide-react';

interface SidebarProps {
  isMobileMenuOpen: boolean;
  onCloseMobileMenu: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isMobileMenuOpen,
  onCloseMobileMenu,
}) => {
  const { usuario } = useAuthStore();
  const { estancias, obtenerEstanciaActual } = useEstanciasStore();
  const currentRole = usuario?.rol || 'OPERARIO';

  const canViewFinances = currentRole === 'ADMIN' || currentRole === 'CONTADOR';
  const estanciaActual = obtenerEstanciaActual();

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard General', icon: LayoutDashboard, allowed: true },
    { path: '/estancias', label: 'Estancias y Campos', icon: Building2, allowed: true },
    { path: '/ganado', label: 'Ganado y Stock', icon: Beef, allowed: true },
    { path: '/finanzas', label: 'Ingresos / Egresos', icon: DollarSign, allowed: canViewFinances },
    { path: '/usuarios', label: 'Roles y Permisos', icon: Users, allowed: currentRole === 'ADMIN' },
    { path: '/sql', label: 'Estado SQL (Supabase)', icon: Database, allowed: true },
  ];

  const navContent = (
    <div className="h-full flex flex-col justify-between p-4">
      <nav aria-label="Menú principal de gestión rural" className="space-y-2">
        <div className="flex items-center justify-between lg:hidden mb-2 pb-2 border-b border-slate-800">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Menú del Campo</span>
          <button 
            onClick={onCloseMobileMenu}
            className="p-1 text-slate-400 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <header className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800/50 pb-2 mb-3 hidden lg:block">
          Navegación de Campo
        </header>

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

      {/* Info de la Estancia Seleccionada / Consolidado */}
      <section aria-label="Información de la Estancia Activa" className="p-3.5 bg-slate-950 rounded-xl border border-emerald-900/40 shadow-inner text-xs text-slate-400 space-y-1 mt-6">
        <div className="flex items-center space-x-1.5 text-emerald-400 font-bold text-xs">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">
            {estanciaActual ? estanciaActual.nombre : 'Consolidado Empresa'}
          </span>
        </div>
        <p className="text-[11px] text-slate-300 font-medium pl-5.5">
          {estanciaActual 
            ? `${estanciaActual.hectareas_totales} Ha • ${estanciaActual.departamento}` 
            : `${estancias.reduce((a, b) => a + b.hectareas_totales, 0)} Ha • ${estancias.length} Estancias`}
        </p>
        <p className="text-[10px] text-slate-500 pl-5.5">
          {estanciaActual ? `DICOSE: ${estanciaActual.dicose}` : 'Vista consolidada'}
        </p>
      </section>
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
