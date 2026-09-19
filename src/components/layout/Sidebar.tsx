import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import { useEstanciasStore } from '../../stores/useEstanciasStore';
import { PerfilModal } from '../modals/PerfilModal';
import {
  LayoutDashboard,
  Building2,
  Beef,
  DollarSign,
  BarChart3,
  Users,
  Code,
  MapPin,
  X,
  User,
  LogOut,
  History,
  Shield,
  Scale,
  Settings
} from 'lucide-react';
import type { UserRole } from '../../types';

interface SidebarProps {
  isMobileMenuOpen: boolean;
  onCloseMobileMenu: () => void;
}

const rolesDisponibles: { value: UserRole; label: string }[] = [
  { value: 'SUPERADMIN', label: 'SuperAdmin' },
  { value: 'ADMIN', label: 'Admin Empresa' },
  { value: 'PROPIETARIO', label: 'Propietario' },
  { value: 'CONTADOR', label: 'Contador' },
  { value: 'OPERARIO', label: 'Operario' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  isMobileMenuOpen,
  onCloseMobileMenu,
}) => {
  const { usuario, cambiarRolSimulado, cerrarSesion } = useAuthStore();
  const { estancias, obtenerEstanciaActual } = useEstanciasStore();
  const navigate = useNavigate();
  const [modalPerfilAbierto, setModalPerfilAbierto] = useState(false);

  const currentRole = usuario?.rol || 'OPERARIO';
  const isOwnerOrAdmin = currentRole === 'ADMIN' || currentRole === 'PROPIETARIO' || currentRole === 'SUPERADMIN';
  const canViewFinances = isOwnerOrAdmin || currentRole === 'CONTADOR';
  const estanciaActual = obtenerEstanciaActual();

  const handleCerrarSesion = async () => {
    await cerrarSesion();
    onCloseMobileMenu();
    navigate('/login', { replace: true });
  };

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard General', icon: LayoutDashboard, allowed: true },
    { path: '/estancias', label: 'Establecimientos y Campos', icon: Building2, allowed: true },
    { path: '/ganado', label: 'Ganado y Stock', icon: Beef, allowed: true },
    { path: '/finanzas', label: 'Ingresos / Egresos', icon: DollarSign, allowed: canViewFinances },
    { path: '/estadisticas', label: 'Estadísticas & Análisis', icon: BarChart3, allowed: canViewFinances },
    { path: '/historico', label: 'Histórico Completo', icon: History, allowed: canViewFinances },
    { path: '/parametros', label: 'Parámetros Ganaderos (INIA)', icon: Scale, allowed: isOwnerOrAdmin },
    { path: '/dev', label: 'Consola Desarrollador', icon: Code, allowed: currentRole === 'SUPERADMIN' },
    { path: '/usuarios', label: 'Roles y Permisos', icon: Users, allowed: currentRole === 'SUPERADMIN' },
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

        {/* Selector de Rol Inline en Móvil (Exclusivo SuperAdmin) */}
        {usuario?.rol === 'SUPERADMIN' && (
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
                const esActivo = currentRole === r.value;
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => cambiarRolSimulado(r.value)}
                    className={`text-[11px] font-bold px-2 py-1.5 rounded-xl border transition-all text-left truncate cursor-pointer ${
                      esActivo
                        ? 'bg-emerald-900 text-white border-emerald-500/80 shadow-sm'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <header className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800/50 pb-2 mb-3 hidden lg:block">
          Navegación de Campo
        </header>

        {/* Enlaces del Menú Principal */}
        <div className="space-y-1">
          {menuItems
            .filter((item) => item.allowed)
            .map((item) => {
              const IconComponent = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onCloseMobileMenu}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3.5 py-2.5 rounded-2xl transition-all duration-150 min-h-[44px] cursor-pointer text-xs font-bold ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-md shadow-emerald-950/40 font-extrabold'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
                    }`
                  }
                >
                  <IconComponent className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
        </div>
      </nav>

      {/* Pie del Menú con Tarjeta de Campo y Usuario */}
      <div className="pt-4 border-t border-slate-800 space-y-3">
        {/* Información de Establecimiento Seleccionado */}
        <section aria-label="Información del Establecimiento" className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/90 space-y-1">
          <div className="flex items-center space-x-2 text-emerald-400 font-extrabold text-xs">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">
              {estanciaActual ? estanciaActual.nombre : 'Todos los Campos'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 pl-5.5 font-medium">
            {estanciaActual 
              ? `${estanciaActual.hectareas_totales} Ha • ${estanciaActual.departamento}` 
              : `${estancias.reduce((a, b) => a + b.hectareas_totales, 0)} Ha • ${estancias.length} Establecimientos`}
          </p>
          <p className="text-[10px] text-slate-500 pl-5.5">
            {estanciaActual ? `DICOSE: ${estanciaActual.dicose}` : 'Vista consolidada'}
          </p>
        </section>

        {/* Botón Mi Perfil / Contraseña */}
        <button
          onClick={() => {
            setModalPerfilAbierto(true);
            onCloseMobileMenu();
          }}
          className="w-full bg-slate-950 hover:bg-slate-850 text-slate-200 font-bold text-xs py-2.5 px-3 rounded-xl border border-slate-800 hover:border-emerald-500/50 shadow-sm flex items-center justify-between transition-all min-h-[40px] cursor-pointer"
        >
          <div className="flex items-center gap-2 truncate">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-emerald-800 to-emerald-600 flex items-center justify-center text-[10px] font-bold text-white shadow-sm border border-emerald-400/20 shrink-0">
              <User className="w-3.5 h-3.5" />
            </div>
            <div className="text-left truncate leading-tight">
              <p className="text-xs font-bold text-slate-200 truncate">{usuario?.nombre} {usuario?.apellido || ''}</p>
              <p className="text-[9px] text-emerald-400 font-extrabold uppercase tracking-wider">{usuario?.rol}</p>
            </div>
          </div>
          <Settings className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        </button>

        {/* Botón de Cerrar Sesión Prominente en Móvil */}
        <div className="pt-1 lg:hidden">
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

      {/* Modal de Perfil y Contraseña */}
      <PerfilModal
        isOpen={modalPerfilAbierto}
        onClose={() => setModalPerfilAbierto(false)}
      />
    </>
  );
};
