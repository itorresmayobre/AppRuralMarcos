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
  solicitarRegistroEmpresa: (data: Omit<SolicitudRegistro, 'id' | 'estado' | 'fecha_solicitud'>) => Promise<{ exito: boolean; id?: string; error?: string }>;
  aprobarSolicitud: (solicitudId: string) => Promise<{ exito: boolean; solicitudId?: string; error?: string }>;
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
    const { enviarSolicitudRegistroBD } = await import('../services/supabase');
    const res = await enviarSolicitudRegistroBD({
      nombre: data.solicitante_nombre || data.nombre_solicitante || 'Solicitante',
      apellido: '',
      ci: '',
      email: data.solicitante_email || data.email || '',
      telefono: data.solicitante_telefono || data.telefono || '',
    });

    if (res.exito && res.id) {
      const nuevaSolicitud: SolicitudRegistro = {
        ...data,
        id: res.id,
        estado: 'PENDIENTE',
        fecha_solicitud: formatearFechaUY(hoyISO()),
      };

      set((state) => ({
        solicitudesRegistro: [nuevaSolicitud, ...state.solicitudesRegistro],
      }));
      return { exito: true, id: res.id };
    }

    return { exito: false, error: res.error || 'Error al guardar la solicitud en la base de datos.' };
  },

  aprobarSolicitud: async (solicitudId: string) => {
    const state = get();
    const solicitud = state.solicitudesRegistro.find((s) => s.id === solicitudId);
    if (!solicitud) {
      return { exito: false, error: 'Solicitud no encontrada en memoria.' };
    }

    const { aprobarSolicitudRegistroBD } = await import('../services/supabase');
    const res = await aprobarSolicitudRegistroBD(solicitudId);

    if (res.exito) {
      set({
        solicitudesRegistro: state.solicitudesRegistro.map((s) =>
          s.id === solicitudId ? { ...s, estado: 'APROBADA' } : s
        ),
      });

      // Recargar la lista de usuarios para reflejar el perfil creado por el Trigger
      try {
        const { useUsuariosStore } = await import('./useUsuariosStore');
        await useUsuariosStore.getState().cargarUsuariosDesdeSupabase();
      } catch { }

      return { exito: true, solicitudId };
    }

    return { exito: false, error: res.error || 'Error al aprobar la solicitud en Supabase.' };
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
