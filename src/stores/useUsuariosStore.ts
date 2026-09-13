import { create } from 'zustand';
import type { UsuarioEmpleado, UserRole, PermisoRol } from '../types';

interface UsuariosState {
  usuarios: UsuarioEmpleado[];
  matrizPermisos: Record<UserRole, PermisoRol>;
  crearUsuario: (nuevo: Omit<UsuarioEmpleado, 'id' | 'fecha_alta' | 'activo' | 'username'>) => void;
  actualizarRolUsuario: (usuarioId: string, nuevoRol: UserRole) => void;
  togglePermisoRol: (rol: UserRole, permiso: keyof PermisoRol) => void;
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
    rol: 'ADMIN',
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
    estancias_asignadas_ids: ['est-1'],
    fecha_alta: '2026-04-20',
    activo: true,
  },
];

const matrizPermisosInicial: Record<UserRole, PermisoRol> = {
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
      fecha_alta: new Date().toISOString().split('T')[0],
      activo: true,
    };

    set((state) => ({
      usuarios: [...state.usuarios, nuevoUsuario],
    }));
  },

  actualizarRolUsuario: (usuarioId, nuevoRol) => {
    set((state) => ({
      usuarios: state.usuarios.map((u) => (u.id === usuarioId ? { ...u, rol: nuevoRol } : u)),
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
}));
