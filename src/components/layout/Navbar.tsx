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

  const handleCerrarSesion = async () => {
    await cerrarSesion();
    navigate('/login', { replace: true });
  };

  return (
    <header className="bg-slate-950 text-white border-b border-emerald-900/40 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Izquierda: Botón Menú Móvil + Logo */}
        <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
          <button
            onClick={onToggleMobileMenu}
            aria-label={isMobileMenuOpen ? "Cerrar menú de navegación" : "Abrir menú de navegación"}
            className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5 text-emerald-400" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-br from-brand-primary to-brand-dark p-1.5 sm:p-2 rounded-xl text-white shadow-sm border border-brand-accent/30 flex-shrink-0">
              <Tractor className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm sm:text-lg leading-tight tracking-wider bg-gradient-to-r from-white via-slate-100 to-brand-accent bg-clip-text text-transparent">
                AGRO<span className="text-brand-accent">UY</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-medium hidden md:block">Gestión Rural Uruguay</p>
            </div>
          </div>
        </div>

        {/* Derecha: Selectores y Botón Salir */}
        {usuario && (
          <nav aria-label="Controles de Sesión y Estancia" className="flex items-center space-x-1.5 sm:space-x-3 flex-shrink-0">
            
            {/* Selector de Estancias (Compacto en Móvil) */}
            <div className="max-w-[110px] xs:max-w-[140px] sm:max-w-none">
              <EstanciaSelector />
            </div>

            {/* Selector de Roles (En escritorio; en móvil se ubica en el menú lateral) */}
            <div className="hidden sm:block">
              <RoleSelector />
            </div>

            {/* Avatar Usuario en escritorio */}
            <div className="hidden md:flex items-center space-x-2 bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-800">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-emerald-800 to-emerald-600 flex items-center justify-center text-[10px] font-bold text-white shadow-sm border border-emerald-400/20">
                <User className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-slate-200">{usuario.nombre}</span>
            </div>

            {/* Botón de Acción de Salir / Cerrar Sesión */}
            <button
              onClick={handleCerrarSesion}
              title="Cerrar Sesión"
              aria-label="Cerrar Sesión"
              className="bg-gradient-to-r from-rose-950 to-slate-900 hover:from-rose-900 hover:to-rose-950 text-rose-300 hover:text-white font-extrabold text-xs p-2 sm:px-3 sm:py-2 rounded-xl border border-rose-800/80 shadow-md flex items-center space-x-1.5 transition-all duration-200 min-h-[38px] sm:min-h-[40px] cursor-pointer hover:border-rose-600 active:scale-95 flex-shrink-0"
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
