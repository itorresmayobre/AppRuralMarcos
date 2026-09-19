import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { ToastNotification } from './components/ui/ToastNotification';
import { ProtectedRoute } from './components/routes/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { EstanciasPage } from './pages/EstanciasPage';
import { UsuariosPage } from './pages/UsuariosPage';
import { DashboardView } from './components/dashboard/DashboardView';
import { HaciendaView } from './components/hacienda/HaciendaView';
import { FinanzasView } from './components/finanzas/FinanzasView';
import { EstadisticasView } from './components/estadisticas/EstadisticasView';
import { RegistroEmpresaView } from './components/registro/RegistroEmpresaView';
import { DevConsoleView } from './components/dev/DevConsoleView';
import { ParametrosPage } from './pages/ParametrosPage';
import { HistoricoPage } from './pages/HistoricoPage';

import { useEstanciasStore } from './stores/useEstanciasStore';
import { useEmpresasStore } from './stores/useEmpresasStore';
import { validarSesionActivaSupabase } from './stores/useAuthStore';

function MainLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // 1. Validar si el token venció para purgar localStorage automáticamente
    validarSesionActivaSupabase();

    // 2. Carga inicial ligera: sólo empresas y estancias necesarias para la barra de navegación
    useEmpresasStore.getState().cargarEmpresasDesdeSupabase();
    useEstanciasStore.getState().cargarEstanciasDesdeSupabase();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-200 w-full overflow-x-hidden">
      <Navbar 
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      <div className="flex flex-1">
        <Sidebar 
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
        />

        <main className="flex-1 p-3 sm:p-6 max-w-7xl mx-auto w-full overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      {/* Sistema Global de Notificaciones Flotantes (Toasts) */}
      <ToastNotification />
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegistroEmpresaView />} />

        <Route element={<MainLayout />}>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardView />
              </ProtectedRoute>
            }
          />

          <Route
            path="/estancias"
            element={
              <ProtectedRoute>
                <EstanciasPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/ganado"
            element={
              <ProtectedRoute>
                <HaciendaView />
              </ProtectedRoute>
            }
          />

          <Route path="/hacienda" element={<Navigate to="/ganado" replace />} />

          <Route
            path="/finanzas"
            element={
              <ProtectedRoute rolesPermitidos={['ADMIN', 'CONTADOR', 'PROPIETARIO', 'SUPERADMIN']}>
                <FinanzasView />
              </ProtectedRoute>
            }
          />

          <Route
            path="/estadisticas"
            element={
              <ProtectedRoute rolesPermitidos={['ADMIN', 'CONTADOR', 'PROPIETARIO', 'SUPERADMIN']}>
                <EstadisticasView />
              </ProtectedRoute>
            }
          />

          <Route
            path="/historico"
            element={
              <ProtectedRoute rolesPermitidos={['ADMIN', 'CONTADOR', 'PROPIETARIO', 'SUPERADMIN']}>
                <HistoricoPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dev"
            element={
              <ProtectedRoute rolesPermitidos={['SUPERADMIN']}>
                <DevConsoleView />
              </ProtectedRoute>
            }
          />

          <Route
            path="/usuarios"
            element={
              <ProtectedRoute rolesPermitidos={['ADMIN', 'PROPIETARIO', 'SUPERADMIN']}>
                <UsuariosPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/parametros"
            element={
              <ProtectedRoute rolesPermitidos={['ADMIN', 'PROPIETARIO', 'SUPERADMIN']}>
                <ParametrosPage />
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
