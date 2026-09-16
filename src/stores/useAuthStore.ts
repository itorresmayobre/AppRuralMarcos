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

        // 1. Intentar buscar email asociado al username en public.perfiles
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
        } catch (err) {
          console.warn('Supabase auth no disponible o usuario no existe en Supabase Auth:', err);
        }

        // 2. Fallback Demo local (permite ingresar sin errores cuando el usuario no se ha creado aún en Supabase Auth)
        if (
          (credencialLimpia === 'admin@admin.com' || credencialLimpia === 'admin' || credencialLimpia === 'marcos.propietario') && 
          passLimpia === 'admin'
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
          passLimpia === 'capataz'
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
          passLimpia === 'contador'
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
          errorAutenticacion: 'Usuario o contraseña incorrectos.',
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
