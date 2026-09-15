import { useState } from 'react';
import { useToastStore } from '../../stores/useToastStore';
import { usuariosService } from '../../services/api/usuariosService';

export const useCambiarPasswordForm = () => {
  const { mostrarToast } = useToastStore();

  const [passActual, setPassActual] = useState('');
  const [passNueva, setPassNueva] = useState('');
  const [passConfirmar, setPassConfirmar] = useState('');
  const [cargandoPass, setCargandoPass] = useState(false);

  const handleCambiarContrasenia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passNueva !== passConfirmar) {
      mostrarToast('Contraseñas no coinciden', 'La contraseña nueva y la confirmación deben ser idénticas.', 'ADVERTENCIA');
      return;
    }

    setCargandoPass(true);
    try {
      await usuariosService.cambiarContrasenia(passActual, passNueva);
      setCargandoPass(false);
      setPassActual('');
      setPassNueva('');
      setPassConfirmar('');
      mostrarToast('¡Contraseña Actualizada!', 'Tu clave de acceso ha sido guardada de forma segura.', 'EXITO');
    } catch (err: unknown) {
      setCargandoPass(false);
      const mensaje = err instanceof Error ? err.message : 'No se pudo actualizar la contraseña';
      mostrarToast('Fallo en Seguridad', mensaje, 'ERROR');
    }
  };

  return {
    passActual,
    setPassActual,
    passNueva,
    setPassNueva,
    passConfirmar,
    setPassConfirmar,
    cargandoPass,
    handleCambiarContrasenia,
  };
};
