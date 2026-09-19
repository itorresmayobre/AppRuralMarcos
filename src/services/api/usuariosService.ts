import type { UsuarioEmpleado, UserRole } from '../../types';
import { obtenerUsuariosBD, actualizarRolBD, supabase } from '../supabase';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dyzeiwwafcdzwocuksao.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5emVpd3dhZmNkendvY3Vrc2FvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0ODk1MzYsImV4cCI6MjEwNTA2NTUzNn0.x0amIE8dqfhItWLLb3K2O7fjsGBBQ3vzqQ5eZzrcqvI';

export const usuariosService = {
  async obtenerUsuarios(): Promise<UsuarioEmpleado[]> {
    return await obtenerUsuariosBD();
  },

  async crearUsuarioEmpleado(
    nuevaData: Omit<UsuarioEmpleado, 'id' | 'fecha_alta' | 'activo' | 'username'>
  ): Promise<{ exito: boolean; error?: string }> {
    try {
      const emailLimpio = nuevaData.email.trim().toLowerCase();
      const usernameGenerado = `${nuevaData.nombre.toLowerCase().trim()}.${nuevaData.apellido.toLowerCase().trim()}`;

      // 1. Crear usuario en Supabase Auth usando cliente aislado sin persistencia de sesión
      const clienteAislado = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false },
      });

      const tempPassword = `${crypto.randomUUID()}!Aa1`;
      const { data: authData, error: authErr } = await clienteAislado.auth.signUp({
        email: emailLimpio,
        password: tempPassword,
        options: {
          data: {
            nombre: nuevaData.nombre,
            apellido: nuevaData.apellido,
            rol: nuevaData.rol,
          },
        },
      });

      if (authErr) {
        return { exito: false, error: authErr.message };
      }

      if (authData.user) {
        // 2. Crear o actualizar la fila en public.perfiles con permisos y estancias asignadas
        const { error: perfilErr } = await supabase.from('perfiles').upsert([{
          id: authData.user.id,
          empresa_ids: nuevaData.empresa_ids || [],
          username: usernameGenerado,
          nombre: nuevaData.nombre,
          apellido: nuevaData.apellido,
          email: emailLimpio,
          rol: nuevaData.rol,
          estancias_asignadas_ids: nuevaData.estancias_asignadas_ids || ['TODAS'],
          activa: true,
        }], { onConflict: 'id' });

        if (perfilErr) {
          console.warn('Aviso al guardar perfil de empleado:', perfilErr.message);
        }

        // 3. Enviar correo de invitación / activación para que el empleado defina su contraseña
        try {
          await supabase.auth.resetPasswordForEmail(emailLimpio, {
            redirectTo: `${window.location.origin}/login#type=recovery`,
          });
        } catch (e) {
          console.warn('Aviso enviando correo de invitación:', e);
        }
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
