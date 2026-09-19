import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { supabase } from '../services/supabase';
import { Tractor, Lock, Mail, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [cargando, setCargando] = useState(false);

  // Estados para cuando el usuario ingresa desde el link del correo
  const [esRecuperacion, setEsRecuperacion] = useState(() => {
    if (typeof window === 'undefined') return false;
    const hash = window.location.hash;
    const search = window.location.search;
    return hash.includes('type=recovery') || search.includes('type=recovery') || hash.includes('access_token');
  });
  const [nuevaContrasenia, setNuevaContrasenia] = useState('');
  const [confirmarContrasenia, setConfirmarContrasenia] = useState('');
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  const { iniciarSesion, errorAutenticacion, estaAutenticado } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/dashboard';

  useEffect(() => {
    // Escuchar evento directo PASSWORD_RECOVERY de Supabase Auth
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setEsRecuperacion(true);
      }
    });

    const hash = window.location.hash;
    const search = window.location.search;
    if (hash.includes('type=recovery') || search.includes('type=recovery') || hash.includes('access_token')) {
      setEsRecuperacion(true);
    }

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [location]);

  useEffect(() => {
    if (estaAutenticado && !esRecuperacion) {
      navigate(from, { replace: true });
    }
  }, [estaAutenticado, navigate, from, esRecuperacion]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    const exito = await iniciarSesion(email, password);
    setCargando(false);
    if (exito) {
      navigate(from, { replace: true });
    }
  };

  const handleEstablecerContrasenia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nuevaContrasenia.length < 6) {
      return;
    }
    if (nuevaContrasenia !== confirmarContrasenia) {
      return;
    }

    setCargando(true);
    const { error } = await supabase.auth.updateUser({ password: nuevaContrasenia });
    setCargando(false);

    if (!error) {
      setMensajeExito('¡Contraseña configurada con éxito! Redirigiendo...');
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 1200);
    }
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

        {/* Formulario de Login / Establecer Contraseña */}
        <section aria-label="Formulario de Acceso" className="bg-slate-900/90 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-5">
          
          {mensajeExito && (
            <div className="bg-emerald-950/80 border border-emerald-800 text-emerald-300 p-3.5 rounded-xl text-xs flex items-center space-x-2.5">
              <ArrowRight className="w-5 h-5 flex-shrink-0 text-emerald-400" />
              <span>{mensajeExito}</span>
            </div>
          )}

          {errorAutenticacion && !esRecuperacion && (
            <div className="bg-rose-950/80 border border-rose-800 text-rose-300 p-3.5 rounded-xl text-xs flex items-center space-x-2.5">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
              <span>{errorAutenticacion}</span>
            </div>
          )}

          {esRecuperacion ? (
            <form onSubmit={handleEstablecerContrasenia} className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-emerald-400">Establece tu Contraseña</h3>
                <p className="text-xs text-slate-400">
                  Crea tu contraseña de acceso para activar tu cuenta de Propietario en AgroUY.
                </p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="nuevaPass" className="block text-xs font-bold text-slate-300">
                  Nueva Contraseña *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="nuevaPass"
                    type={mostrarPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={nuevaContrasenia}
                    onChange={(e) => setNuevaContrasenia(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full bg-slate-50 text-slate-900 font-bold placeholder-slate-400 text-xs rounded-xl pl-10 pr-10 py-3 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all min-h-[44px]"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPassword(!mostrarPassword)}
                    tabIndex={-1}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 p-1 rounded-lg transition-colors cursor-pointer"
                  >
                    {mostrarPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="confirmarPass" className="block text-xs font-bold text-slate-300">
                  Confirmar Contraseña *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="confirmarPass"
                    type={mostrarPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmarContrasenia}
                    onChange={(e) => setConfirmarContrasenia(e.target.value)}
                    placeholder="Repite tu contraseña"
                    className="w-full bg-slate-50 text-slate-900 font-bold placeholder-slate-400 text-xs rounded-xl pl-10 pr-4 py-3 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all min-h-[44px]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={cargando}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-98 transition-all duration-200 flex items-center justify-center space-x-2 min-h-[46px] cursor-pointer disabled:opacity-50"
              >
                <span>{cargando ? 'Guardando...' : 'Guardar Contraseña e Ingresar'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Campo Correo Electrónico */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-xs font-bold text-slate-300">
                  Correo Electrónico o Usuario *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="email"
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@empresa.com"
                    className="w-full bg-slate-50 text-slate-900 font-bold placeholder-slate-400 text-xs rounded-xl pl-10 pr-4 py-3 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all min-h-[44px]"
                  />
                </div>
              </div>

              {/* Campo Contraseña con Botón de Mostrar/Ocultar */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-xs font-bold text-slate-300">
                  Contraseña *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="password"
                    type={mostrarPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 text-slate-900 font-bold placeholder-slate-400 text-xs rounded-xl pl-10 pr-10 py-3 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all min-h-[44px]"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPassword(!mostrarPassword)}
                    tabIndex={-1}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 p-1 rounded-lg transition-colors cursor-pointer"
                    title={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {mostrarPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
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
          )}
        </section>

        {/* Enlace hacia Solicitud de Registro de Empresa */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => navigate('/registro')}
            className="inline-flex items-center space-x-1.5 text-xs font-extrabold text-emerald-400 hover:text-emerald-300 bg-slate-900 hover:bg-slate-800/90 border border-emerald-500/30 hover:border-emerald-500/60 px-4 py-2.5 rounded-xl shadow-md transition-all duration-200 cursor-pointer group active:scale-98"
          >
            <span>¿Tu empresa aún no está en AgroUY?</span>
            <strong className="underline text-white group-hover:text-emerald-300 font-black">Solicita el alta aquí ➔</strong>
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
