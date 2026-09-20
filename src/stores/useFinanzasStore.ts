import { create } from 'zustand';
import type { TransaccionFinanciera } from '../types';
import { obtenerTransaccionesBD, guardarTransaccionBD, actualizarTransaccionBD, supabase } from '../services/supabase';

interface FinanzasState {
  transacciones: TransaccionFinanciera[];
  cargando: boolean;
  inicializado: boolean;
  cargarTransaccionesDesdeSupabase: () => Promise<void>;
  agregarTransaccion: (nueva: Omit<TransaccionFinanciera, 'id' | 'creado_por_usuario'>) => Promise<void>;
  actualizarTransaccion: (id: string, datos: Partial<TransaccionFinanciera>) => Promise<void>;
  eliminarTransaccion: (id: string) => Promise<void>;
  obtenerTransaccionesEstancia: (estanciaId: string) => TransaccionFinanciera[];
}

export const useFinanzasStore = create<FinanzasState>((set, get) => ({
  transacciones: [],
  cargando: false,
  inicializado: false,

  cargarTransaccionesDesdeSupabase: async () => {
    set({ cargando: true });
    const datosBD = await obtenerTransaccionesBD();
    set({
      transacciones: datosBD || [],
      cargando: false,
      inicializado: true,
    });
  },

  agregarTransaccion: async (nuevaData) => {
    await guardarTransaccionBD(nuevaData);
    await get().cargarTransaccionesDesdeSupabase();
  },

  actualizarTransaccion: async (id, datos) => {
    // Solo consultar Supabase si el ID es un UUID válido
    const esUUIDValido = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
    if (esUUIDValido) {
      await actualizarTransaccionBD(id, datos);
    }
    await get().cargarTransaccionesDesdeSupabase();
  },

  eliminarTransaccion: async (id) => {
    set((state) => ({
      transacciones: state.transacciones.filter((t) => t.id !== id),
    }));

    // Solo consultar Supabase si el ID es un UUID válido de la base de datos
    const esUUIDValido = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
    if (!esUUIDValido) return;

    try {
      const { error } = await supabase.from('transacciones_financieras').delete().eq('id', id);
      if (error) console.warn('Aviso eliminando transacción en Supabase:', error.message);
    } catch (e) {
      console.warn('Error eliminando en Supabase:', e);
    }
  },

  obtenerTransaccionesEstancia: (estanciaId: string) => {
    const { transacciones } = get();
    if (estanciaId === 'TODAS') return transacciones;

    return transacciones.map((t) => {
      // 1. Si la transacción es prorrateada, obtener la cuota parte correspondiente a esta estancia
      if (t.es_prorrateado && t.distribucion_prorrateo) {
        const dist = t.distribucion_prorrateo.find((d) => d.estancia_id === estanciaId);
        if (dist && dist.monto > 0) {
          const pctFactor = dist.porcentaje / 100;
          return {
            ...t,
            monto: dist.monto,
            monto_usd: t.monto_usd ? Math.round((t.monto_usd * pctFactor) * 100) / 100 : undefined,
            monto_uyu: t.monto_uyu ? Math.round((t.monto_uyu * pctFactor) * 100) / 100 : undefined,
            descripcion: `${t.descripcion} (Prorrateado ${dist.porcentaje}%)`,
          };
        }
        return null;
      }

      // 2. Si es una transacción directa sin prorrateo, verificar si pertenece a esta estancia
      if (t.estancia_id === estanciaId) return t;

      return null;
    }).filter((t): t is TransaccionFinanciera => t !== null);
  },
}));
