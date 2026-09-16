import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile, UserRole } from '../types';
import { supabase, obtenerPerfilUsuarioBD } from '../services/supabase';

interface AuthState {
  usuario: UserProfile | null;
  estaAutenticado: boolean;
  errorAutenticacion: string | null;
  cargando: boolean;
  iniciarSesion: (credencial: string, contrasenia: string) => Promise<boolean>;
  cerrarSesion: () => Promise<void>;
  cambiarRolSimulado: (nuevoRol: UserRole) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      usuario: null,
      estaAutenticado: false,
      errorAutenticacion: null,
      cargando: false,

      iniciarSesion: async (email: string, contrasenia: string) => {
        const emailLimpio = email.trim().toLowerCase();
        const passLimpia = contrasenia.trim();

        set({ cargando: true, errorAutenticacion: null });

        try {
          // Autenticación directa por Correo Electrónico en Supabase Auth
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: emailLimpio,
            password: passLimpia,
          });

          if (!authError && authData.user) {
            const perfilBD = await obtenerPerfilUsuarioBD(authData.user.id);
            if (perfilBD) {
              set({
                usuario: perfilBD,
                estaAutenticado: true,
                errorAutenticacion: null,
                cargando: false,
              });
              return true;
            }
          }

          if (authError) {
            let msg = 'Correo electrónico o contraseña incorrectos.';
            if (authError.message.includes('Email not confirmed')) {
              msg = 'Tu correo electrónico aún no ha sido verificado. Por favor revisa tu bandeja de entrada o solicita asistencia al administrador.';
            } else if (authError.message.includes('Invalid login credentials')) {
              msg = 'Las credenciales ingresadas son incorrectas. Verifica tu email y contraseña.';
            }
            set({ errorAutenticacion: msg, cargando: false });
            return false;
          }
        } catch (err: any) {
          console.error('Error durante iniciarSesion:', err);
        }

        set({
          errorAutenticacion: 'No se pudo iniciar sesión. Verifica tu correo y contraseña.',
          cargando: false,
        });
        return false;
      },

      cerrarSesion: async () => {
        set({ cargando: true });

        // 1. Esperar la confirmación del backend en Supabase Auth (Revocación real del token en el servidor)
        try {
          await supabase.auth.signOut();
        } catch (e) {
          console.warn('Aviso en signOut de Supabase:', e);
        }

        // 2. Limpiar cache local persistente
        try {
          localStorage.removeItem('agrouy-auth-session');
        } catch {
          // Ignorar
        }

        // 3. Limpiar el estado de sesión local una vez confirmado el backend
        set({
          usuario: null,
          estaAutenticado: false,
          errorAutenticacion: null,
          cargando: false,
        });
      },

      cambiarRolSimulado: (nuevoRol: UserRole) => {
        set((state) => {
          if (!state.usuario) return state;
          return {
            usuario: {
              ...state.usuario,
              rol: nuevoRol,
            },
          };
        });
      },
    }),
    {
      name: 'agrouy-auth-session',
    }
  )
);

/**
 * Escuchar cambios en la sesión de Supabase Auth en tiempo real.
 * Si el token expira o se cierra la sesión en el servidor, purgar automáticamente el localStorage.
 */
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_OUT' || !session) {
    try {
      localStorage.removeItem('agrouy-auth-session');
    } catch {}
    useAuthStore.setState({ usuario: null, estaAutenticado: false, cargando: false });
  } else if (event === 'TOKEN_REFRESHED' && session?.user) {
    // Si el token fue renovado exitosamente, actualizar datos del usuario
    const perfil = await obtenerPerfilUsuarioBD(session.user.id);
    if (perfil) {
      useAuthStore.setState({ usuario: perfil, estaAutenticado: true });
    }
  }
});

/**
 * Validar la validez del token en el arranque de la aplicación.
 * Si el token en localStorage venció, purgar el almacenamiento inmediatamente.
 */
export async function validarSesionActivaSupabase(): Promise<boolean> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session || (session.expires_at && session.expires_at * 1000 <= Date.now())) {
      // Token inexistente o vencido: Purgar localStorage
      localStorage.removeItem('agrouy-auth-session');
      useAuthStore.setState({ usuario: null, estaAutenticado: false, cargando: false });
      return false;
    }

    return true;
  } catch {
    localStorage.removeItem('agrouy-auth-session');
    useAuthStore.setState({ usuario: null, estaAutenticado: false, cargando: false });
    return false;
  }
}

