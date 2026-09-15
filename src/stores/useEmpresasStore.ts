import { create } from 'zustand';
import type { Empresa, SolicitudRegistro, PlanSaaS } from '../types';
import { hoyISO, formatearFechaUY } from '../utils/fechas';

interface EmpresasState {
  empresas: Empresa[];
  solicitudesRegistro: SolicitudRegistro[];
  empresaSeleccionadaId: string;
  
  // Acciones
  seleccionarEmpresa: (id: string) => void;
  obtenerEmpresaActual: () => Empresa | undefined;
  solicitarRegistroEmpresa: (data: Omit<SolicitudRegistro, 'id' | 'estado' | 'fecha_solicitud'>) => void;
  aprobarSolicitud: (solicitudId: string) => string | undefined;
  rechazarSolicitud: (solicitudId: string, motivo?: string) => void;
  toggleEstadoEmpresa: (empresaId: string) => void;
  cambiarPlanEmpresa: (empresaId: string, plan: PlanSaaS) => void;
}

const empresasIniciales: Empresa[] = [
  {
    id: 'emp-1',
    razon_social: 'Agropecuaria Marcos S.A.',
    nombre_fantasia: 'Campos Marcos & Asoc.',
    rut: '218765430012',
    email_contacto: 'contacto@marcosagro.com.uy',
    telefono_contacto: '+598 99 123 456',
    departamento_sede: 'Soriano',
    hectareas_totales_grupo: 1250,
    plan: 'PRO',
    activa: true,
    fecha_registro: '10/01/2026',
  },
  {
    id: 'emp-2',
    razon_social: 'Ganadera Don Pedro SpA',
    nombre_fantasia: 'Estancias Don Pedro',
    rut: '123456780019',
    email_contacto: 'administracion@donpedro.uy',
    telefono_contacto: '+598 91 887 665',
    departamento_sede: 'Tacuarembó',
    hectareas_totales_grupo: 2800,
    plan: 'ENTERPRISE',
    activa: true,
    fecha_registro: '15/02/2026',
  },
];

const solicitudesIniciales: SolicitudRegistro[] = [
  {
    id: 'sol-1',
    nombre_empresa: 'Establecimiento La Querencia',
    rut: '049876540015',
    solicitante_nombre: 'Gonzalo Rodríguez',
    solicitante_email: 'gonzalo@laquerencia.uy',
    solicitante_telefono: '+598 99 456 789',
    departamento: 'Durazno',
    hectareas_estimadas: 1600,
    estancias_estimadas: 2,
    estado: 'PENDIENTE',
    fecha_solicitud: '14/09/2026',
    observaciones: 'Campo ganadero de cría e invernada. Requiero 3 usuarios para capataz y contador.',
  },
  {
    id: 'sol-2',
    nombre_empresa: 'Agropecuaria San José S.R.L.',
    rut: '185544330011',
    solicitante_nombre: 'Mariana Fernández',
    solicitante_email: 'm.fernandez@sanjoseagro.com.uy',
    solicitante_telefono: '+598 98 776 554',
    departamento: 'San José',
    hectareas_estimadas: 850,
    estancias_estimadas: 1,
    estado: 'PENDIENTE',
    fecha_solicitud: '15/09/2026',
    observaciones: 'Predio agrícola-ganadero. Me interesa el control bimoneda USD/UYU.',
  },
];

export const useEmpresasStore = create<EmpresasState>((set, get) => ({
  empresas: empresasIniciales,
  solicitudesRegistro: solicitudesIniciales,
  empresaSeleccionadaId: 'emp-1',

  seleccionarEmpresa: (id: string) => {
    set({ empresaSeleccionadaId: id });
  },

  obtenerEmpresaActual: () => {
    const { empresas, empresaSeleccionadaId } = get();
    return empresas.find((e) => e.id === empresaSeleccionadaId) || empresas[0];
  },

  solicitarRegistroEmpresa: (data) => {
    const nuevaSolicitud: SolicitudRegistro = {
      ...data,
      id: `sol-${Date.now()}`,
      estado: 'PENDIENTE',
      fecha_solicitud: formatearFechaUY(hoyISO()),
    };

    set((state) => ({
      solicitudesRegistro: [nuevaSolicitud, ...state.solicitudesRegistro],
    }));
  },

  aprobarSolicitud: (solicitudId: string) => {
    const state = get();
    const solicitud = state.solicitudesRegistro.find((s) => s.id === solicitudId);
    if (!solicitud) return undefined;

    // Crear nueva empresa automáticamente
    const nuevaEmpresa: Empresa = {
      id: `emp-${Date.now()}`,
      razon_social: solicitud.nombre_empresa,
      nombre_fantasia: solicitud.nombre_empresa,
      rut: solicitud.rut,
      email_contacto: solicitud.solicitante_email,
      telefono_contacto: solicitud.solicitante_telefono,
      departamento_sede: solicitud.departamento,
      hectareas_totales_grupo: solicitud.hectareas_estimadas,
      plan: 'BASIC',
      activa: true,
      fecha_registro: formatearFechaUY(hoyISO()),
    };

    set({
      solicitudesRegistro: state.solicitudesRegistro.map((s) =>
        s.id === solicitudId ? { ...s, estado: 'APROBADA' } : s
      ),
      empresas: [...state.empresas, nuevaEmpresa],
    });

    return nuevaEmpresa.id;
  },

  rechazarSolicitud: (solicitudId: string, motivo?: string) => {
    set((state) => ({
      solicitudesRegistro: state.solicitudesRegistro.map((s) =>
        s.id === solicitudId
          ? { ...s, estado: 'RECHAZADA', observaciones: motivo || s.observaciones }
          : s
      ),
    }));
  },

  toggleEstadoEmpresa: (empresaId: string) => {
    set((state) => ({
      empresas: state.empresas.map((e) =>
        e.id === empresaId ? { ...e, activa: !e.activa } : e
      ),
    }));
  },

  cambiarPlanEmpresa: (empresaId: string, plan: PlanSaaS) => {
    set((state) => ({
      empresas: state.empresas.map((e) =>
        e.id === empresaId ? { ...e, plan } : e
      ),
    }));
  },
}));
