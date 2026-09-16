import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useEmpresasStore } from '../../stores/useEmpresasStore';
import { useEstanciasStore } from '../../stores/useEstanciasStore';
import { useUsuariosStore } from '../../stores/useUsuariosStore';
import { useFinanzasStore } from '../../stores/useFinanzasStore';
import { useToastStore } from '../../stores/useToastStore';
import type { PlanSaaS } from '../../types';
import {
  Code,
  Building2,
  Users,
  MapPin,
  Check,
  X,
  ShieldAlert,
  Crown,
  DollarSign,
  TrendingUp,
  FileCheck2,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  RefreshCw
} from 'lucide-react';

export const DevConsoleView: React.FC = () => {
  const { usuario } = useAuthStore();
  const {
    empresas,
    solicitudesRegistro,
    cargarEmpresasDesdeSupabase,
    cargando,
    aprobarSolicitud,
    rechazarSolicitud,
    toggleEstadoEmpresa,
    cambiarPlanEmpresa
  } = useEmpresasStore();
  
  const { estancias } = useEstanciasStore();
  const { usuarios, vincularEmpresaAUsuario } = useUsuariosStore();
  const { transacciones } = useFinanzasStore();
  const { mostrarToast } = useToastStore();

  const currentRole = usuario?.rol || 'OPERARIO';
  const isSuperAdmin = currentRole === 'SUPERADMIN';

  const [tabActiva, setTabActiva] = useState<'DASHBOARD' | 'SOLICITUDES' | 'EMPRESAS'>('DASHBOARD');

  // Disparar consulta HTTP directa a Supabase al montar la consola o cambiar de pestaña
  useEffect(() => {
    if (isSuperAdmin) {
      cargarEmpresasDesdeSupabase();
    }
  }, [isSuperAdmin, tabActiva, cargarEmpresasDesdeSupabase]);

  if (!isSuperAdmin) {
    return (
      <main className="p-4 sm:p-6 max-w-lg mx-auto mt-6">
        <section aria-label="Acceso denegado a consola desarrollador" className="bg-amber-50 border border-amber-200/90 rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-sm">
          <ShieldAlert className="w-12 h-12 text-amber-600 mx-auto" />
          <h2 className="text-lg font-extrabold text-amber-950">Acceso Exclusivo a Consola Desarrollador</h2>
          <p className="text-xs text-amber-800 leading-relaxed">
            La Consola SaaS global de control de empresas y solicitudes está reservada para el rol de <strong>Desarrollador / SuperAdmin</strong>.
          </p>
          <p className="text-xs text-slate-500 font-medium">
            Selecciona el rol <strong>SUPERADMIN</strong> en la barra superior para acceder.
          </p>
        </section>
      </main>
    );
  }

  // Métricas Consolidadas Globales SaaS
  const totalHectareasPais = estancias.reduce((a, b) => a + b.hectareas_totales, 0);
  const totalEmpresasActivas = empresas.filter((e) => e.activa).length;
  const solicitudesPendientes = solicitudesRegistro.filter((s) => s.estado === 'PENDIENTE');

  const totalVolumenUSD = transacciones
    .filter((t) => t.moneda === 'USD')
    .reduce((a, b) => a + b.monto, 0);

  const handleAprobar = async (id: string, nombre: string, email: string, solicitanteNombre: string) => {
    const nuevaEmpresaId = await aprobarSolicitud(id);
    if (nuevaEmpresaId) {
      vincularEmpresaAUsuario(email, nuevaEmpresaId, solicitanteNombre);
    }
    mostrarToast('Empresa Aprobada y Vinculada', `Se dio de alta "${nombre}" y quedó asignada al usuario ${email}.`, 'EXITO');
  };

  const handleRechazar = (id: string, nombre: string) => {
    rechazarSolicitud(id);
    mostrarToast('Solicitud Rechazada', `Se rechazó la solicitud de "${nombre}".`, 'INFO');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner Consola Dev */}
      <header className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-5 sm:p-6 rounded-2xl border border-indigo-900/60 text-white shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-900/60 pb-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-indigo-500/30 flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>Modo Desarrollador & SuperAdmin SaaS</span>
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <Code className="w-6 h-6 text-indigo-400 flex-shrink-0" />
              <span>Consola Global de Control - AppRural Uruguay</span>
            </h2>
            <p className="text-xs text-slate-300 font-medium">
              Administración centralizada de empresas, solicitudes de alta, licencias SaaS y métricas consolidadas.
            </p>
          </div>

          {/* Badge Solicitudes Pendientes */}
          {solicitudesPendientes.length > 0 && (
            <div className="bg-amber-500/20 border border-amber-500/40 text-amber-300 px-3.5 py-2 rounded-xl text-xs font-black flex items-center space-x-2 self-start md:self-auto animate-pulse">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{solicitudesPendientes.length} Solicitudes de Alta Pendientes</span>
            </div>
          )}
        </div>

        {/* Tab Switcher de Consola + Botón Refrescar HTTP */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTabActiva('DASHBOARD')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center space-x-2 ${
                tabActiva === 'DASHBOARD'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-indigo-300" />
              <span>Dashboard Global SaaS</span>
            </button>

            <button
              type="button"
              onClick={() => setTabActiva('SOLICITUDES')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center space-x-2 relative ${
                tabActiva === 'SOLICITUDES'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileCheck2 className="w-4 h-4 text-indigo-300" />
              <span>Solicitudes de Registro ({solicitudesRegistro.length})</span>
              {solicitudesPendientes.length > 0 && (
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setTabActiva('EMPRESAS')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center space-x-2 ${
                tabActiva === 'EMPRESAS'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Building2 className="w-4 h-4 text-indigo-300" />
              <span>Empresas & Licencias ({empresas.length})</span>
            </button>
          </div>

          {/* Botón Refrescar HTTP a Supabase */}
          <button
            type="button"
            onClick={() => cargarEmpresasDesdeSupabase()}
            disabled={cargando}
            className="bg-slate-900/90 hover:bg-indigo-900/60 border border-indigo-700/50 text-indigo-300 hover:text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50 ml-auto flex-shrink-0"
            title="Refrescar solicitudes y empresas desde Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${cargando ? 'animate-spin text-indigo-400' : ''}`} />
            <span className="hidden sm:inline">{cargando ? 'Cargando...' : 'Refrescar Datos'}</span>
          </button>
        </div>
      </header>

      {/* VISTA 1: DASHBOARD GLOBAL SAAS */}
      {tabActiva === 'DASHBOARD' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Empresas Activas */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-extrabold text-slate-500">Empresas en Plataforma</span>
                <div className="p-2 bg-indigo-100 text-indigo-800 rounded-xl">
                  <Building2 className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900">{empresas.length} Empresas</p>
              <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md inline-block">
                {totalEmpresasActivas} Activas en Producción
              </span>
            </div>

            {/* KPI 2: Hectáreas Bajo Gestión */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-extrabold text-slate-500">Hectáreas Totales</span>
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <MapPin className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-emerald-800">
                {totalHectareasPais.toLocaleString('es-UY')} Ha
              </p>
              <span className="text-[10px] font-extrabold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md inline-block">
                En {estancias.length} Establecimientos Uruguay
              </span>
            </div>

            {/* KPI 3: Usuarios Activos */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-extrabold text-slate-500">Usuarios Registrados</span>
                <div className="p-2 bg-blue-100 text-blue-800 rounded-xl">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900">{usuarios.length} Usuarios</p>
              <span className="text-[10px] font-extrabold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-md inline-block">
                Admins, Capataces y Contadores
              </span>
            </div>

            {/* KPI 4: Volumen Transaccionado */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-extrabold text-slate-500">Volumen Operado</span>
                <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900">
                USD {totalVolumenUSD.toLocaleString('es-UY')}
              </p>
              <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md inline-block">
                {transacciones.length} Transacciones Registradas
              </span>
            </div>
          </div>
        </div>
      )}

      {/* VISTA 2: BANDEJA DE SOLICITUDES DE REGISTRO */}
      {tabActiva === 'SOLICITUDES' && (
        <section aria-label="Bandeja de Solicitudes de Alta" className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden space-y-3 p-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-indigo-600" />
                <span>Solicitudes de Registro Entrantes</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Productores y empresas agrarias que solicitaron alta en la plataforma.
              </p>
            </div>
            <span className="text-xs font-black text-indigo-900 bg-indigo-100 px-3 py-1 rounded-xl">
              {solicitudesRegistro.length} Solicitudes Registradas
            </span>
          </div>

          <div className="space-y-4">
            {solicitudesRegistro.map((sol) => (
              <div
                key={sol.id}
                className={`p-4 rounded-2xl border space-y-3 transition-all ${
                  sol.estado === 'PENDIENTE'
                    ? 'bg-amber-50/60 border-amber-200/90 shadow-2xs'
                    : sol.estado === 'APROBADA'
                    ? 'bg-emerald-50/40 border-emerald-200/80'
                    : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2.5">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-black text-slate-900">{sol.nombre_empresa}</h4>
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                        sol.estado === 'PENDIENTE'
                          ? 'bg-amber-200 text-amber-950 border border-amber-300'
                          : sol.estado === 'APROBADA'
                          ? 'bg-emerald-200 text-emerald-950 border border-emerald-300'
                          : 'bg-slate-300 text-slate-800'
                      }`}>
                        {sol.estado}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-mono">
                      RUT: {sol.rut} | Depto: <strong>{sol.departamento}</strong> | Solicitado: {sol.fecha_solicitud}
                    </p>
                  </div>

                  {sol.estado === 'PENDIENTE' && (
                    <div className="flex items-center space-x-2 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => handleAprobar(sol.id, sol.nombre_empresa, sol.solicitante_email, sol.solicitante_nombre)}
                        className="inline-flex items-center space-x-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl shadow-sm transition-all cursor-pointer min-h-[38px] active:scale-95"
                      >
                        <Check className="w-4 h-4" />
                        <span>Aprobar y Dar de Alta</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRechazar(sol.id, sol.nombre_empresa)}
                        className="inline-flex items-center space-x-1 text-slate-700 hover:text-rose-700 bg-white hover:bg-rose-50 border border-slate-300 hover:border-rose-300 font-bold text-xs px-3 py-2 rounded-xl transition-all cursor-pointer min-h-[38px]"
                      >
                        <X className="w-4 h-4" />
                        <span>Rechazar</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-medium text-slate-700">
                  <p><strong className="text-slate-900">Solicitante:</strong> {sol.solicitante_nombre}</p>
                  <p><strong className="text-slate-900">Email:</strong> {sol.solicitante_email}</p>
                  <p><strong className="text-slate-900">Teléfono:</strong> {sol.solicitante_telefono}</p>
                  <p><strong className="text-slate-900">Hectáreas Estimadas:</strong> {sol.hectareas_estimadas.toLocaleString('es-UY')} Ha</p>
                  <p><strong className="text-slate-900">Estancias Estimadas:</strong> {sol.estancias_estimadas} Campos</p>
                </div>

                {sol.observaciones && (
                  <p className="text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200/80 italic">
                    "{sol.observaciones}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* VISTA 3: DIRECTORIO DE EMPRESAS SAAS */}
      {tabActiva === 'EMPRESAS' && (
        <section aria-label="Directorio de Empresas SaaS" className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span>Empresas Registradas en la Plataforma</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Gestión de suscripciones, plan activo y estado operativo.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider font-extrabold border-b border-slate-200">
                  <th className="py-3 px-4">Empresa / Razón Social</th>
                  <th className="py-3 px-4">RUT / Sede</th>
                  <th className="py-3 px-4">Superficie Total</th>
                  <th className="py-3 px-4">Plan SaaS</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {empresas.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-black text-slate-900">
                      <span>{emp.razon_social}</span>
                      <span className="text-[10px] text-slate-400 block font-normal">{emp.nombre_fantasia}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono">
                      <span>{emp.rut}</span>
                      <span className="text-[10px] text-indigo-800 font-bold block">{emp.departamento_sede}</span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-800">
                      {emp.hectareas_totales_grupo.toLocaleString('es-UY')} Ha
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={emp.plan}
                        onChange={(e) => cambiarPlanEmpresa(emp.id, e.target.value as PlanSaaS)}
                        className="bg-slate-100 border border-slate-300 rounded-lg text-[11px] font-black p-1 text-slate-800 cursor-pointer"
                      >
                        <option value="BASIC">BASIC</option>
                        <option value="PRO">PRO</option>
                        <option value="ENTERPRISE">ENTERPRISE</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                        emp.activa ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-rose-100 text-rose-900 border border-rose-300'
                      }`}>
                        {emp.activa ? 'ACTIVA' : 'SUSPENDIDA'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => toggleEstadoEmpresa(emp.id)}
                        className="inline-flex items-center space-x-1 text-xs font-extrabold px-3 py-1.5 rounded-xl border transition-all cursor-pointer active:scale-95 bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800"
                      >
                        {emp.activa ? <ToggleRight className="w-4 h-4 text-emerald-600" /> : <ToggleLeft className="w-4 h-4 text-rose-600" />}
                        <span>{emp.activa ? 'Pausar' : 'Activar'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};
