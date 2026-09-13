import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile, UserRole } from '../types';

interface AuthState {
  usuario: UserProfile | null;
  estaAutenticado: boolean;
  errorAutenticacion: string | null;
  iniciarSesion: (credencial: string, contrasenia: string) => boolean;
  cerrarSesion: () => void;
  cambiarRolSimulado: (nuevoRol: UserRole) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      usuario: null,
      estaAutenticado: false,
      errorAutenticacion: null,

  iniciarSesion: (credencial: string, contrasenia: string) => {
    const credencialLimpia = credencial.trim().toLowerCase();
    const passLimpia = contrasenia.trim();

    // 1. Admin
    if ((credencialLimpia === 'admin@admin.com' || credencialLimpia === 'admin' || credencialLimpia === 'marcos.propietario') && passLimpia === 'admin') {
      set({
        usuario: {
          id: 'user-admin-1',
          email: 'admin@admin.com',
          username: 'marcos.propietario',
          nombre: 'Marcos (Admin)',
          apellido: 'Propietario',
          rol: 'ADMIN',
          estancias_asignadas_ids: ['TODAS'],
        },
        estaAutenticado: true,
        errorAutenticacion: null,
      });
      return true;
    }

    // 2. Capataz (Asignado a El Ombú y Los Plátanos)
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
      });
      return true;
    }

    // 3. Contador
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
      });
      return true;
    }

    set({ errorAutenticacion: 'Usuario, correo o contraseña incorrectos.' });
    return false;
  },

  cerrarSesion: () => {
    set({
      usuario: null,
      estaAutenticado: false,
      errorAutenticacion: null,
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
      name: 'agrouy-auth-session', // Guarda el estado en localStorage
    }
  )
);

