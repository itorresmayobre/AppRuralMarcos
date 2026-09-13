import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { UserRole } from '../../types';
import { useAuthStore } from '../../stores/useAuthStore';
import { ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  rolesPermitidos?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, rolesPermitidos }) => {
  const { estaAutenticado, usuario } = useAuthStore();
  const location = useLocation();

  if (!estaAutenticado || !usuario) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (rolesPermitidos && !rolesPermitidos.includes(usuario.rol)) {
    return (
      <main className="p-6 max-w-xl mx-auto mt-12">
        <section aria-label="Acceso no autorizado" className="bg-amber-50 border border-amber-200/90 rounded-2xl p-8 text-center shadow-sm space-y-4">
          <ShieldAlert className="w-12 h-12 text-amber-600 mx-auto" />
          <h2 className="text-xl font-extrabold text-amber-950">Acceso No Autorizado</h2>
          <p className="text-xs text-amber-800 leading-relaxed">
            Tu rol activo (<strong>{usuario.rol}</strong>) no posee los permisos necesarios para acceder a esta ruta.
          </p>
          <a
            href="/dashboard"
            className="inline-block bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-sm"
          >
            Volver al Dashboard General
          </a>
        </section>
      </main>
    );
  }

  return <>{children}</>;
};
