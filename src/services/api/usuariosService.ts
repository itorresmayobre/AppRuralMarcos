import { simularLlamadoApi } from './mockApi';
import { hoyISO } from '../../utils/fechas';
import type { UsuarioEmpleado, UserRole } from '../../types';

function generarUsername(nombre: string, apellido: string): string {
  const n = nombre.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '');
  const a = apellido.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '');
  return `${n}.${a}`;
}

export const usuariosService = {
  async obtenerUsuarios(listaActual: UsuarioEmpleado[]): Promise<UsuarioEmpleado[]> {
    return simularLlamadoApi(listaActual, { latenciaMs: 500 });
  },

  async crearUsuarioEmpleado(
    nuevaData: Omit<UsuarioEmpleado, 'id' | 'fecha_alta' | 'activo' | 'username'>,
    listaActual: UsuarioEmpleado[]
  ): Promise<UsuarioEmpleado> {
    const emailExiste = listaActual.some((u) => u.email.toLowerCase() === nuevaData.email.toLowerCase());

    if (emailExiste) {
      return simularLlamadoApi(null as unknown as UsuarioEmpleado, {
        latenciaMs: 700,
        debeFallar: true,
        mensajeError: `El correo electrónico "${nuevaData.email}" ya se encuentra registrado en el sistema.`,
      });
    }

    const usernameGenerado = generarUsername(nuevaData.nombre, nuevaData.apellido);

    const nuevo: UsuarioEmpleado = {
      ...nuevaData,
      username: usernameGenerado,
      id: `user-${Date.now()}`,
      fecha_alta: hoyISO(),
      activo: true,
    };

    return simularLlamadoApi(nuevo, { latenciaMs: 800 });
  },

  async actualizarRol(usuarioId: string, nuevoRol: UserRole): Promise<{ id: string; nuevoRol: UserRole }> {
    return simularLlamadoApi({ id: usuarioId, nuevoRol }, { latenciaMs: 600 });
  },

  async cambiarContrasenia(contraseniaActual: string, nuevaContrasenia: string): Promise<boolean> {
    if (contraseniaActual.trim() === '') {
      return simularLlamadoApi(false, {
        latenciaMs: 500,
        debeFallar: true,
        mensajeError: 'Debes ingresar tu contraseña actual para confirmar el cambio de seguridad.',
      });
    }

    if (nuevaContrasenia.length < 4) {
      return simularLlamadoApi(false, {
        latenciaMs: 500,
        debeFallar: true,
        mensajeError: 'La nueva contraseña debe tener al menos 4 caracteres de longitud.',
      });
    }

    return simularLlamadoApi(true, { latenciaMs: 900 });
  },
};
