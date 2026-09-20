import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ConceptoFinanciero, TipoTransaccion } from '../types';
import { obtenerConceptosFinancierosBD, supabase } from '../services/supabase';

export const catalogInicial: ConceptoFinanciero[] = [
  // INGRESOS
  { id: 'c-1', tipo: 'INGRESO', grupo: 'Venta de Hacienda', nombre: 'Venta de Vacunos', icono: '🐄', es_estandar: true },
  { id: 'c-2', tipo: 'INGRESO', grupo: 'Venta de Hacienda', nombre: 'Venta de Ovinos', icono: '🐑', es_estandar: true },
  { id: 'c-3', tipo: 'INGRESO', grupo: 'Venta de Lana y Subproductos', nombre: 'Venta de Lana', icono: '🧶', es_estandar: true },
  { id: 'c-4', tipo: 'INGRESO', grupo: 'Producción Láctea', nombre: 'Venta de Leche y Quesos', icono: '🥛', es_estandar: true },
  { id: 'c-5', tipo: 'INGRESO', grupo: 'Agrícola', nombre: 'Venta de Cosecha (Granos/Forraje)', icono: '🌾', es_estandar: true },
  { id: 'c-6', tipo: 'INGRESO', grupo: 'Servicios a Terceros', nombre: 'Pastoreos Cobrados a Terceros', icono: '🚜', es_estandar: true },
  { id: 'c-7', tipo: 'INGRESO', grupo: 'Otros Ingresos', nombre: 'Ventas Varias / Otros Ingresos', icono: '💵', es_estandar: true },

  // EGRESOS - COSTOS VARIABLES
  { id: 'c-8', tipo: 'EGRESO', grupo: 'Sanidad Animal', nombre: 'Insumos Veterinarios y Vacunas', icono: '💉', es_estandar: true, naturaleza_costo: 'VARIABLE' },
  { id: 'c-9', tipo: 'EGRESO', grupo: 'Alimentación y Suplementación', nombre: 'Ración, Suplementos y Sal Mineral', icono: '🌽', es_estandar: true, naturaleza_costo: 'VARIABLE' },
  { id: 'c-10', tipo: 'EGRESO', grupo: 'Comercialización y Fletes', nombre: 'Fletes y Consignatarios de Ganado', icono: '🚚', es_estandar: true, naturaleza_costo: 'VARIABLE' },
  { id: 'c-11', tipo: 'EGRESO', grupo: 'Pasturas y Verdeos', nombre: 'Semillas, Fertilizantes y Agroquímicos', icono: '🌱', es_estandar: true, naturaleza_costo: 'VARIABLE' },
  { id: 'c-12', tipo: 'EGRESO', grupo: 'Combustibles y Maquinaria', nombre: 'Combustible y Diésel de Campo', icono: '⛽', es_estandar: true, naturaleza_costo: 'VARIABLE' },
  { id: 'c-13', tipo: 'EGRESO', grupo: 'Mano de Obra Eventual', nombre: 'Tareas por Día / Esquila / Eventuales', icono: '👨‍🌾', es_estandar: true, naturaleza_costo: 'VARIABLE' },

  // EGRESOS - COSTOS FIJOS
  { id: 'c-14', tipo: 'EGRESO', grupo: 'Mano de Obra Permanente', nombre: 'Sueldos Fijos y Recibos de Personal', icono: '👷', es_estandar: true, naturaleza_costo: 'FIJO', es_recurrente_mensual: true },
  { id: 'c-15', tipo: 'EGRESO', grupo: 'Cargas Sociales', nombre: 'Leyes Sociales, BPS y BSE', icono: '🏛️', es_estandar: true, naturaleza_costo: 'FIJO', es_recurrente_mensual: true },
  { id: 'c-16', tipo: 'EGRESO', grupo: 'Renta de la Tierra', nombre: 'Arrendamiento y Renta de Campos', icono: '🏡', es_estandar: true, naturaleza_costo: 'FIJO', es_recurrente_mensual: true },
  { id: 'c-17', tipo: 'EGRESO', grupo: 'Impuestos y Tasas', nombre: 'Contribución Inmobiliaria e Impuestos Prediales', icono: '📜', es_estandar: true, naturaleza_costo: 'FIJO' },
  { id: 'c-18', tipo: 'EGRESO', grupo: 'Servicios Profesionales', nombre: 'Honorarios Agrónomo, Veterinario y Contador', icono: '💼', es_estandar: true, naturaleza_costo: 'FIJO', es_recurrente_mensual: true },
  { id: 'c-19', tipo: 'EGRESO', grupo: 'Infraestructura y Mejoras', nombre: 'Mantenimiento de Alambres, Bebederos y Tajamares', icono: '🛠️', es_estandar: true, naturaleza_costo: 'FIJO' },
  { id: 'c-20', tipo: 'EGRESO', grupo: 'Combustibles y Maquinaria', nombre: 'Reparación y Repuestos de Tractores', icono: '🔧', es_estandar: true, naturaleza_costo: 'FIJO' },
  { id: 'c-21', tipo: 'EGRESO', grupo: 'Gastos Generales y Servicios', nombre: 'Electricidad (UTE), Teléfono y Agua', icono: '⚡', es_estandar: true, naturaleza_costo: 'FIJO', es_recurrente_mensual: true },
  { id: 'c-22', tipo: 'EGRESO', grupo: 'Seguros y Garantías', nombre: 'Seguros Prediales, Incendio y Vehículos', icono: '🛡️', es_estandar: true, naturaleza_costo: 'FIJO' },
  { id: 'c-23', tipo: 'EGRESO', grupo: 'Gastos Financieros', nombre: 'Gastos Bancarios, Mantenimiento de Cuenta y POS', icono: '🏦', es_estandar: true, naturaleza_costo: 'FIJO' },
];

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
      catalog: catalogInicial,
      conceptosActivosIds: catalogInicial.map((c) => c.id),
      cargando: false,
      inicializado: false,

      cargarConceptosDesdeSupabase: async () => {
        set({ cargando: true });
        try {
          const datosBD = await obtenerConceptosFinancierosBD();
          
          if (datosBD && datosBD.length > 0) {
            const idsExistentes = new Set(datosBD.map((d) => d.id));
            const faltantesIniciales = catalogInicial.filter((c) => !idsExistentes.has(c.id));
            const catalogoCombinado = [...datosBD, ...faltantesIniciales];

            set((state) => ({
              catalog: catalogoCombinado,
              conceptosActivosIds: state.conceptosActivosIds.length > 0 ? state.conceptosActivosIds : catalogoCombinado.map((c) => c.id),
              cargando: false,
              inicializado: true,
            }));
          } else {
            set((state) => ({
              catalog: catalogInicial,
              conceptosActivosIds: state.conceptosActivosIds.length > 0 ? state.conceptosActivosIds : catalogInicial.map((c) => c.id),
              cargando: false,
              inicializado: true,
            }));

            try {
              await supabase.from('conceptos_financieros').upsert(catalogInicial, { onConflict: 'id' });
            } catch (e) {
              console.warn('Aviso subiendo conceptos iniciales a Supabase:', e);
            }
          }
        } catch (e) {
          set((state) => ({
            catalog: state.catalog.length > 0 ? state.catalog : catalogInicial,
            conceptosActivosIds: state.conceptosActivosIds.length > 0 ? state.conceptosActivosIds : catalogInicial.map((c) => c.id),
            cargando: false,
            inicializado: true,
          }));
        }
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
