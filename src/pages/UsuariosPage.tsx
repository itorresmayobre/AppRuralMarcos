import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { useEstanciasStore } from '../stores/useEstanciasStore';
import { useRecibosSueldoStore } from '../stores/useRecibosSueldoStore';
import { useUsuariosStore } from '../stores/useUsuariosStore';
import { useUsuariosLista } from '../hooks/usuarios/useUsuariosLista';
import { useCrearEmpleadoForm } from '../hooks/usuarios/useCrearEmpleadoForm';
import { useCambiarPasswordForm } from '../hooks/usuarios/useCambiarPasswordForm';
import { CustomSelect } from '../components/ui/CustomSelect';
import type { UserRole } from '../types';
import { 
  Users, ShieldCheck, KeyRound, UserPlus, Lock, X, 
  Sparkles, Loader2, RefreshCw, AlertTriangle, User, MapPin, Check, 
  Building2, Crown, ShieldAlert, ToggleLeft, ToggleRight, FileText, ExternalLink
} from 'lucide-react';

export const UsuariosPage: React.FC = () => {
  const { usuario } = useAuthStore();
  const { estancias } = useEstanciasStore();
  const { recibos } = useRecibosSueldoStore();

  useEffect(() => {
    if (!useUsuariosStore.getState().inicializado) {
      useUsuariosStore.getState().cargarUsuariosDesdeSupabase();
    }
  }, []);

  // 1. Hook para lista de empleados y matriz de permisos
  const lista = useUsuariosLista();

  // 2. Hook exclusivo para el modal de alta de empleados
  const alta = useCrearEmpleadoForm();

  // 3. Hook exclusivo para la pestaña de cambio de contraseña
  const pass = useCambiarPasswordForm();

  // Estado local para pestaña activa
  const [pestanaActiva, setPestanaActiva] = useState<'MI_CUENTA' | 'EMPLEADOS' | 'PERMISOS_MATRIZ' | 'RECIBOS'>('EMPLEADOS');

  // Filtrar recibos según el rol del usuario conectado
  const misRecibos = lista.esAdmin
    ? recibos
    : recibos.filter((r) => r.usuario_id === usuario?.id || r.usuario_nombre?.includes(usuario?.nombre || ''));

  return (
    <section aria-label="Administración de Usuarios y Permisos" className="space-y-3">
      
      {/* Encabezado */}
      <header className="app-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>Usuarios, Seguridad & Roles</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Gestión de empleados de la empresa, recibos de sueldo y matriz de accesos.
          </p>
        </div>

        {lista.esAdmin && (
          <button
            onClick={() => alta.setMostrarModalAlta(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-3.5 py-2 rounded-lg shadow-sm active:scale-95 transition-all min-h-[36px] cursor-pointer"
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
          👥 Lista de Empleados ({lista.usuarios.length})
        </button>

        <button
          onClick={() => setPestanaActiva('RECIBOS')}
          className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 min-h-[40px] cursor-pointer hover:shadow-sm ${
            pestanaActiva === 'RECIBOS'
              ? 'bg-emerald-700 text-white shadow-md shadow-emerald-950/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
          }`}
        >
          📄 Recibos de Sueldo ({misRecibos.length})
        </button>

        {lista.esAdmin && (
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
      {lista.errorApi && (
        <article className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between text-rose-900 text-xs shadow-sm">
          <div className="flex items-center space-x-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{lista.errorApi}</span>
          </div>
          <button
            onClick={lista.cargarListaUsuarios}
            className="inline-flex items-center space-x-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-sm cursor-pointer transition-all active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reintentar</span>
          </button>
        </article>
      )}

      {/* TAB 1: LISTA DE EMPLEADOS Y ROLES CON MÚLTIPLES ESTANCIAS */}
      {pestanaActiva === 'EMPLEADOS' && (
        <section aria-label="Directorio de Empleados" className="space-y-4">
          {lista.cargandoApi ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm text-center space-y-3">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-medium">Sincronizando empleados con el servidor Supabase...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lista.usuarios.map((u) => {
                const tieneTodas = u.estancias_asignadas_ids?.includes('TODAS');
                const estanciasNombres = tieneTodas
                  ? ['Acceso Total a Todos los Establecimientos']
                  : estancias
                      .filter(e => u.estancias_asignadas_ids?.includes(e.id))
                      .map(e => e.nombre);

                return (
                  <article key={u.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3 shadow-sm hover:shadow-md transition-shadow relative">
                    <header className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                          <span>{u.nombre} {u.apellido}</span>
                          {u.rol === 'PROPIETARIO' && (
                            <span title="Propietario Inamovible de la Empresa">
                              <Crown className="w-4 h-4 text-amber-500 fill-amber-400" />
                            </span>
                          )}
                        </h3>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">{u.email}</p>
                        <p className="text-[11px] font-bold text-emerald-700 font-mono mt-1 flex items-center gap-1">
                          <User className="w-3 h-3 text-emerald-600" /> Usuario: {u.username || `${u.nombre.toLowerCase()}.${u.apellido.toLowerCase()}`}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-1.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase flex items-center gap-1 ${
                          u.rol === 'PROPIETARIO'
                            ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs'
                            : u.rol === 'SUPERADMIN'
                            ? 'bg-purple-700 text-white shadow-xs'
                            : u.rol === 'ADMIN'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                            : u.rol === 'CONTADOR'
                            ? 'bg-blue-100 text-blue-900 border border-blue-200'
                            : u.rol === 'CAPATAZ'
                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                            : 'bg-slate-100 text-slate-800'
                        }`}>
                          {u.rol === 'PROPIETARIO' && <Crown className="w-3 h-3" />}
                          {u.rol === 'SUPERADMIN' && <ShieldAlert className="w-3 h-3" />}
                          <span>{u.rol}</span>
                        </span>

                        {/* Botón Toggle Estado Activo / Inactivo */}
                        {lista.esAdmin && (
                          <button
                            onClick={() => {
                              if (u.rol === 'PROPIETARIO' || u.rol === 'SUPERADMIN') {
                                lista.mostrarToast('Protección de Propietario', 'El Propietario de la empresa no puede ser desactivado.', 'ADVERTENCIA');
                                return;
                              }
                              lista.toggleEstadoUsuario(u.id);
                              lista.mostrarToast('Estado Actualizado', `Usuario ${u.nombre} ${u.activo ? 'desactivado' : 'activado'}.`, 'INFO');
                            }}
                            disabled={u.rol === 'PROPIETARIO' || u.rol === 'SUPERADMIN'}
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md transition-all ${
                              u.activo !== false
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                            } ${u.rol === 'PROPIETARIO' || u.rol === 'SUPERADMIN' ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                            title={u.rol === 'PROPIETARIO' ? 'Propietario Inamovible' : 'Cambiar Estado'}
                          >
                            {u.activo !== false ? (
                              <>
                                <ToggleRight className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Activo</span>
                              </>
                            ) : (
                              <>
                                <ToggleLeft className="w-3.5 h-3.5 text-slate-400" />
                                <span>Inactivo</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </header>

                    {/* Establecimientos Asignados (Multi-Campo Badges) */}
                    <footer className="pt-2 border-t border-slate-100 text-xs space-y-1.5">
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Establecimientos / Campos Asignados:</p>
                      <div className="flex flex-wrap gap-1">
                        {estanciasNombres.map((nombreEst, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 text-[10px] font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md border border-slate-200">
                            <MapPin className="w-3 h-3 text-emerald-600" />
                            <span>{nombreEst}</span>
                          </span>
                        ))}
                      </div>
                    </footer>

                    {lista.esAdmin && (
                      <div className="pt-3 border-t border-slate-100">
                        {u.rol === 'PROPIETARIO' || u.rol === 'SUPERADMIN' ? (
                          <div className="flex items-center justify-between bg-amber-50/80 border border-amber-200/90 text-amber-900 px-3 py-2 rounded-xl text-xs font-extrabold">
                            <div className="flex items-center gap-1.5">
                              <Crown className="w-4 h-4 text-amber-600" />
                              <span>PROPIETARIO (Inamovible)</span>
                            </div>
                            <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-md uppercase font-black">Protegido</span>
                          </div>
                        ) : (
                          <CustomSelect<UserRole>
                            label="Cambiar Rol:"
                            value={u.rol}
                            options={[
                              { value: 'ADMIN', label: 'ADMIN (Administrador)' },
                              { value: 'CAPATAZ', label: 'CAPATAZ (Campo)' },
                              { value: 'CONTADOR', label: 'CONTADOR (Finanzas)' },
                              { value: 'OPERARIO', label: 'OPERARIO (Básico)' },
                            ]}
                            onChange={(nuevoRol) => lista.handleCambiarRol(u.id, nuevoRol)}
                          />
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* TAB 2: RECIBOS DE SUELDO DEL PERSONAL */}
      {pestanaActiva === 'RECIBOS' && (
        <section aria-label="Recibos de Sueldo del Personal" className="space-y-4">
          <header className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <span>Mis Recibos de Sueldo y Liquidaciones de Haberes</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Comprobantes oficiales de sueldo abonados por la empresa
              </p>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {misRecibos.length > 0 ? (
              misRecibos.map((r) => (
                <article key={r.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3 shadow-sm hover:shadow-md transition-shadow">
                  <header className="flex items-start justify-between border-b border-slate-100 pb-2.5">
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">{r.periodo_mes}</h4>
                      <p className="text-xs font-bold text-emerald-700 mt-0.5">{r.usuario_nombre || 'Empleado'}</p>
                    </div>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase ${
                      r.estado_firma === 'FIRMADO'
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                        : 'bg-amber-100 text-amber-900 border border-amber-200'
                    }`}>
                      {r.estado_firma}
                    </span>
                  </header>

                  <div className="space-y-1 text-xs">
                    <p className="text-slate-600">
                      Monto Líquido: <strong className="text-slate-900 font-black">{r.moneda} {r.monto_liquido.toLocaleString('es-UY')}</strong>
                    </p>
                    <p className="text-slate-500 text-[11px]">Fecha de Pago: {r.fecha_pago}</p>
                    {r.observaciones && (
                      <p className="text-slate-500 text-[11px] italic mt-1 bg-slate-50 p-2 rounded-lg border border-slate-200">{r.observaciones}</p>
                    )}
                  </div>

                  <footer className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <a
                      href={r.recibo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Ver Recibo en Storage</span>
                    </a>
                  </footer>
                </article>
              ))
            ) : (
              <div className="col-span-full bg-white p-8 rounded-2xl border border-slate-200/80 text-center text-slate-500 text-xs font-medium">
                No tienes recibos de sueldo registrados hasta el momento.
              </div>
            )}
          </div>
        </section>
      )}

      {/* TAB 3: MATRIZ CONFIGURABLE DE PERMISOS POR ROL */}
      {pestanaActiva === 'PERMISOS_MATRIZ' && lista.esAdmin && (
        <article className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm space-y-4">
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
                  <th className="py-3 px-4 text-center">PROPIETARIO</th>
                  <th className="py-3 px-4 text-center">ADMIN</th>
                  <th className="py-3 px-4 text-center">CAPATAZ</th>
                  <th className="py-3 px-4 text-center">CONTADOR</th>
                  <th className="py-3 px-4 text-center">OPERARIO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold">
                {lista.listaPermisosLabel.map((permiso) => (
                  <tr key={permiso.clave} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-slate-800 font-extrabold">{permiso.label}</td>
                    {(['PROPIETARIO', 'ADMIN', 'CAPATAZ', 'CONTADOR', 'OPERARIO'] as const).map((rol) => {
                      const tienePermiso = lista.matrizPermisos[rol]?.[permiso.clave];
                      return (
                        <td key={rol} className="py-3 px-4 text-center">
                          <button
                            onClick={() => {
                              lista.togglePermisoRol(rol, permiso.clave);
                              lista.mostrarToast('Permiso Actualizado', `Permiso '${permiso.label}' modificado para rol ${rol}.`, 'INFO');
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
        </article>
      )}

      {/* TAB 4: MI CUENTA Y CAMBIO DE CONTRASEÑA */}
      {pestanaActiva === 'MI_CUENTA' && (
        <article className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 max-w-lg shadow-sm space-y-6">
          <header className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-emerald-600" />
              <span>Cambiar Mi Contraseña</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Actualiza tu clave de acceso para mayor seguridad.
            </p>
          </header>

          <form onSubmit={pass.handleCambiarContrasenia} className="space-y-4 text-xs">

            <fieldset className="space-y-1 border-0 p-0 m-0">
              <label htmlFor="pass-nueva" className="font-bold text-slate-700 block">Nueva Contraseña</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="pass-nueva"
                  type="password"
                  required
                  value={pass.passNueva}
                  onChange={(e) => pass.setPassNueva(e.target.value)}
                  placeholder="Nueva clave secreta"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[44px]"
                />
              </div>
            </fieldset>

            <fieldset className="space-y-1 border-0 p-0 m-0">
              <label htmlFor="pass-confirmar" className="font-bold text-slate-700 block">Confirmar Nueva Contraseña</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="pass-confirmar"
                  type="password"
                  required
                  value={pass.passConfirmar}
                  onChange={(e) => pass.setPassConfirmar(e.target.value)}
                  placeholder="Repetir nueva clave"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[44px]"
                />
              </div>
            </fieldset>

            <button
              type="submit"
              disabled={pass.cargandoPass}
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold py-3.5 rounded-xl shadow-md hover:shadow-lg active:scale-98 transition-all duration-200 text-xs min-h-[44px] flex items-center justify-center space-x-2 cursor-pointer"
            >
              {pass.cargandoPass ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sincronizando contraseña...</span>
                </>
              ) : (
                <span>Actualizar Contraseña</span>
              )}
            </button>
          </form>
        </article>
      )}

      {/* MODAL CREAR EMPLEADO CON SELECCIÓN MÚLTIPLE DE ESTANCIAS */}
      {alta.mostrarModalAlta && (
        <section aria-label="Modal Alta Empleado" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <article className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <header className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Registrar Nuevo Empleado</h3>
                <p className="text-xs text-slate-500">Alta de usuario para acceso al sistema de campo</p>
              </div>
              <button 
                onClick={() => alta.setMostrarModalAlta(false)} 
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            <form onSubmit={alta.handleCrearEmpleado} className="space-y-4 text-xs">
              
              {/* Nombre y Apellido */}
              <fieldset className="grid grid-cols-2 gap-3 border-0 p-0 m-0">
                <legend className="sr-only">Nombre Completo del Empleado</legend>
                <div className="space-y-1">
                  <label htmlFor="nombre-emp" className="font-bold text-slate-700">Nombre</label>
                  <input
                    id="nombre-emp"
                    type="text"
                    required
                    placeholder="Ej. Roberto"
                    value={alta.nombre}
                    onChange={(e) => alta.setNombre(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[42px]"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="apellido-emp" className="font-bold text-slate-700">Apellido</label>
                  <input
                    id="apellido-emp"
                    type="text"
                    required
                    placeholder="Ej. Martínez"
                    value={alta.apellido}
                    onChange={(e) => alta.setApellido(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[42px]"
                  />
                </div>
              </fieldset>

              {/* Previsualización del Usuario Generado */}
              <output className="bg-emerald-50 border border-emerald-200/90 rounded-xl p-3 flex items-center justify-between text-emerald-950 block">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span className="text-xs font-medium">Nombre de Usuario Generado:</span>
                </div>
                <span className="font-mono font-extrabold text-emerald-800 bg-white px-2.5 py-1 rounded-lg border border-emerald-300">
                  {alta.usernameGeneradoPreview}
                </span>
              </output>

              {/* Correo Electrónico */}
              <fieldset className="space-y-1 border-0 p-0 m-0">
                <label htmlFor="email-emp" className="font-bold text-slate-700">Correo Electrónico</label>
                <input
                  id="email-emp"
                  type="email"
                  required
                  placeholder="empleado@estancia.com"
                  value={alta.email}
                  onChange={(e) => alta.setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[42px]"
                />
              </fieldset>

              {/* Selector Estilizado de Rol */}
              <fieldset className="space-y-1.5 border-0 p-0 m-0">
                <legend className="font-bold text-slate-700 block mb-1">Seleccionar Rol Asignado</legend>
                <div className="grid grid-cols-2 gap-2">
                  {alta.opcionesRolesForm.map((item) => {
                    const Icono = item.icono;
                    const esSeleccionado = alta.rolForm === item.rol;
                    return (
                      <button
                        key={item.rol}
                        type="button"
                        onClick={() => alta.setRolForm(item.rol)}
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
              </fieldset>

              {/* Selector Estilizado de Múltiples Establecimientos / Campos */}
              <fieldset className="space-y-1.5 border-0 p-0 m-0">
                <div className="flex items-center justify-between mb-1">
                  <legend className="font-bold text-slate-700 block">Asignar a Establecimientos / Campos (Multiselección)</legend>
                  <span className="text-[10px] text-slate-400 font-medium">Puedes elegir varias</span>
                </div>

                <div className="space-y-1.5">
                  {/* Opción Consolidado */}
                  <button
                    type="button"
                    onClick={() => alta.handleToggleEstanciaForm('TODAS')}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all duration-200 cursor-pointer active:scale-98 ${
                      alta.estanciasSeleccionadasForm.includes('TODAS')
                        ? 'bg-emerald-950 text-white border-emerald-600 shadow-sm'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Building2 className={`w-4 h-4 ${alta.estanciasSeleccionadasForm.includes('TODAS') ? 'text-emerald-400' : 'text-slate-400'}`} />
                      <div>
                        <p className="font-bold text-xs">Acceso Total a Todos los Establecimientos</p>
                        <p className={`text-[10px] ${alta.estanciasSeleccionadasForm.includes('TODAS') ? 'text-slate-300' : 'text-slate-500'}`}>
                          El empleado podrá visualizar y trabajar en cualquier campo de la empresa
                        </p>
                      </div>
                    </div>
                    {alta.estanciasSeleccionadasForm.includes('TODAS') && <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                  </button>

                  {/* Lista de Establecimientos Individuales */}
                  {estancias.map((est) => {
                    const esSeleccionada = alta.estanciasSeleccionadasForm.includes(est.id);
                    return (
                      <button
                        key={est.id}
                        type="button"
                        onClick={() => alta.handleToggleEstanciaForm(est.id)}
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
              </fieldset>

              {/* Botón de Enviar */}
              <button
                type="submit"
                disabled={alta.cargandoAltaEmpleado}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-extrabold py-3.5 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-98 transition-all duration-200 text-xs min-h-[46px] flex items-center justify-center space-x-2 cursor-pointer mt-2"
              >
                {alta.cargandoAltaEmpleado ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Guardando en Supabase...</span>
                  </>
                ) : (
                  <span>Crear Empleado y Asignar Establecimientos</span>
                )}
              </button>
            </form>
          </article>
        </section>
      )}

    </section>
  );
};
