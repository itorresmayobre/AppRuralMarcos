import type { UsuarioEmpleado, UserRole } from '../../types';
import { obtenerUsuariosBD, actualizarRolBD, supabase } from '../supabase';

export const usuariosService = {
  async obtenerUsuarios(): Promise<UsuarioEmpleado[]> {
    return await obtenerUsuariosBD();
  },

  async crearUsuarioEmpleado(
    nuevaData: Omit<UsuarioEmpleado, 'id' | 'fecha_alta' | 'activo' | 'username'>
  ): Promise<{ exito: boolean; error?: string }> {
    try {
      const usernameGenerado = `${nuevaData.nombre.toLowerCase().trim()}.${nuevaData.apellido.toLowerCase().trim()}`;
      
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: nuevaData.email,
        password: 'Password123!', // Contraseña temporal por defecto
      });

      if (authErr) {
        return { exito: false, error: authErr.message };
      }

      if (authData.user) {
        await supabase.from('perfiles').insert([{
          id: authData.user.id,
          empresa_id: nuevaData.empresa_id,
          username: usernameGenerado,
          nombre: nuevaData.nombre,
          apellido: nuevaData.apellido,
          email: nuevaData.email,
          rol: nuevaData.rol,
          activo: true,
        }]);
      }

      return { exito: true };
    } catch (err: any) {
      return { exito: false, error: err?.message || 'Error registrando empleado' };
    }
  },

  async actualizarRol(usuarioId: string, nuevoRol: UserRole): Promise<boolean> {
    return await actualizarRolBD(usuarioId, nuevoRol);
  },

  async cambiarContrasenia(_contraseniaActual: string, nuevaContrasenia: string): Promise<{ exito: boolean; error?: string }> {
    if (!nuevaContrasenia || nuevaContrasenia.length < 6) {
      return { exito: false, error: 'La nueva contraseña debe tener al menos 6 caracteres.' };
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: nuevaContrasenia,
      });

      if (error) {
        return { exito: false, error: error.message };
      }

      return { exito: true };
    } catch (e: any) {
      return { exito: false, error: e?.message || 'Error cambiando contraseña en Supabase' };
    }
  },
};
