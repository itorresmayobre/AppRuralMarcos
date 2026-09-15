import { create } from 'zustand';
import { hoyISO } from '../utils/fechas';
import type { UsuarioEmpleado, UserRole, PermisoRol } from '../types';

interface UsuariosState {
  usuarios: UsuarioEmpleado[];
  matrizPermisos: Record<UserRole, PermisoRol>;
  crearUsuario: (nuevo: Omit<UsuarioEmpleado, 'id' | 'fecha_alta' | 'activo' | 'username'>) => void;
  actualizarRolUsuario: (usuarioId: string, nuevoRol: UserRole) => void;
  toggleEstadoUsuario: (usuarioId: string) => void;
  togglePermisoRol: (rol: UserRole, permiso: keyof PermisoRol) => void;
  vincularEmpresaAUsuario: (email: string, empresaId: string, nombreSolicitante?: string) => void;
}

function generarUsername(nombre: string, apellido: string): string {
  const n = nombre.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '');
  const a = apellido.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '');
  return `${n}.${a}`;
}

const usuariosIniciales: UsuarioEmpleado[] = [
  {
    id: 'user-1',
    email: 'admin@admin.com',
    username: 'marcos.propietario',
    nombre: 'Marcos',
    apellido: 'Propietario',
    rol: 'PROPIETARIO',
    empresa_id: 'emp-1',
    empresas_asignadas_ids: ['emp-1', 'emp-2'],
    estancias_asignadas_ids: ['TODAS'],
    fecha_alta: '2026-01-10',
    activo: true,
  },
  {
    id: 'user-2',
    email: 'capataz@campo.com',
    username: 'juan.perez',
    nombre: 'Juan',
    apellido: 'Pérez',
    rol: 'CAPATAZ',
    empresa_id: 'emp-1',
    empresas_asignadas_ids: ['emp-1'],
    estancias_asignadas_ids: ['est-1', 'est-2'],
    fecha_alta: '2026-02-15',
    activo: true,
  },
  {
    id: 'user-3',
    email: 'contador@empresa.com',
    username: 'carlos.silva',
    nombre: 'Carlos',
    apellido: 'Silva',
    rol: 'CONTADOR',
    empresa_id: 'emp-1',
    empresas_asignadas_ids: ['emp-1'],
    estancias_asignadas_ids: ['TODAS'],
    fecha_alta: '2026-03-01',
    activo: true,
  },
  {
    id: 'user-4',
    email: 'operario@campo.com',
    username: 'roberto.gonzalez',
    nombre: 'Roberto',
    apellido: 'González',
    rol: 'OPERARIO',
    empresa_id: 'emp-1',
    empresas_asignadas_ids: ['emp-1'],
    estancias_asignadas_ids: ['est-1'],
    fecha_alta: '2026-04-20',
    activo: true,
  },
];

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

export const useUsuariosStore = create<UsuariosState>((set) => ({
  usuarios: usuariosIniciales,
  matrizPermisos: matrizPermisosInicial,

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

  actualizarRolUsuario: (usuarioId, nuevoRol) => {
    set((state) => ({
      usuarios: state.usuarios.map((u) => {
        if (u.id === usuarioId && (u.rol === 'PROPIETARIO' || u.rol === 'SUPERADMIN')) {
          return u; // El rol de Propietario o SuperAdmin no se puede degradar arbitrariamente
        }
        return u.id === usuarioId ? { ...u, rol: nuevoRol } : u;
      }),
    }));
  },

  toggleEstadoUsuario: (usuarioId) => {
    set((state) => ({
      usuarios: state.usuarios.map((u) => {
        if (u.id === usuarioId) {
          if (u.rol === 'PROPIETARIO' || u.rol === 'SUPERADMIN') {
            return u; // Protegido contra desactivación
          }
          return { ...u, activo: !u.activo };
        }
        return u;
      }),
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
        const empresasActuales = usuarioExistente.empresas_asignadas_ids || [usuarioExistente.empresa_id || 'emp-1'];
        if (!empresasActuales.includes(empresaId)) {
          empresasActuales.push(empresaId);
        }
        return {
          usuarios: state.usuarios.map((u) =>
            u.id === usuarioExistente.id
              ? { ...u, empresas_asignadas_ids: [...empresasActuales] }
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
          empresa_id: empresaId,
          empresas_asignadas_ids: [empresaId],
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
