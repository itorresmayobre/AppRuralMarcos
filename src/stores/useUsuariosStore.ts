import { create } from 'zustand';
import { hoyISO } from '../utils/fechas';
import type { UsuarioEmpleado, UserRole, PermisoRol } from '../types';
import { obtenerUsuariosBD, actualizarRolBD, supabase } from '../services/supabase';

interface UsuariosState {
  usuarios: UsuarioEmpleado[];
  matrizPermisos: Record<UserRole, PermisoRol>;
  cargando: boolean;
  inicializado: boolean;
  cargarUsuariosDesdeSupabase: () => Promise<void>;
  crearUsuario: (nuevo: Omit<UsuarioEmpleado, 'id' | 'fecha_alta' | 'activo' | 'username'>) => void;
  actualizarRolUsuario: (usuarioId: string, nuevoRol: UserRole) => Promise<void>;
  toggleEstadoUsuario: (usuarioId: string) => Promise<void>;
  togglePermisoRol: (rol: UserRole, permiso: keyof PermisoRol) => void;
  vincularEmpresaAUsuario: (email: string, empresaId: string, nombreSolicitante?: string) => void;
}

function generarUsername(nombre: string, apellido: string): string {
  const n = nombre.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '');
  const a = apellido.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '');
  return `${n}.${a}`;
}

const matrizPermisosInicial: Record<UserRole, PermisoRol> = {
  SUPERADMIN: {
    ver_dashboard: true,
    ver_ganado: true,
    editar_ganado: true,
    ver_finanzas: true,
    editar_finanzas: true,
    ver_estancias: true,
    editar_estancias: true,
    administrar_usuarios: true,
    ver_consola_dev: true,
  },
  PROPIETARIO: {
    ver_dashboard: true,
    ver_ganado: true,
    editar_ganado: true,
    ver_finanzas: true,
    editar_finanzas: true,
    ver_estancias: true,
    editar_estancias: true,
    administrar_usuarios: true,
  },
  ADMIN: {
    ver_dashboard: true,
    ver_ganado: true,
    editar_ganado: true,
    ver_finanzas: true,
    editar_finanzas: true,
    ver_estancias: true,
    editar_estancias: true,
    administrar_usuarios: true,
  },
  CAPATAZ: {
    ver_dashboard: true,
    ver_ganado: true,
    editar_ganado: true,
    ver_finanzas: false,
    editar_finanzas: false,
    ver_estancias: true,
    editar_estancias: false,
    administrar_usuarios: false,
  },
  CONTADOR: {
    ver_dashboard: true,
    ver_ganado: true,
    editar_ganado: false,
    ver_finanzas: true,
    editar_finanzas: true,
    ver_estancias: true,
    editar_estancias: false,
    administrar_usuarios: false,
  },
  OPERARIO: {
    ver_dashboard: true,
    ver_ganado: true,
    editar_ganado: false,
    ver_finanzas: false,
    editar_finanzas: false,
    ver_estancias: false,
    editar_estancias: false,
    administrar_usuarios: false,
  },
};

export const useUsuariosStore = create<UsuariosState>((set, get) => ({
  usuarios: [],
  matrizPermisos: matrizPermisosInicial,
  cargando: false,
  inicializado: false,

  cargarUsuariosDesdeSupabase: async () => {
    set({ cargando: true });
    const datosBD = await obtenerUsuariosBD();
    set({ usuarios: datosBD || [], cargando: false, inicializado: true });
  },

  crearUsuario: (data) => {
    const usernameGenerado = generarUsername(data.nombre, data.apellido);
    const nuevoUsuario: UsuarioEmpleado = {
      ...data,
      username: usernameGenerado,
      id: `user-${Date.now()}`,
      fecha_alta: hoyISO(),
      activo: true,
    };

    set((state) => ({
      usuarios: [...state.usuarios, nuevoUsuario],
    }));
  },

  actualizarRolUsuario: async (usuarioId, nuevoRol) => {
    // 1. Guardar en Supabase
    await actualizarRolBD(usuarioId, nuevoRol);

    // 2. Actualizar estado local
    set((state) => ({
      usuarios: state.usuarios.map((u) => {
        if (u.id === usuarioId && (u.rol === 'PROPIETARIO' || u.rol === 'SUPERADMIN')) {
          return u;
        }
        return u.id === usuarioId ? { ...u, rol: nuevoRol } : u;
      }),
    }));
  },

  toggleEstadoUsuario: async (usuarioId) => {
    const targetUser = get().usuarios.find((u) => u.id === usuarioId);
    if (!targetUser) return;
    if (targetUser.rol === 'PROPIETARIO' || targetUser.rol === 'SUPERADMIN') return;

    const nuevoActivo = !targetUser.activo;

    try {
      await supabase
        .from('perfiles')
        .update({ activo: nuevoActivo })
        .eq('id', usuarioId);
    } catch (e) {
      console.warn('Error cambiando activo en Supabase:', e);
    }

    set((state) => ({
      usuarios: state.usuarios.map((u) =>
        u.id === usuarioId ? { ...u, activo: nuevoActivo } : u
      ),
    }));
  },

  togglePermisoRol: (rol, permiso) => {
    set((state) => ({
      matrizPermisos: {
        ...state.matrizPermisos,
        [rol]: {
          ...state.matrizPermisos[rol],
          [permiso]: !state.matrizPermisos[rol][permiso],
        },
      },
    }));
  },

  vincularEmpresaAUsuario: (email, empresaId, nombreSolicitante) => {
    const emailNorm = email.trim().toLowerCase();
    set((state) => {
      const usuarioExistente = state.usuarios.find((u) => u.email.toLowerCase() === emailNorm);

      if (usuarioExistente) {
        const empresasActuales = usuarioExistente.empresa_ids || [];
        if (!empresasActuales.includes(empresaId)) {
          empresasActuales.push(empresaId);
        }
        return {
          usuarios: state.usuarios.map((u) =>
            u.id === usuarioExistente.id
              ? { ...u, empresa_ids: [...empresasActuales] }
              : u
          ),
        };
      } else {
        const partesNombre = (nombreSolicitante || 'Propietario Nuevo').split(' ');
        const nombre = partesNombre[0] || 'Propietario';
        const apellido = partesNombre.slice(1).join(' ') || 'Propietario';
        const usernameGenerado = generarUsername(nombre, apellido);

        const nuevoUsuario: UsuarioEmpleado = {
          id: `user-${Date.now()}`,
          email: emailNorm,
          username: usernameGenerado,
          nombre,
          apellido,
          rol: 'ADMIN',
          empresa_ids: [empresaId],
          estancias_asignadas_ids: ['TODAS'],
          fecha_alta: hoyISO(),
          activo: true,
        };

        return {
          usuarios: [...state.usuarios, nuevoUsuario],
        };
      }
    });
  },
}));
