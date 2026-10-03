import { create } from 'zustand';
import type { PesadaGanado } from '../types';
import { obtenerPesadasBD, guardarPesadaBD } from '../services/supabase';
import { useAuthStore } from './useAuthStore';

interface PesadasState {
  pesadas: PesadaGanado[];
  cargando: boolean;
  inicializado: boolean;
  cargarPesadasDesdeSupabase: () => Promise<void>;
  registrarPesada: (pesadaData: Omit<PesadaGanado, 'id' | 'created_at'>) => Promise<void>;
  obtenerPesadasEstancia: (estanciaId: string) => PesadaGanado[];
}

export const usePesadasStore = create<PesadasState>((set, get) => ({
  pesadas: [],
  cargando: false,
  inicializado: false,

  cargarPesadasDesdeSupabase: async () => {
    set({ cargando: true });
    const datosBD = await obtenerPesadasBD();
    set({
      pesadas: datosBD || [],
      cargando: false,
      inicializado: true,
    });
  },

  registrarPesada: async (pesadaData) => {
    const usuario = useAuthStore.getState().usuario;
    const usuarioId = usuario?.id || undefined;

    await guardarPesadaBD({
      ...pesadaData,
      registrado_por: usuarioId,
    });

    await get().cargarPesadasDesdeSupabase();
  },

  obtenerPesadasEstancia: (estanciaId: string) => {
    const { pesadas } = get();
    if (!estanciaId || estanciaId === 'TODAS' || estanciaId === 'TODOS') return pesadas;
    return pesadas.filter((p) => p.estancia_id === estanciaId);
  },
}));
