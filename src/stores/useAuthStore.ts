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

      iniciarSesion: async (credencial: string, contrasenia: string) => {
        const credencialLimpia = credencial.trim().toLowerCase();
        const passLimpia = contrasenia.trim();

        set({ cargando: true, errorAutenticacion: null });

        // 1. Resolver email a partir del username o usar la credencial si es email
        let emailParaLogin = credencialLimpia;

        try {
          if (!credencialLimpia.includes('@')) {
            const { data: perfilBusqueda } = await supabase
              .from('perfiles')
              .select('email')
              .eq('username', credencialLimpia)
              .maybeSingle();

            if (perfilBusqueda?.email) {
              emailParaLogin = perfilBusqueda.email;
            }
          }

          // Intentar autenticación real en Supabase Auth
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: emailParaLogin,
            password: passLimpia,
          });

          if (!authError && authData.user) {
            let perfilBD = await obtenerPerfilUsuarioBD(authData.user.id);
            
            // Si el perfil no existe en BD aún, construir objeto de perfil funcional
            if (!perfilBD) {
              const email = authData.user.email || emailParaLogin;
              const nombreFallback = authData.user.user_metadata?.nombre || email.split('@')[0] || 'Usuario';
              perfilBD = {
                id: authData.user.id,
                email: email,
                username: email.split('@')[0],
                nombre: nombreFallback,
                apellido: '',
                rol: 'PROPIETARIO',
                estancias_asignadas_ids: ['TODAS'],
              };
            }

            set({
              usuario: perfilBD,
              estaAutenticado: true,
              errorAutenticacion: null,
              cargando: false,
            });
            return true;
          }
        } catch (err) {
          console.warn('Supabase auth no disponible o error inesperado:', err);
        }

        // 2. Fallback Demo local (Acceso rápido con credenciales de prueba)
        if (
          (credencialLimpia === 'admin@admin.com' || credencialLimpia === 'admin' || credencialLimpia === 'marcos.propietario') && 
          (passLimpia === 'admin' || passLimpia === 'admin123')
        ) {
          set({
            usuario: {
              id: 'user-admin-1',
              email: 'admin@admin.com',
              username: 'marcos.propietario',
              nombre: 'Marcos (Admin)',
              apellido: 'Propietario',
              rol: 'PROPIETARIO',
              estancias_asignadas_ids: ['TODAS'],
            },
            estaAutenticado: true,
            errorAutenticacion: null,
            cargando: false,
          });
          return true;
        }

        if (
          (credencialLimpia === 'capataz@campo.com' || credencialLimpia === 'juan.perez' || credencialLimpia === 'capataz') && 
          (passLimpia === 'capataz' || passLimpia === 'admin')
        ) {
          set({
            usuario: {
              id: 'user-capataz-2',
              email: 'capataz@campo.com',
              username: 'juan.perez',
              nombre: 'Juan (Capataz)',
              apellido: 'Pérez',
              rol: 'CAPATAZ',
              estancias_asignadas_ids: ['est-1', 'est-2'],
            },
            estaAutenticado: true,
            errorAutenticacion: null,
            cargando: false,
          });
          return true;
        }

        if (
          (credencialLimpia === 'contador@empresa.com' || credencialLimpia === 'carlos.silva' || credencialLimpia === 'contador') && 
          (passLimpia === 'contador' || passLimpia === 'admin')
        ) {
          set({
            usuario: {
              id: 'user-contador-3',
              email: 'contador@empresa.com',
              username: 'carlos.silva',
              nombre: 'Carlos (Contador)',
              apellido: 'Silva',
              rol: 'CONTADOR',
              estancias_asignadas_ids: ['TODAS'],
            },
            estaAutenticado: true,
            errorAutenticacion: null,
            cargando: false,
          });
          return true;
        }

        set({
          errorAutenticacion: 'Usuario, correo o contraseña incorrectos.',
          cargando: false,
        });
        return false;
      },

      cerrarSesion: async () => {
        set({ cargando: true });

        try {
          await supabase.auth.signOut();
        } catch (e) {
          console.warn('Aviso en signOut de Supabase:', e);
        }

        try {
          localStorage.removeItem('agrouy-auth-session');
        } catch {}

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

supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_OUT' || !session) {
    try {
      localStorage.removeItem('agrouy-auth-session');
    } catch {}
    useAuthStore.setState({ usuario: null, estaAutenticado: false, cargando: false });
  } else if (event === 'TOKEN_REFRESHED' && session?.user) {
    const perfil = await obtenerPerfilUsuarioBD(session.user.id);
    if (perfil) {
      useAuthStore.setState({ usuario: perfil, estaAutenticado: true });
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

    return true;
  } catch {
    localStorage.removeItem('agrouy-auth-session');
    useAuthStore.setState({ usuario: null, estaAutenticado: false, cargando: false });
    return false;
  }
}
