import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ConceptoFinanciero, TipoTransaccion } from '../types';
import { obtenerConceptosFinancierosBD, supabase } from '../services/supabase';

interface ConceptosStoreState {
  catalog: ConceptoFinanciero[];
  conceptosActivosIds: string[];
  cargando: boolean;
  inicializado: boolean;
  cargarConceptosDesdeSupabase: () => Promise<void>;
  toggleConcepto: (conceptoId: string) => void;
  activarTodosGrupo: (grupo: string, activar: boolean) => void;
  obtenerConceptosPorTipo: (tipo: TipoTransaccion) => ConceptoFinanciero[];
  obtenerConceptosActivosPorTipo: (tipo: TipoTransaccion) => ConceptoFinanciero[];
  obtenerGruposPorTipo: (tipo: TipoTransaccion) => string[];
  esConceptoActivo: (conceptoId: string) => boolean;
  agregarConceptoPersonalizado: (nuevo: Omit<ConceptoFinanciero, 'id' | 'es_estandar'>) => Promise<ConceptoFinanciero>;
}

export const useConceptosFinancierosStore = create<ConceptosStoreState>()(
  persist(
    (set, get) => ({
      catalog: [],
      conceptosActivosIds: [],
      cargando: false,
      inicializado: false,

      cargarConceptosDesdeSupabase: async () => {
        set({ cargando: true });
        const datosBD = await obtenerConceptosFinancierosBD();
        set({
          catalog: datosBD || [],
          conceptosActivosIds: (datosBD || []).map((c) => c.id),
          cargando: false,
          inicializado: true,
        });
      },

      toggleConcepto: (conceptoId) => {
        set((state) => {
          const yaExiste = state.conceptosActivosIds.includes(conceptoId);
          const nuevosIds = yaExiste
            ? state.conceptosActivosIds.filter((id) => id !== conceptoId)
            : [...state.conceptosActivosIds, conceptoId];

          return { conceptosActivosIds: nuevosIds };
        });
      },

      activarTodosGrupo: (grupo, activar) => {
        set((state) => {
          const idsDelGrupo = state.catalog.filter((c) => c.grupo === grupo).map((c) => c.id);
          let nuevosIds = [...state.conceptosActivosIds];

          if (activar) {
            idsDelGrupo.forEach((id) => {
              if (!nuevosIds.includes(id)) nuevosIds.push(id);
            });
          } else {
            nuevosIds = nuevosIds.filter((id) => !idsDelGrupo.includes(id));
          }

          return { conceptosActivosIds: nuevosIds };
        });
      },

      obtenerConceptosPorTipo: (tipo) => {
        return get().catalog.filter((c) => c.tipo === tipo);
      },

      obtenerConceptosActivosPorTipo: (tipo) => {
        const { catalog, conceptosActivosIds } = get();
        return catalog.filter((c) => c.tipo === tipo && conceptosActivosIds.includes(c.id));
      },

      obtenerGruposPorTipo: (tipo) => {
        const conceptos = get().catalog.filter((c) => c.tipo === tipo);
        const gruposUnicos = Array.from(new Set(conceptos.map((c) => c.grupo)));
        return gruposUnicos;
      },

      esConceptoActivo: (conceptoId) => {
        return get().conceptosActivosIds.includes(conceptoId);
      },

      agregarConceptoPersonalizado: async (nuevoData) => {
        const newId = `custom-${Date.now()}`;
        const nuevoConcepto: ConceptoFinanciero = {
          ...nuevoData,
          id: newId,
          es_estandar: false,
        };

        try {
          await supabase.from('conceptos_financieros').insert([{
            id: newId,
            tipo: nuevoData.tipo,
            grupo: nuevoData.grupo,
            nombre: nuevoData.nombre,
            icono: nuevoData.icono || '📋',
            es_estandar: false,
            naturaleza_costo: nuevoData.naturaleza_costo || null,
          }]);
        } catch (e) {
          console.warn('Error guardando concepto personalizado en Supabase:', e);
        }

        set((state) => ({
          catalog: [...state.catalog, nuevoConcepto],
          conceptosActivosIds: [...state.conceptosActivosIds, newId],
        }));

        return nuevoConcepto;
      },
    }),
    {
      name: 'conceptos-financieros-agro-storage',
    }
  )
);
