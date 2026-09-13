import React from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { EstanciaSelector } from '../ui/EstanciaSelector';
import { RoleSelector } from '../ui/RoleSelector';
import { Tractor, User, Menu, X, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
  isMobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isMobileMenuOpen,
  onToggleMobileMenu,
}) => {
  const { usuario, cerrarSesion } = useAuthStore();
  const navigate = useNavigate();

  const handleCerrarSesion = () => {
    cerrarSesion();
    navigate('/login');
  };

  return (
    <header className="bg-slate-950 text-white border-b border-emerald-900/40 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Izquierda: Botón Menú Móvil + Logo */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleMobileMenu}
            aria-label={isMobileMenuOpen ? "Cerrar menú de navegación" : "Abrir menú de navegación"}
            className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6 text-emerald-400" /> : <Menu className="w-6 h-6" />}
          </button>

          <div className="flex items-center space-x-2.5">
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-2 rounded-xl text-white shadow-sm border border-emerald-400/30 flex-shrink-0">
              <Tractor className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-base sm:text-lg leading-tight tracking-wider bg-gradient-to-r from-white via-slate-100 to-emerald-400 bg-clip-text text-transparent">
                AGRO<span className="text-emerald-400">UY</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-medium hidden sm:block">Gestión Rural Uruguay</p>
            </div>
          </div>
        </div>

        {/* Centro/Derecha: Selectores y Botón Salir */}
        {usuario && (
          <nav aria-label="Controles de Sesión y Estancia" className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Custom Dropdown de Estancias */}
            <EstanciaSelector />

            {/* Custom Dropdown de Roles */}
            <RoleSelector />

            {/* Avatar Usuario */}
            <div className="hidden md:flex items-center space-x-2 bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-800">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-emerald-800 to-emerald-600 flex items-center justify-center text-[10px] font-bold text-white shadow-sm border border-emerald-400/20">
                <User className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-slate-200">{usuario.nombre}</span>
            </div>

            {/* Botón de Acción de Salir / Cerrar Sesión Claro y Visceral */}
            <button
              onClick={handleCerrarSesion}
              title="Cerrar Sesión"
              aria-label="Cerrar Sesión"
              className="bg-gradient-to-r from-rose-950 to-slate-900 hover:from-rose-900 hover:to-rose-950 text-rose-300 hover:text-white font-extrabold text-xs px-3 py-2 rounded-xl border border-rose-800/80 shadow-md flex items-center space-x-1.5 transition-all duration-200 min-h-[40px] cursor-pointer hover:border-rose-600 active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </nav>
        )}

      </div>
    </header>
  );
};
