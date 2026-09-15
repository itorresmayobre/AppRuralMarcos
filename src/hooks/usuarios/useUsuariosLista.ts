import { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useUsuariosStore } from '../../stores/useUsuariosStore';
import { useToastStore } from '../../stores/useToastStore';
import { usuariosService } from '../../services/api/usuariosService';
import type { UserRole, PermisoRol } from '../../types';

export const useUsuariosLista = () => {
  const { usuario } = useAuthStore();
  const { usuarios, matrizPermisos, actualizarRolUsuario, toggleEstadoUsuario, togglePermisoRol } = useUsuariosStore();
  const { mostrarToast } = useToastStore();

  const esAdmin = usuario?.rol === 'ADMIN' || usuario?.rol === 'PROPIETARIO' || usuario?.rol === 'SUPERADMIN';

  const [cargandoApi, setCargandoApi] = useState(false);
  const [errorApi, setErrorApi] = useState<string | null>(null);

  const cargarListaUsuarios = async () => {
    setCargandoApi(true);
    setErrorApi(null);
    try {
      await usuariosService.obtenerUsuarios(usuarios);
      setCargandoApi(false);
    } catch (err: unknown) {
      setCargandoApi(false);
      const mensaje = err instanceof Error ? err.message : 'Error al conectar con el servidor Supabase';
      setErrorApi(mensaje);
      mostrarToast('Error de Conexión', mensaje, 'ERROR');
    }
  };

  useEffect(() => {
    cargarListaUsuarios();
  }, []);

  const handleCambiarRol = async (usuarioId: string, nuevoRol: UserRole) => {
    try {
      await usuariosService.actualizarRol(usuarioId, nuevoRol);
      actualizarRolUsuario(usuarioId, nuevoRol);
      mostrarToast('Rol Actualizado', `Se han reasignado los permisos a ${nuevoRol}.`, 'INFO');
    } catch (err: unknown) {
      const mensaje = err instanceof Error ? err.message : 'No se pudo actualizar el rol';
      mostrarToast('Error de Permisos', mensaje, 'ERROR');
    }
  };

  const listaPermisosLabel: { clave: keyof PermisoRol; label: string }[] = [
    { clave: 'ver_dashboard', label: 'Ver Dashboard General' },
    { clave: 'ver_ganado', label: 'Ver Stock de Ganado' },
    { clave: 'editar_ganado', label: 'Registrar / Ajustar Ganado' },
    { clave: 'ver_finanzas', label: 'Ver Finanzas (USD / UYU)' },
    { clave: 'editar_finanzas', label: 'Registrar Ingresos / Egresos' },
    { clave: 'ver_estancias', label: 'Ver Establecimientos y Campos' },
    { clave: 'editar_estancias', label: 'Crear / Editar Establecimientos' },
    { clave: 'administrar_usuarios', label: 'Administrar Usuarios y Roles' },
  ];

  return {
    esAdmin,
    usuarios,
    matrizPermisos,
    cargandoApi,
    errorApi,
    cargarListaUsuarios,
    handleCambiarRol,
    toggleEstadoUsuario,
    togglePermisoRol,
    listaPermisosLabel,
    mostrarToast,
  };
};
