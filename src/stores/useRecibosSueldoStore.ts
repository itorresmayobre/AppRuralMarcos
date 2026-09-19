import { create } from 'zustand';
import type { ReciboSueldo } from '../types';
import { obtenerRecibosSueldoBD, supabase } from '../services/supabase';

interface RecibosSueldoState {
  recibos: ReciboSueldo[];
  cargando: boolean;
  inicializado: boolean;
  cargarRecibosDesdeSupabase: () => Promise<void>;
  agregarRecibo: (nuevo: Omit<ReciboSueldo, 'id'>) => Promise<void>;
  eliminarRecibo: (id: string) => Promise<void>;
  obtenerRecibosPorEmpleado: (usuarioId: string) => ReciboSueldo[];
  obtenerRecibosPorEmpresa: (empresaId: string) => ReciboSueldo[];
}

export const useRecibosSueldoStore = create<RecibosSueldoState>((set, get) => ({
  recibos: [],
  cargando: false,
  inicializado: false,

  cargarRecibosDesdeSupabase: async () => {
    set({ cargando: true });
    const datosBD = await obtenerRecibosSueldoBD();
    set({
      recibos: datosBD || [],
      cargando: false,
      inicializado: true,
    });
  },

  agregarRecibo: async (nuevoData) => {
    let newId = `rec-${Date.now()}`;

    try {
      const payload = {
        empresa_id: nuevoData.empresa_id || 'emp-1',
        usuario_id: nuevoData.usuario_id,
        transaccion_id: nuevoData.transaccion_id || null,
        periodo_mes: nuevoData.periodo_mes,
        ejercicio_agricola: nuevoData.ejercicio_agricola,
        monto_liquido: nuevoData.monto_liquido,
        moneda: nuevoData.moneda,
        fecha_pago: nuevoData.fecha_pago,
        recibo_url: nuevoData.recibo_url,
        estado_firma: nuevoData.estado_firma || 'PENDIENTE',
        observaciones: nuevoData.observaciones || null,
      };

      const { data, error } = await supabase
        .from('recibos_sueldo')
        .insert([payload])
        .select('id')
        .single();

      if (!error && data) {
        newId = data.id;
      }
    } catch (e) {
      console.warn('Error guardando recibo en Supabase:', e);
    }

    const nuevo: ReciboSueldo = {
      ...nuevoData,
      id: newId,
    };

    set((state) => ({
      recibos: [nuevo, ...state.recibos],
    }));
  },

  eliminarRecibo: async (id) => {
    set((state) => ({
      recibos: state.recibos.filter((r) => r.id !== id),
    }));

    try {
      await supabase.from('recibos_sueldo').delete().eq('id', id);
    } catch (e) {
      console.warn('Error eliminando recibo en Supabase:', e);
    }
  },

  obtenerRecibosPorEmpleado: (usuarioId) => {
    const { recibos } = get();
    return recibos.filter((r) => r.usuario_id === usuarioId);
  },

  obtenerRecibosPorEmpresa: (empresaId) => {
    const { recibos } = get();
    return recibos.filter((r) => r.empresa_id === empresaId);
  },
}));
