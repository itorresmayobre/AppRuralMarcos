import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { Tractor, Lock, User, KeyRound, AlertCircle, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [credencial, setCredencial] = useState('marcos.propietario');
  const [password, setPassword] = useState('admin');
  const [cargando, setCargando] = useState(false);

  const { iniciarSesion, errorAutenticacion, estaAutenticado } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (estaAutenticado) {
      navigate(from, { replace: true });
    }
  }, [estaAutenticado, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    const exito = await iniciarSesion(credencial, password);
    setCargando(false);
    if (exito) {
      navigate(from, { replace: true });
    }
  };

  const handleUsarCredenciales = (demoCredencial: string, demoPass: string) => {
    setCredencial(demoCredencial);
    setPassword(demoPass);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950/40 via-slate-950 to-slate-950">
      
      <div className="w-full max-w-md space-y-6">
        
        {/* Header con Marca */}
        <header className="text-center space-y-2">
          <div className="inline-flex bg-gradient-to-br from-emerald-500 to-emerald-700 p-3.5 rounded-2xl text-white shadow-xl shadow-emerald-950/80 border border-emerald-400/30 mb-2">
            <Tractor className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-wider bg-gradient-to-r from-white via-slate-100 to-emerald-400 bg-clip-text text-transparent">
            AGRO<span className="text-emerald-400">UY</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Gestión Rural Uruguay • Iniciar Sesión en Establecimiento
          </p>
        </header>

        {/* Formulario de Login */}
        <section aria-label="Formulario de Acceso" className="bg-slate-900/90 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-5">
          
          {errorAutenticacion && (
            <div className="bg-rose-950/80 border border-rose-800 text-rose-300 p-3.5 rounded-xl text-xs flex items-center space-x-2.5">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
              <span>{errorAutenticacion}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Campo Usuario o Correo Electrónico */}
            <div className="space-y-1.5">
              <label htmlFor="credencial" className="block text-xs font-bold text-slate-300">
                Usuario (nombre.apellido) o Email
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="credencial"
                  type="text"
                  required
                  value={credencial}
                  onChange={(e) => setCredencial(e.target.value)}
                  placeholder="marcos.propietario o admin@admin.com"
                  className="w-full bg-slate-950 text-white placeholder-slate-600 text-xs rounded-xl pl-10 pr-4 py-3 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all min-h-[44px]"
                />
              </div>
            </div>

            {/* Campo Contraseña */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-xs font-bold text-slate-300">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 text-white placeholder-slate-600 text-xs rounded-xl pl-10 pr-4 py-3 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all min-h-[44px]"
                />
              </div>
            </div>

            {/* Botón Ingresar */}
            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-98 transition-all duration-200 flex items-center justify-center space-x-2 min-h-[46px] cursor-pointer disabled:opacity-50"
            >
              <span>{cargando ? 'Verificando...' : 'Ingresar al Establecimiento'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Ayudante de Credenciales Demo sin arroba */}
          <article className="pt-4 border-t border-slate-800 space-y-2 text-xs">
            <div className="flex items-center space-x-1.5 text-slate-400 font-semibold">
              <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
              <span>Acceso Rápido por Nombre de Usuario:</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => handleUsarCredenciales('marcos.propietario', 'admin')}
                className="bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/60 p-2.5 rounded-xl text-left transition-all cursor-pointer hover:shadow-sm"
              >
                <p className="font-bold flex items-center gap-1"><User className="w-3 h-3 text-emerald-400" /> marcos.propietario</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Clave: admin</p>
              </button>

              <button
                type="button"
                onClick={() => handleUsarCredenciales('juan.perez', 'capataz')}
                className="bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border border-amber-800/60 p-2.5 rounded-xl text-left transition-all cursor-pointer hover:shadow-sm"
              >
                <p className="font-bold flex items-center gap-1"><User className="w-3 h-3 text-amber-400" /> juan.perez</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Clave: capataz</p>
              </button>

              <button
                type="button"
                onClick={() => handleUsarCredenciales('carlos.silva', 'contador')}
                className="bg-blue-950/60 hover:bg-blue-900/60 text-blue-300 border border-blue-800/60 p-2.5 rounded-xl text-left transition-all cursor-pointer hover:shadow-sm"
              >
                <p className="font-bold flex items-center gap-1"><User className="w-3 h-3 text-blue-400" /> carlos.silva</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Clave: contador</p>
              </button>
            </div>
          </article>

        </section>

        {/* Enlace hacia Solicitud de Registro de Empresa */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => navigate('/registro')}
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
          >
            ¿Tu empresa aún no está en AppRural? <strong className="underline">Solicita el alta de tu empresa aquí ➔</strong>
          </button>
        </div>

        {/* Footer */}
        <footer className="text-center text-[11px] text-slate-600">
          AgroUY • Sistema de Gestión de Empresa Rural en Uruguay
        </footer>

      </div>
    </main>
  );
};
