import { useState } from 'react';
import { useToastStore } from '../../stores/useToastStore';
import { supabase } from '../../services/supabase';

export const useCambiarPasswordForm = () => {
  const { mostrarToast } = useToastStore();

  const [passNueva, setPassNueva] = useState('');
  const [passConfirmar, setPassConfirmar] = useState('');
  const [cargandoPass, setCargandoPass] = useState(false);

  const handleCambiarContrasenia = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passNueva.length < 6) {
      mostrarToast('Error de Validación', 'La contraseña nueva debe tener al menos 6 caracteres.', 'ERROR');
      return;
    }

    if (passNueva !== passConfirmar) {
      mostrarToast('Contraseñas no coinciden', 'La contraseña nueva y la confirmación deben ser idénticas.', 'ADVERTENCIA');
      return;
    }

    setCargandoPass(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passNueva });

      if (error) {
        mostrarToast('Error', error.message || 'No se pudo actualizar la contraseña.', 'ERROR');
      } else {
        setPassNueva('');
        setPassConfirmar('');
        mostrarToast('¡Contraseña Configurada!', 'Tu clave de acceso ha sido guardada de forma segura en Supabase Auth.', 'EXITO');
      }
    } catch (err: unknown) {
      const mensaje = err instanceof Error ? err.message : 'No se pudo actualizar la contraseña';
      mostrarToast('Fallo en Seguridad', mensaje, 'ERROR');
    } finally {
      setCargandoPass(false);
    }
  };

  return {
    passNueva,
    setPassNueva,
    passConfirmar,
    setPassConfirmar,
    cargandoPass,
    handleCambiarContrasenia,
  };
};
