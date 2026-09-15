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

        // 1. Intentar inicio de sesión real en Supabase Auth
        try {
          const emailParaLogin = credencialLimpia.includes('@')
            ? credencialLimpia
            : `${credencialLimpia}@agrouy.com`; // Fallback de username a email

          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: emailParaLogin,
            password: passLimpia,
          });

          if (!authError && authData.user) {
            // Verificar perfil en public.perfiles
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
          console.warn('Supabase auth no disponible, usando autenticación demo local:', err);
        }

        // 2. Fallback Demo para pruebas locales
        if ((credencialLimpia === 'admin@admin.com' || credencialLimpia === 'admin' || credencialLimpia === 'marcos.propietario') && passLimpia === 'admin') {
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

        if ((credencialLimpia === 'capataz@campo.com' || credencialLimpia === 'juan.perez' || credencialLimpia === 'capataz') && passLimpia === 'capataz') {
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

        if ((credencialLimpia === 'contador@empresa.com' || credencialLimpia === 'carlos.silva' || credencialLimpia === 'contador') && passLimpia === 'contador') {
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
          errorAutenticacion: 'Usuario, correo o contraseña incorrectos en Supabase / Local.',
          cargando: false,
        });
        return false;
      },

      cerrarSesion: async () => {
        try {
          await supabase.auth.signOut();
        } catch (e) {
          // Ignore
        }
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
