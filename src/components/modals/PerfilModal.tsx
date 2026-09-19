import React, { useState } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useToastStore } from '../../stores/useToastStore';
import { supabase } from '../../services/supabase';
import {
  X,
  User,
  Lock,
  Mail,
  KeyRound,
  CheckCircle2,
  Eye,
  EyeOff
} from 'lucide-react';

interface PerfilModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PerfilModal: React.FC<PerfilModalProps> = ({ isOpen, onClose }) => {
  const { usuario, actualizarPerfilUsuario } = useAuthStore();
  const { mostrarToast } = useToastStore();

  const [nombre, setNombre] = useState(usuario?.nombre || '');
  const [apellido, setApellido] = useState(usuario?.apellido || '');
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);

  // Estados de cambio de contraseña
  const [nuevaContrasenia, setNuevaContrasenia] = useState('');
  const [confirmarContrasenia, setConfirmarContrasenia] = useState('');
  const [mostrarPass, setMostrarPass] = useState(false);
  const [guardandoPass, setGuardandoPass] = useState(false);
  const [errorPass, setErrorPass] = useState<string | null>(null);

  if (!isOpen || !usuario) return null;

  const handleGuardarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      mostrarToast('Error de Validación', 'El nombre no puede estar vacío.', 'ERROR');
      return;
    }

    setGuardandoPerfil(true);
    const ok = await actualizarPerfilUsuario({
      nombre: nombre.trim(),
      apellido: apellido.trim(),
    });
    setGuardandoPerfil(false);

    if (ok) {
      mostrarToast('Perfil Actualizado', 'Tus datos de usuario han sido guardados correctamente.', 'EXITO');
    } else {
      mostrarToast('Error', 'No se pudieron actualizar los datos del perfil.', 'ERROR');
    }
  };

  const handleCambiarContrasenia = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorPass(null);

    if (nuevaContrasenia.length < 6) {
      setErrorPass('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (nuevaContrasenia !== confirmarContrasenia) {
      setErrorPass('Las contraseñas no coinciden.');
      return;
    }

    setGuardandoPass(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: nuevaContrasenia });

      if (error) {
        setErrorPass(error.message || 'Error al actualizar la contraseña en el servidor.');
        mostrarToast('Error', error.message || 'No se pudo actualizar la contraseña.', 'ERROR');
      } else {
        mostrarToast(
          '¡Contraseña Configurada!',
          'Tu nueva contraseña ha sido guardada en Supabase Auth. Ya puedes iniciar sesión con ella.',
          'EXITO'
        );
        setNuevaContrasenia('');
        setConfirmarContrasenia('');
      }
    } catch (err: any) {
      setErrorPass('Ocurrió un error inesperado de conexión.');
    } finally {
      setGuardandoPass(false);
    }
  };

  return (
    <section
      aria-label="Modal Configurar Perfil y Contraseña"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn"
    >
      <article className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Cabecera Modal */}
        <header className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-2xl text-white shadow-md">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Mi Perfil y Seguridad</h3>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                Configuración de cuenta y clave de acceso
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Cierre Contenido con Scroll */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1 text-xs">
          
          {/* Tarjeta de Resumen del Usuario */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-sm font-black text-white shadow-sm border border-emerald-400/30">
                  {usuario.nombre ? usuario.nombre.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <h4 className="font-extrabold text-sm leading-tight">{usuario.nombre} {usuario.apellido || ''}</h4>
                  <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                    <Mail className="w-3 h-3 text-slate-500" />
                    <span>{usuario.email}</span>
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-emerald-950 text-emerald-400 rounded-full border border-emerald-800">
                {usuario.rol}
              </span>
            </div>
          </div>

          {/* Sección 1: Datos Personales */}
          <form onSubmit={handleGuardarPerfil} className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <h4 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
              <User className="w-4 h-4 text-emerald-600" />
              <span>Información Personal</span>
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="perfil-nombre-input" className="font-bold text-slate-700 block text-[11px]">Nombre</label>
                <input
                  id="perfil-nombre-input"
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-900 font-bold text-xs rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 min-h-[40px]"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="perfil-apellido-input" className="font-bold text-slate-700 block text-[11px]">Apellido</label>
                <input
                  id="perfil-apellido-input"
                  type="text"
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-900 font-bold text-xs rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 min-h-[40px]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={guardandoPerfil}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-2.5 rounded-xl shadow transition-all cursor-pointer disabled:opacity-50 min-h-[38px] flex items-center justify-center space-x-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{guardandoPerfil ? 'Guardando...' : 'Actualizar Nombre'}</span>
            </button>
          </form>

          {/* Sección 2: Configurar / Cambiar Contraseña */}
          <form onSubmit={handleCambiarContrasenia} className="space-y-3 bg-emerald-50/60 border border-emerald-200/80 p-4 rounded-2xl">
            <h4 className="font-extrabold text-emerald-950 text-xs flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-emerald-700" />
              <span>Configurar Contraseña de Acceso</span>
            </h4>
            <p className="text-[11px] text-emerald-900 font-medium">
              Ingresa tu nueva contraseña para iniciar sesión directamente con tu correo y esta clave en el futuro.
            </p>

            {errorPass && (
              <div className="p-2.5 bg-rose-100 border border-rose-300 text-rose-900 text-[11px] rounded-xl font-bold">
                ⚠️ {errorPass}
              </div>
            )}

            <div className="space-y-2">
              <div className="space-y-1">
                <label htmlFor="nueva-pass-input" className="font-bold text-emerald-950 block text-[11px]">Nueva Contraseña</label>
                <div className="relative">
                  <input
                    id="nueva-pass-input"
                    type={mostrarPass ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Mínimo 6 caracteres"
                    value={nuevaContrasenia}
                    onChange={(e) => setNuevaContrasenia(e.target.value)}
                    className="w-full bg-white border border-emerald-300 text-slate-900 font-bold text-xs rounded-xl pl-3 pr-10 py-2.5 focus:ring-2 focus:ring-emerald-500 min-h-[42px]"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPass(!mostrarPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                    aria-label="Ver u ocultar contraseña"
                  >
                    {mostrarPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="confirmar-pass-input" className="font-bold text-emerald-950 block text-[11px]">Confirmar Nueva Contraseña</label>
                <input
                  id="confirmar-pass-input"
                  type={mostrarPass ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="Repite la contraseña"
                  value={confirmarContrasenia}
                  onChange={(e) => setConfirmarContrasenia(e.target.value)}
                  className="w-full bg-white border border-emerald-300 text-slate-900 font-bold text-xs rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 min-h-[42px]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={guardandoPass}
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-50 text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition-all cursor-pointer min-h-[44px] flex items-center justify-center space-x-2"
            >
              <Lock className="w-4 h-4 text-white" />
              <span>{guardandoPass ? 'Guardando Contraseña...' : 'Guardar Nueva Contraseña'}</span>
            </button>
          </form>

        </div>
      </article>
    </section>
  );
};
