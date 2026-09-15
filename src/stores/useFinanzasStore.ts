import { create } from 'zustand';
import type { TransaccionFinanciera } from '../types';
import { obtenerTransaccionesBD, guardarTransaccionBD, supabase } from '../services/supabase';

interface FinanzasState {
  transacciones: TransaccionFinanciera[];
  cargando: boolean;
  cargarTransaccionesDesdeSupabase: () => Promise<void>;
  agregarTransaccion: (nueva: Omit<TransaccionFinanciera, 'id' | 'creado_por_usuario'>) => Promise<void>;
  actualizarTransaccion: (id: string, datos: Partial<TransaccionFinanciera>) => Promise<void>;
  eliminarTransaccion: (id: string) => Promise<void>;
  obtenerTransaccionesEstancia: (estanciaId: string) => TransaccionFinanciera[];
}

export const useFinanzasStore = create<FinanzasState>((set, get) => ({
  transacciones: [],
  cargando: false,

  cargarTransaccionesDesdeSupabase: async () => {
    set({ cargando: true });
    const datosBD = await obtenerTransaccionesBD();
    if (datosBD && datosBD.length > 0) {
      set({ transacciones: datosBD, cargando: false });
    } else {
      set({ cargando: false });
    }
  },

  agregarTransaccion: async (nuevaData) => {
    const idBD = await guardarTransaccionBD(nuevaData);
    const nueva: TransaccionFinanciera = {
      ...nuevaData,
      id: idBD || `t-${Date.now()}`,
      creado_por_usuario: 'usuario.actual',
    };

    set((state) => ({
      transacciones: [nueva, ...state.transacciones],
    }));
  },

  actualizarTransaccion: async (id, datos) => {
    set((state) => ({
      transacciones: state.transacciones.map((t) => (t.id === id ? { ...t, ...datos } : t)),
    }));

    try {
      await supabase.from('transacciones_financieras').update(datos).eq('id', id);
    } catch (e) {
      console.warn('Error actualizando en Supabase:', e);
    }
  },

  eliminarTransaccion: async (id) => {
    set((state) => ({
      transacciones: state.transacciones.filter((t) => t.id !== id),
    }));

    try {
      await supabase.from('transacciones_financieras').delete().eq('id', id);
    } catch (e) {
      console.warn('Error eliminando en Supabase:', e);
    }
  },

  obtenerTransaccionesEstancia: (estanciaId: string) => {
    const { transacciones } = get();
    if (estanciaId === 'TODAS') return transacciones;
    
    return transacciones.map((t) => {
      if (t.estancia_id === estanciaId) return t;
      if (t.es_prorrateado && t.distribucion_prorrateo) {
        const dist = t.distribucion_prorrateo.find((d) => d.estancia_id === estanciaId);
        if (dist && dist.monto > 0) {
          return {
            ...t,
            monto: dist.monto,
            descripcion: `${t.descripcion} (Prorrateado ${dist.porcentaje}%)`,
          };
        }
      }
      return null;
    }).filter((t): t is TransaccionFinanciera => t !== null);
  },
}));
