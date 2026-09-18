import { create } from 'zustand';
import type { Empresa, SolicitudRegistro, PlanSaaS } from '../types';
import { hoyISO, formatearFechaUY } from '../utils/fechas';
import { obtenerEmpresasBD, obtenerSolicitudesRegistroBD, supabase } from '../services/supabase';

interface EmpresasState {
  empresas: Empresa[];
  solicitudesRegistro: SolicitudRegistro[];
  empresaSeleccionadaId: string;
  cargando: boolean;
  inicializado: boolean;
  
  // Acciones
  cargarEmpresasDesdeSupabase: () => Promise<void>;
  seleccionarEmpresa: (id: string) => void;
  obtenerEmpresaActual: () => Empresa | undefined;
  solicitarRegistroEmpresa: (data: Omit<SolicitudRegistro, 'id' | 'estado' | 'fecha_solicitud'>) => Promise<void>;
  aprobarSolicitud: (solicitudId: string) => Promise<string | undefined>;
  rechazarSolicitud: (solicitudId: string, motivo?: string) => void;
  toggleEstadoEmpresa: (empresaId: string) => void;
  cambiarPlanEmpresa: (empresaId: string, plan: PlanSaaS) => void;
}

export const useEmpresasStore = create<EmpresasState>((set, get) => ({
  empresas: [],
  solicitudesRegistro: [],
  empresaSeleccionadaId: '',
  cargando: true,
  inicializado: false,

  cargarEmpresasDesdeSupabase: async () => {
    set({ cargando: true });
    const [empresasBD, solicitudesBD] = await Promise.all([
      obtenerEmpresasBD(),
      obtenerSolicitudesRegistroBD()
    ]);

    set({
      empresas: empresasBD,
      solicitudesRegistro: solicitudesBD,
      empresaSeleccionadaId: empresasBD.length > 0 ? empresasBD[0].id : '',
      cargando: false,
      inicializado: true,
    });
  },

  seleccionarEmpresa: (id: string) => {
    set({ empresaSeleccionadaId: id });
  },

  obtenerEmpresaActual: () => {
    const { empresas, empresaSeleccionadaId } = get();
    return empresas.find((e) => e.id === empresaSeleccionadaId) || empresas[0];
  },

  solicitarRegistroEmpresa: async (data) => {
    let newId = `sol-${Date.now()}`;

    try {
      const payload = {
        nombre_solicitante: data.nombre_solicitante || data.solicitante_nombre || 'Solicitante',
        email: data.email || data.solicitante_email || '',
        telefono: data.telefono || data.solicitante_telefono || '',
        estado: 'PENDIENTE',
      };

      const { data: res, error } = await supabase
        .from('solicitudes_registro')
        .insert([payload])
        .select('id')
        .single();

      if (!error && res) {
        newId = res.id;
      }
    } catch (e) {
      console.warn('Error enviando solicitud en Supabase:', e);
    }

    const nuevaSolicitud: SolicitudRegistro = {
      ...data,
      id: newId,
      estado: 'PENDIENTE',
      fecha_solicitud: formatearFechaUY(hoyISO()),
    };

    set((state) => ({
      solicitudesRegistro: [nuevaSolicitud, ...state.solicitudesRegistro],
    }));
  },

  aprobarSolicitud: async (solicitudId: string) => {
    const state = get();
    const solicitud = state.solicitudesRegistro.find((s) => s.id === solicitudId);
    if (!solicitud) return undefined;

    let newEmpresaId = `emp-${Date.now()}`;

    try {
      const payload = {
        razon_social: solicitud.nombre_empresa || 'Empresa por defect',
        nombre_fantasia: solicitud.nombre_empresa || 'Empresa',
        rut: solicitud.rut || '210000000000',
        email_contacto: solicitud.solicitante_email || solicitud.email,
        telefono_contacto: solicitud.solicitante_telefono || solicitud.telefono || '',
        departamento_sede: solicitud.departamento || 'Soriano',
        activa: true,
      };

      const { data: res, error } = await supabase
        .from('empresas')
        .insert([payload])
        .select('id')
        .single();

      if (!error && res) {
        newEmpresaId = res.id;
      }

      await supabase
        .from('solicitudes_registro')
        .update({ estado: 'APROBADA' })
        .eq('id', solicitudId);
    } catch (e) {
      console.warn('Error aprobando solicitud en Supabase:', e);
    }

    const nuevaEmpresa: Empresa = {
      id: newEmpresaId,
      razon_social: solicitud.nombre_empresa || 'Empresa Nueva',
      nombre_fantasia: solicitud.nombre_empresa || 'Empresa Nueva',
      rut: solicitud.rut || '210000000000',
      email_contacto: solicitud.solicitante_email || solicitud.email,
      telefono_contacto: solicitud.solicitante_telefono || solicitud.telefono || '',
      departamento_sede: solicitud.departamento || 'Soriano',
      hectareas_totales_grupo: solicitud.hectareas_estimadas || 0,
      plan: 'PRO',
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
