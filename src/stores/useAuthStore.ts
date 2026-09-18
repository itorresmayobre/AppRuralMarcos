import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile, UserRole } from '../types';
import { supabase, obtenerPerfilUsuarioBD } from '../services/supabase';

interface AuthState {
  usuario: UserProfile | null;
  estaAutenticado: boolean;
  errorAutenticacion: string | null;
  cargando: boolean;
  iniciarSesion: (email: string, contrasenia: string) => Promise<boolean>;
  cerrarSesion: () => Promise<void>;
  cambiarRolSimulado: (nuevoRol: UserRole) => void;
  actualizarEmpresasUsuario: (empresaIds: string[]) => Promise<void>;
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
          // Resolver email si ingresó por username
          let emailParaLogin = emailLimpio;
          if (!emailLimpio.includes('@')) {
            const { data: perfilBusqueda } = await supabase
              .from('perfiles')
              .select('email')
              .eq('username', emailLimpio)
              .maybeSingle();

            if (perfilBusqueda?.email) {
              emailParaLogin = perfilBusqueda.email;
            }
          }

          // Autenticación directa por Correo Electrónico en Supabase Auth
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: emailParaLogin,
            password: passLimpia,
          });

          if (!authError && authData.user) {
            let perfilBD = await obtenerPerfilUsuarioBD(authData.user.id);
            
            // Si el perfil no existe en la tabla perfiles, rechazar el inicio de sesión y purgar token
            if (!perfilBD) {
              await supabase.auth.signOut().catch(() => {});
              try {
                localStorage.removeItem('agrouy-auth-session');
              } catch {}
              set({
                usuario: null,
                estaAutenticado: false,
                errorAutenticacion: 'Tu cuenta no tiene un perfil habilitado en la base de datos. Por favor regístrate o contacta a soporte.',
                cargando: false,
              });
              return false;
            }

            set({
              usuario: perfilBD,
              estaAutenticado: true,
              errorAutenticacion: null,
              cargando: false,
            });
            return true;
          }

          if (authError) {
            let msg = 'Correo electrónico o contraseña incorrectos.';
            if (authError.message.includes('Email not confirmed')) {
              msg = 'Tu correo electrónico aún no ha sido verificado. Por favor revisa tu bandeja de entrada o solicita asistencia.';
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

        // 1. Enviar revocación de sesión a Supabase y esperar confirmación del servidor
        try {
          const { error } = await supabase.auth.signOut();
          if (error) {
            console.warn('Aviso en signOut de Supabase:', error.message);
          }
        } catch (e) {
          console.warn('Excepción en signOut de Supabase:', e);
        }

        // 2. Una vez confirmado por Supabase (o ante cualquier excepción), purgar la caché local
        try {
          localStorage.removeItem('agrouy-auth-session');
        } catch {}

        // 3. Actualizar el estado del cliente a desautenticado
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

      actualizarEmpresasUsuario: async (empresaIds: string[]) => {
        set((state) => {
          if (!state.usuario) return state;
          const usuarioActualizado = { ...state.usuario, empresa_ids: empresaIds };
          
          // Async update in Supabase perfiles if user has an ID
          if (state.usuario.id) {
            supabase
              .from('perfiles')
              .update({ empresa_ids: empresaIds })
              .eq('id', state.usuario.id)
              .then(({ error }) => {
                if (error) console.warn('Aviso actualizando empresa_ids en perfil:', error);
              });
          }

          return { usuario: usuarioActualizado };
        });
      },
    }),
    {
      name: 'agrouy-auth-session',
    }
  )
);

supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_OUT' || !session) {
    try {
      localStorage.removeItem('agrouy-auth-session');
    } catch {}
    useAuthStore.setState({ usuario: null, estaAutenticado: false, cargando: false });
  } else if ((event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') && session?.user) {
    const perfil = await obtenerPerfilUsuarioBD(session.user.id);
    if (perfil) {
      useAuthStore.setState({ usuario: perfil, estaAutenticado: true });
    } else {
      await supabase.auth.signOut().catch(() => {});
      try {
        localStorage.removeItem('agrouy-auth-session');
      } catch {}
      useAuthStore.setState({ usuario: null, estaAutenticado: false, cargando: false });
    }
  }
});

export async function validarSesionActivaSupabase(): Promise<boolean> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session || (session.expires_at && session.expires_at * 1000 <= Date.now())) {
      localStorage.removeItem('agrouy-auth-session');
      useAuthStore.setState({ usuario: null, estaAutenticado: false, cargando: false });
      return false;
    }

    // Verificar si el perfil sigue existiendo en la tabla perfiles de PostgreSQL
    const perfilBD = await obtenerPerfilUsuarioBD(session.user.id);
    if (!perfilBD) {
      await supabase.auth.signOut().catch(() => {});
      try {
        localStorage.removeItem('agrouy-auth-session');
      } catch {}
      useAuthStore.setState({ usuario: null, estaAutenticado: false, cargando: false });
      return false;
    }

    useAuthStore.setState({ usuario: perfilBD, estaAutenticado: true });
    return true;
  } catch {
    localStorage.removeItem('agrouy-auth-session');
    useAuthStore.setState({ usuario: null, estaAutenticado: false, cargando: false });
    return false;
  }
}
