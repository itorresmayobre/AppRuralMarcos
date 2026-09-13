import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { useUsuariosStore } from '../stores/useUsuariosStore';
import { useEstanciasStore } from '../stores/useEstanciasStore';
import { useToastStore } from '../stores/useToastStore';
import { usuariosService } from '../services/api/usuariosService';
import type { UserRole, PermisoRol } from '../types';
import { 
  Users, ShieldCheck, KeyRound, UserPlus, Lock, X, 
  Sparkles, Loader2, RefreshCw, AlertTriangle, User, MapPin, Check, 
  UserCheck, Tractor, DollarSign, HardHat, Building2 
} from 'lucide-react';

export const UsuariosPage: React.FC = () => {
  const { usuario } = useAuthStore();
  const { usuarios, matrizPermisos, crearUsuario, actualizarRolUsuario, togglePermisoRol } = useUsuariosStore();
  const { estancias } = useEstanciasStore();
  const { mostrarToast } = useToastStore();

  const esAdmin = usuario?.rol === 'ADMIN';
  const [pestanaActiva, setPestanaActiva] = useState<'MI_CUENTA' | 'EMPLEADOS' | 'PERMISOS_MATRIZ'>('EMPLEADOS');

  // Estados Asíncronos (Carga y Errores API)
  const [cargandoApi, setCargandoApi] = useState(false);
  const [errorApi, setErrorApi] = useState<string | null>(null);

  // Estado Formulario Cambio de Contraseña
  const [passActual, setPassActual] = useState('');
  const [passNueva, setPassNueva] = useState('');
  const [passConfirmar, setPassConfirmar] = useState('');
  const [cargandoPass, setCargandoPass] = useState(false);

  // Estado Formulario Alta de Empleado (Modal) con Selección Múltiple de Estancias
  const [mostrarModalAlta, setMostrarModalAlta] = useState(false);
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [rolForm, setRolForm] = useState<UserRole>('CAPATAZ');
  const [estanciasSeleccionadasForm, setEstanciasSeleccionadasForm] = useState<string[]>(['est-1']);
  const [cargandoAltaEmpleado, setCargandoAltaEmpleado] = useState(false);

  // Generación limpia en tiempo real del username (nombre.apellido)
  const usernameGeneradoPreview = (nombre || apellido)
    ? `${nombre.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '')}.${apellido.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '')}`
    : 'nombre.apellido';

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

  const handleToggleEstanciaForm = (estanciaId: string) => {
    if (estanciaId === 'TODAS') {
      setEstanciasSeleccionadasForm(['TODAS']);
      return;
    }

    let nuevas = estanciasSeleccionadasForm.filter(id => id !== 'TODAS');
    if (nuevas.includes(estanciaId)) {
      nuevas = nuevas.filter(id => id !== estanciaId);
    } else {
      nuevas.push(estanciaId);
    }

    if (nuevas.length === 0) {
      nuevas = ['TODAS'];
    }

    setEstanciasSeleccionadasForm(nuevas);
  };

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

  const handleCrearEmpleado = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !email) return;

    setCargandoAltaEmpleado(true);
    try {
      const nuevoEmpleado = await usuariosService.crearUsuarioEmpleado(
        {
          nombre,
          apellido,
          email,
          rol: rolForm,
          estancias_asignadas_ids: estanciasSeleccionadasForm,
        },
        usuarios
      );

      crearUsuario({
        nombre: nuevoEmpleado.nombre,
        apellido: nuevoEmpleado.apellido,
        email: nuevoEmpleado.email,
        rol: nuevoEmpleado.rol,
        estancias_asignadas_ids: nuevoEmpleado.estancias_asignadas_ids,
      });

      setCargandoAltaEmpleado(false);
      setMostrarModalAlta(false);
      setNombre('');
      setApellido('');
      setEmail('');

      mostrarToast(
        '¡Empleado Registrado!',
        `Usuario generado: ${nuevoEmpleado.username} asignado a ${nuevoEmpleado.estancias_asignadas_ids.length} campo(s).`,
        'EXITO'
      );
    } catch (err: unknown) {
      setCargandoAltaEmpleado(false);
      const mensaje = err instanceof Error ? err.message : 'Error al registrar el empleado';
      mostrarToast('Error al Guardar Empleado', mensaje, 'ERROR');
    }
  };

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
    { clave: 'ver_estancias', label: 'Ver Estancias y Campos' },
    { clave: 'editar_estancias', label: 'Crear / Editar Estancias' },
    { clave: 'administrar_usuarios', label: 'Administrar Usuarios y Roles' },
  ];

  const opcionesRolesForm: { rol: UserRole; titulo: string; icono: React.ElementType; color: string }[] = [
    { rol: 'ADMIN', titulo: 'Admin / Propietario', icono: UserCheck, color: 'border-emerald-500 bg-emerald-50 text-emerald-900' },
    { rol: 'CAPATAZ', titulo: 'Capataz de Campo', icono: Tractor, color: 'border-amber-500 bg-amber-50 text-amber-900' },
    { rol: 'CONTADOR', titulo: 'Contador / Asesor', icono: DollarSign, color: 'border-blue-500 bg-blue-50 text-blue-900' },
    { rol: 'OPERARIO', titulo: 'Operario de Campo', icono: HardHat, color: 'border-slate-400 bg-slate-100 text-slate-900' },
  ];

  return (
    <section aria-label="Administración de Usuarios y Permisos" className="space-y-6">
      
      {/* Encabezado */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600 flex-shrink-0" />
            <span>Usuarios, Seguridad & Roles</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Gestión de empleados de la estancia, asignación a múltiples campos y matriz de accesos.
          </p>
        </div>

        {esAdmin && (
          <button
            onClick={() => setMostrarModalAlta(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-extrabold text-xs px-4 py-3 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all duration-200 min-h-[44px] cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Crear Usuario Empleado</span>
          </button>
        )}
      </header>

      {/* Pestañas de Navegación */}
      <nav aria-label="Pestañas de Seguridad" className="flex space-x-2 border-b border-slate-200/80 pb-2 overflow-x-auto">
        <button
          onClick={() => setPestanaActiva('EMPLEADOS')}
          className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 min-h-[40px] cursor-pointer hover:shadow-sm ${
            pestanaActiva === 'EMPLEADOS'
              ? 'bg-emerald-700 text-white shadow-md shadow-emerald-950/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
          }`}
        >
          👥 Lista de Empleados ({usuarios.length})
        </button>

        {esAdmin && (
          <button
            onClick={() => setPestanaActiva('PERMISOS_MATRIZ')}
            className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 min-h-[40px] cursor-pointer hover:shadow-sm ${
              pestanaActiva === 'PERMISOS_MATRIZ'
                ? 'bg-emerald-700 text-white shadow-md shadow-emerald-950/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
            }`}
          >
            🛡️ Matriz de Permisos por Rol
          </button>
        )}

        <button
          onClick={() => setPestanaActiva('MI_CUENTA')}
          className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 min-h-[40px] cursor-pointer hover:shadow-sm ${
            pestanaActiva === 'MI_CUENTA'
              ? 'bg-emerald-700 text-white shadow-md shadow-emerald-950/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
          }`}
        >
          🔐 Mi Cuenta & Contraseña
        </button>
      </nav>

      {/* MANEJO DE ERRORES API Y REINTENTO */}
      {errorApi && (
        <article className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between text-rose-900 text-xs shadow-sm">
          <div className="flex items-center space-x-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{errorApi}</span>
          </div>
          <button
            onClick={cargarListaUsuarios}
            className="inline-flex items-center space-x-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-sm cursor-pointer transition-all active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reintentar</span>
          </button>
        </article>
      )}

      {/* TAB 1: LISTA DE EMPLEADOS Y ROLES CON MÚLTIPLES ESTANCIAS */}
      {pestanaActiva === 'EMPLEADOS' && (
        <div className="space-y-4">
          {cargandoApi ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm text-center space-y-3">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-medium">Sincronizando empleados con el servidor Supabase...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {usuarios.map((u) => {
                const tieneTodas = u.estancias_asignadas_ids?.includes('TODAS');
                const estanciasNombres = tieneTodas
                  ? ['Acceso Total a Todas las Estancias']
                  : estancias
                      .filter(e => u.estancias_asignadas_ids?.includes(e.id))
                      .map(e => e.nombre);

                return (
                  <article key={u.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900">{u.nombre} {u.apellido}</h3>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">{u.email}</p>
                        <p className="text-[11px] font-bold text-emerald-700 font-mono mt-1 flex items-center gap-1">
                          <User className="w-3 h-3 text-emerald-600" /> Usuario: {u.username || `${u.nombre.toLowerCase()}.${u.apellido.toLowerCase()}`}
                        </p>
                      </div>

                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase ${
                        u.rol === 'ADMIN'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                          : u.rol === 'CONTADOR'
                          ? 'bg-blue-100 text-blue-900 border border-blue-200'
                          : u.rol === 'CAPATAZ'
                          ? 'bg-amber-100 text-amber-900 border border-amber-200'
                          : 'bg-slate-100 text-slate-800'
                      }`}>
                        {u.rol}
                      </span>
                    </div>

                    {/* Estancias Asignadas (Multi-Campo Badges) */}
                    <div className="pt-2 border-t border-slate-100 text-xs space-y-1.5">
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Estancias / Campos Asignados:</p>
                      <div className="flex flex-wrap gap-1">
                        {estanciasNombres.map((nombreEst, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 text-[10px] font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md border border-slate-200">
                            <MapPin className="w-3 h-3 text-emerald-600" />
                            <span>{nombreEst}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {esAdmin && (
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Cambiar Rol:</label>
                        <select
                          value={u.rol}
                          onChange={(e) => handleCambiarRol(u.id, e.target.value as UserRole)}
                          className="bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer transition-colors"
                        >
                          <option value="ADMIN">ADMIN</option>
                          <option value="CAPATAZ">CAPATAZ</option>
                          <option value="CONTADOR">CONTADOR</option>
                          <option value="OPERARIO">OPERARIO</option>
                        </select>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MATRIZ CONFIGURABLE DE PERMISOS POR ROL */}
      {pestanaActiva === 'PERMISOS_MATRIZ' && esAdmin && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm space-y-4">
          <header className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Configuración de Permisos por Rol</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Haz clic en cualquier casilla para activar o desactivar lo que cada rol puede ver en la aplicación.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
              <Sparkles className="w-3.5 h-3.5" /> Edición en Tiempo Real
            </span>
          </header>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-xs uppercase font-extrabold border-b border-slate-200">
                  <th className="py-3 px-4">Acción / Permiso del Sistema</th>
                  <th className="py-3 px-4 text-center">ADMIN</th>
                  <th className="py-3 px-4 text-center">CAPATAZ</th>
                  <th className="py-3 px-4 text-center">CONTADOR</th>
                  <th className="py-3 px-4 text-center">OPERARIO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold">
                {listaPermisosLabel.map((permiso) => (
                  <tr key={permiso.clave} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-slate-800 font-extrabold">{permiso.label}</td>
                    {(['ADMIN', 'CAPATAZ', 'CONTADOR', 'OPERARIO'] as const).map((rol) => {
                      const tienePermiso = matrizPermisos[rol][permiso.clave];
                      return (
                        <td key={rol} className="py-3 px-4 text-center">
                          <button
                            onClick={() => {
                              togglePermisoRol(rol, permiso.clave);
                              mostrarToast('Permiso Actualizado', `Permiso '${permiso.label}' modificado para rol ${rol}.`, 'INFO');
                            }}
                            className={`w-8 h-8 rounded-xl inline-flex items-center justify-center transition-all duration-150 cursor-pointer active:scale-95 ${
                              tienePermiso
                                ? 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700'
                                : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                            }`}
                          >
                            {tienePermiso ? '✓' : '✕'}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: MI CUENTA Y CAMBIO DE CONTRASEÑA */}
      {pestanaActiva === 'MI_CUENTA' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 max-w-lg shadow-sm space-y-6">
          <header className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-emerald-600" />
              <span>Cambiar Mi Contraseña</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Actualiza tu clave de acceso para mayor seguridad.
            </p>
          </header>

          <form onSubmit={handleCambiarContrasenia} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Contraseña Actual</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={passActual}
                  onChange={(e) => setPassActual(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[44px]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Nueva Contraseña</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={passNueva}
                  onChange={(e) => setPassNueva(e.target.value)}
                  placeholder="Nueva clave secreta"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[44px]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Confirmar Nueva Contraseña</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={passConfirmar}
                  onChange={(e) => setPassConfirmar(e.target.value)}
                  placeholder="Repetir nueva clave"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[44px]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={cargandoPass}
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold py-3.5 rounded-xl shadow-md hover:shadow-lg active:scale-98 transition-all duration-200 text-xs min-h-[44px] flex items-center justify-center space-x-2 cursor-pointer"
            >
              {cargandoPass ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sincronizando contraseña...</span>
                </>
              ) : (
                <span>Actualizar Contraseña</span>
              )}
            </button>
          </form>
        </div>
      )}

      {/* MODAL CREAR EMPLEADO CON SELECCIÓN MÚLTIPLE DE ESTANCIAS */}
      {mostrarModalAlta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Registrar Nuevo Empleado</h3>
                <p className="text-xs text-slate-500">Alta de usuario para acceso al sistema de campo</p>
              </div>
              <button 
                onClick={() => setMostrarModalAlta(false)} 
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearEmpleado} className="space-y-4 text-xs">
              
              {/* Nombre y Apellido */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Nombre</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Roberto"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[42px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Apellido</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Martínez"
                    value={apellido}
                    onChange={(e) => setApellido(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[42px]"
                  />
                </div>
              </div>

              {/* Previsualización del Usuario Generado */}
              <div className="bg-emerald-50 border border-emerald-200/90 rounded-xl p-3 flex items-center justify-between text-emerald-950">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span className="text-xs font-medium">Nombre de Usuario Generado:</span>
                </div>
                <span className="font-mono font-extrabold text-emerald-800 bg-white px-2.5 py-1 rounded-lg border border-emerald-300">
                  {usernameGeneradoPreview}
                </span>
              </div>

              {/* Correo Electrónico */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  placeholder="empleado@estancia.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[42px]"
                />
              </div>

              {/* Selector Estilizado de Rol */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Seleccionar Rol Asignado</label>
                <div className="grid grid-cols-2 gap-2">
                  {opcionesRolesForm.map((item) => {
                    const Icono = item.icono;
                    const esSeleccionado = rolForm === item.rol;
                    return (
                      <button
                        key={item.rol}
                        type="button"
                        onClick={() => setRolForm(item.rol)}
                        className={`p-2.5 rounded-xl border text-left flex items-center space-x-2.5 transition-all duration-200 cursor-pointer active:scale-98 ${
                          esSeleccionado
                            ? `${item.color} shadow-sm ring-2 ring-emerald-500/20`
                            : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div className="p-1.5 rounded-lg bg-white shadow-sm flex-shrink-0">
                          <Icono className="w-4 h-4 text-slate-700" />
                        </div>
                        <div className="truncate flex-1">
                          <p className="font-extrabold text-[11px] leading-tight truncate">{item.titulo}</p>
                        </div>
                        {esSeleccionado && <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selector Estilizado de Múltiples Estancias / Campos */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 block">Asignar a Estancias / Campos (Multiselección)</label>
                  <span className="text-[10px] text-slate-400 font-medium">Puedes elegir varias</span>
                </div>

                <div className="space-y-1.5">
                  {/* Opción Consolidado */}
                  <button
                    type="button"
                    onClick={() => handleToggleEstanciaForm('TODAS')}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all duration-200 cursor-pointer active:scale-98 ${
                      estanciasSeleccionadasForm.includes('TODAS')
                        ? 'bg-emerald-950 text-white border-emerald-600 shadow-sm'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Building2 className={`w-4 h-4 ${estanciasSeleccionadasForm.includes('TODAS') ? 'text-emerald-400' : 'text-slate-400'}`} />
                      <div>
                        <p className="font-bold text-xs">Acceso Total a Todas las Estancias</p>
                        <p className={`text-[10px] ${estanciasSeleccionadasForm.includes('TODAS') ? 'text-slate-300' : 'text-slate-500'}`}>
                          El empleado podrá visualizar y trabajar en cualquier campo de la empresa
                        </p>
                      </div>
                    </div>
                    {estanciasSeleccionadasForm.includes('TODAS') && <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                  </button>

                  {/* Lista de Estancias Individuales */}
                  {estancias.map((est) => {
                    const esSeleccionada = estanciasSeleccionadasForm.includes(est.id);
                    return (
                      <button
                        key={est.id}
                        type="button"
                        onClick={() => handleToggleEstanciaForm(est.id)}
                        className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all duration-200 cursor-pointer active:scale-98 ${
                          esSeleccionada
                            ? 'bg-emerald-900 text-white border-emerald-500 shadow-sm'
                            : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <MapPin className={`w-4 h-4 ${esSeleccionada ? 'text-emerald-300' : 'text-slate-400'}`} />
                          <div>
                            <p className="font-bold text-xs">{est.nombre}</p>
                            <p className={`text-[10px] ${esSeleccionada ? 'text-slate-300' : 'text-slate-500'}`}>
                              {est.departamento} • DICOSE {est.dicose} • {est.hectareas_totales} Ha
                            </p>
                          </div>
                        </div>
                        {esSeleccionada && <Check className="w-4 h-4 text-emerald-300 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Botón de Enviar */}
              <button
                type="submit"
                disabled={cargandoAltaEmpleado}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-extrabold py-3.5 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-98 transition-all duration-200 text-xs min-h-[46px] flex items-center justify-center space-x-2 cursor-pointer mt-2"
              >
                {cargandoAltaEmpleado ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Guardando en Supabase...</span>
                  </>
                ) : (
                  <span>Crear Empleado y Asignar Estancias</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

    </section>
  );
};
