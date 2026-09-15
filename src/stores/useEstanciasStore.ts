import { create } from 'zustand';
import type { Estancia } from '../types';
import { obtenerEstablecimientosBD, supabase } from '../services/supabase';

interface EstanciasState {
  estancias: Estancia[];
  estanciaSeleccionadaId: string; // 'TODAS' o el id específico de la estancia
  reglasProrrateo: Record<string, number>; // estancia_id -> porcentaje
  cargando: boolean;
  cargarEstanciasDesdeSupabase: () => Promise<void>;
  seleccionarEstancia: (id: string) => void;
  agregarEstancia: (nueva: Omit<Estancia, 'id' | 'activa'>) => Promise<void>;
  editarEstancia: (id: string, cambios: Partial<Estancia>) => Promise<void>;
  obtenerEstanciaActual: () => Estancia | null;
  actualizarReglasProrrateo: (reglas: Record<string, number>) => void;
  calcularProrrateoPorHectareas: () => Record<string, number>;
}

const calcularInicialProrrateo = (lista: Estancia[]) => {
  const totalHa = lista.reduce((a, b) => a + b.hectareas_totales, 0) || 1;
  const res: Record<string, number> = {};
  lista.forEach((e) => {
    res[e.id] = Math.round((e.hectareas_totales / totalHa) * 100);
  });
  return res;
};

export const useEstanciasStore = create<EstanciasState>((set, get) => ({
  estancias: [],
  estanciaSeleccionadaId: 'TODAS',
  reglasProrrateo: {},
  cargando: false,

  cargarEstanciasDesdeSupabase: async () => {
    set({ cargando: true });
    const datosBD = await obtenerEstablecimientosBD();
    if (datosBD && datosBD.length > 0) {
      set({ 
        estancias: datosBD, 
        reglasProrrateo: calcularInicialProrrateo(datosBD),
        cargando: false 
      });
    } else {
      set({ cargando: false });
    }
  },

  seleccionarEstancia: (id: string) => {
    set({ estanciaSeleccionadaId: id });
  },

  agregarEstancia: async (nuevaData) => {
    let newId = `est-${Date.now()}`;

    try {
      const payload = {
        empresa_id: nuevaData.empresa_id || 'emp-1',
        nombre: nuevaData.nombre,
        dicose: nuevaData.dicose,
        hectareas_totales: nuevaData.hectareas_totales,
        hectareas_pastoreables: nuevaData.hectareas_pastoreables,
        departamento: nuevaData.departamento,
        ubicacion_localidad: nuevaData.ubicacion_localidad,
        tipo_tenencia: nuevaData.tipo_tenencia || 'PROPIO',
        activa: true,
      };

      const { data, error } = await supabase
        .from('establecimientos')
        .insert([payload])
        .select('id')
        .single();

      if (!error && data) {
        newId = data.id;
      }
    } catch (e) {
      console.warn('Error agregando estancia en Supabase:', e);
    }

    const nuevaEstancia: Estancia = {
      ...nuevaData,
      id: newId,
      activa: true,
    };

    set((state) => {
      const nuevasEstancias = [...state.estancias, nuevaEstancia];
      return {
        estancias: nuevasEstancias,
        estanciaSeleccionadaId: nuevaEstancia.id,
        reglasProrrateo: calcularInicialProrrateo(nuevasEstancias),
      };
    });
  },

  editarEstancia: async (id: string, cambios: Partial<Estancia>) => {
    try {
      await supabase
        .from('establecimientos')
        .update({
          ...(cambios.nombre && { nombre: cambios.nombre }),
          ...(cambios.dicose && { dicose: cambios.dicose }),
          ...(cambios.hectareas_totales !== undefined && { hectareas_totales: cambios.hectareas_totales }),
          ...(cambios.hectareas_pastoreables !== undefined && { hectareas_pastoreables: cambios.hectareas_pastoreables }),
          ...(cambios.departamento && { departamento: cambios.departamento }),
          ...(cambios.ubicacion_localidad && { ubicacion_localidad: cambios.ubicacion_localidad }),
          ...(cambios.tipo_tenencia && { tipo_tenencia: cambios.tipo_tenencia }),
          ...(cambios.activa !== undefined && { activa: cambios.activa }),
        })
        .eq('id', id);
    } catch (e) {
      console.warn('Error editando estancia en Supabase:', e);
    }

    set((state) => {
      const nuevasEstancias = state.estancias.map((e) => (e.id === id ? { ...e, ...cambios } : e));
      return {
        estancias: nuevasEstancias,
        reglasProrrateo: calcularInicialProrrateo(nuevasEstancias),
      };
    });
  },

  obtenerEstanciaActual: () => {
    const { estancias, estanciaSeleccionadaId } = get();
    if (estanciaSeleccionadaId === 'TODAS') return null;
    return estancias.find((e) => e.id === estanciaSeleccionadaId) || null;
  },

  actualizarReglasProrrateo: (reglas) => {
    set({ reglasProrrateo: reglas });
  },

  calcularProrrateoPorHectareas: () => {
    const { estancias } = get();
    return calcularInicialProrrateo(estancias);
  },
}));
