import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ConceptoFinanciero, TipoTransaccion } from '../types';

export const CATALOGO_PLAN_AGROPECUARIO: ConceptoFinanciero[] = [
  // --- INGRESOS (Plan Agropecuario Oficial) ---
  { id: 'ing-cuentas-anteriores', tipo: 'INGRESO', grupo: 'Cobro Cuentas Año Anterior', nombre: 'Cobro cuentas año anterior', icono: '💵', es_estandar: true },
  
  { id: 'ing-vacunos', tipo: 'INGRESO', grupo: 'Ventas de Hacienda', nombre: 'Vacunos', icono: '🐮', es_estandar: true },
  { id: 'ing-lanares', tipo: 'INGRESO', grupo: 'Ventas de Hacienda', nombre: 'Lanares', icono: '🐑', es_estandar: true },
  { id: 'ing-lechero', tipo: 'INGRESO', grupo: 'Ventas de Hacienda', nombre: 'Ganado lechero', icono: '🥛', es_estandar: true },
  { id: 'ing-otros-animales', tipo: 'INGRESO', grupo: 'Ventas de Hacienda', nombre: 'Otros animales', icono: '🐴', es_estandar: true },

  { id: 'ing-lana', tipo: 'INGRESO', grupo: 'Ventas de Productos', nombre: 'Lana', icono: '🧶', es_estandar: true },
  { id: 'ing-cueros-vacunos', tipo: 'INGRESO', grupo: 'Ventas de Productos', nombre: 'Cueros vacunos', icono: '🎒', es_estandar: true },
  { id: 'ing-cueros-lanares', tipo: 'INGRESO', grupo: 'Ventas de Productos', nombre: 'Cueros lanares', icono: '🧥', es_estandar: true },
  { id: 'ing-leche', tipo: 'INGRESO', grupo: 'Ventas de Productos', nombre: 'Leche', icono: '🥛', es_estandar: true },
  { id: 'ing-queso', tipo: 'INGRESO', grupo: 'Ventas de Productos', nombre: 'Queso y crema', icono: '🧀', es_estandar: true },
  { id: 'ing-lacteos-varios', tipo: 'INGRESO', grupo: 'Ventas de Productos', nombre: 'Otros productos lácteos', icono: '🍶', es_estandar: true },
  { id: 'ing-cereales', tipo: 'INGRESO', grupo: 'Ventas de Productos', nombre: 'Cereales', icono: '🌾', es_estandar: true },
  { id: 'ing-oleaginosos', tipo: 'INGRESO', grupo: 'Ventas de Productos', nombre: 'Oleaginosos', icono: '🌻', es_estandar: true },
  { id: 'ing-medianero', tipo: 'INGRESO', grupo: 'Ventas de Productos', nombre: 'Producción del medianero', icono: '🤝', es_estandar: true },
  { id: 'ing-semilla-fina', tipo: 'INGRESO', grupo: 'Ventas de Productos', nombre: 'Semilla fina', icono: '🌱', es_estandar: true },
  { id: 'ing-intensivos', tipo: 'INGRESO', grupo: 'Ventas de Productos', nombre: 'Cultivos intensivos', icono: '🚜', es_estandar: true },
  { id: 'ing-otros-prod', tipo: 'INGRESO', grupo: 'Ventas de Productos', nombre: 'Otros productos agropecuarios', icono: '📦', es_estandar: true },

  { id: 'ing-maquinaria', tipo: 'INGRESO', grupo: 'Ventas de Activos', nombre: 'Maquinaria', icono: '🚜', es_estandar: true },
  { id: 'ing-tierra', tipo: 'INGRESO', grupo: 'Ventas de Activos', nombre: 'Tierra', icono: '🏞️', es_estandar: true },
  { id: 'ing-activos-varios', tipo: 'INGRESO', grupo: 'Ventas de Activos', nombre: 'Otros activos', icono: '🏗️', es_estandar: true },

  { id: 'ing-brou', tipo: 'INGRESO', grupo: 'Créditos Bancarios Recibidos', nombre: 'BROU (Banco República)', icono: '🏦', es_estandar: true },
  { id: 'ing-otros-bancos', tipo: 'INGRESO', grupo: 'Créditos Bancarios Recibidos', nombre: 'Otras entidades financieras', icono: '🏛️', es_estandar: true },

  { id: 'ing-servicios', tipo: 'INGRESO', grupo: 'Otros Ingresos', nombre: 'Venta de servicios', icono: '🛠️', es_estandar: true },
  { id: 'ing-arrendamiento-recibido', tipo: 'INGRESO', grupo: 'Otros Ingresos', nombre: 'Arrendamiento cobrado', icono: '🏡', es_estandar: true },
  { id: 'ing-pastoreos', tipo: 'INGRESO', grupo: 'Otros Ingresos', nombre: 'Pastoreos cobrados', icono: '🌿', es_estandar: true },
  { id: 'ing-capitalizacion', tipo: 'INGRESO', grupo: 'Otros Ingresos', nombre: 'Ganado en Capitalización', icono: '📊', es_estandar: true },
  { id: 'ing-extra-predio', tipo: 'INGRESO', grupo: 'Otros Ingresos', nombre: 'Aporte extrapredial', icono: '💵', es_estandar: true },
  { id: 'ing-entradas-no-ib', tipo: 'INGRESO', grupo: 'Otros Ingresos', nombre: 'Otras entradas No IB', icono: '📄', es_estandar: true },
  { id: 'ing-entradas-ib', tipo: 'INGRESO', grupo: 'Otros Ingresos', nombre: 'Otras entradas IB', icono: '📑', es_estandar: true },

  // --- EGRESOS (Plan Agropecuario Oficial) ---
  { id: 'egr-cuentas-anteriores', tipo: 'EGRESO', grupo: 'Pago Cuentas Año Anterior', nombre: 'Pago cuentas año anterior', icono: '💵', es_estandar: true, naturaleza_costo: 'VARIABLE' },

  { id: 'egr-compra-vacunos', tipo: 'EGRESO', grupo: 'Compras de Hacienda', nombre: 'Vacunos', icono: '🐮', es_estandar: true, naturaleza_costo: 'VARIABLE' },
  { id: 'egr-compra-lanares', tipo: 'EGRESO', grupo: 'Compras de Hacienda', nombre: 'Lanares', icono: '🐑', es_estandar: true, naturaleza_costo: 'VARIABLE' },
  { id: 'egr-compra-lechero', tipo: 'EGRESO', grupo: 'Compras de Hacienda', nombre: 'Ganado lechero', icono: '🥛', es_estandar: true, naturaleza_costo: 'VARIABLE' },
  { id: 'egr-compra-otros-animales', tipo: 'EGRESO', grupo: 'Compras de Hacienda', nombre: 'Compra otros', icono: '🐴', es_estandar: true, naturaleza_costo: 'VARIABLE' },

  { id: 'egr-sueldos-jornales', tipo: 'EGRESO', grupo: 'Mano de Obra', nombre: 'Sueldos y jornales', icono: '👥', es_estandar: true, naturaleza_costo: 'FIJO', es_recurrente_mensual: true },
  { id: 'egr-comestibles', tipo: 'EGRESO', grupo: 'Mano de Obra', nombre: 'Comestibles', icono: '🛒', es_estandar: true, naturaleza_costo: 'FIJO', es_recurrente_mensual: true },
  { id: 'egr-leyes-sociales', tipo: 'EGRESO', grupo: 'Mano de Obra', nombre: 'Leyes Sociales (BPS)', icono: '📄', es_estandar: true, naturaleza_costo: 'FIJO', es_recurrente_mensual: true },

  { id: 'egr-imp-irae', tipo: 'EGRESO', grupo: 'Impuestos', nombre: 'IRAE', icono: '🏛️', es_estandar: true, naturaleza_costo: 'FIJO' },
  { id: 'egr-imp-imeba', tipo: 'EGRESO', grupo: 'Impuestos', nombre: 'IMEBA', icono: '📜', es_estandar: true, naturaleza_costo: 'VARIABLE' },
  { id: 'egr-imp-municipal', tipo: 'EGRESO', grupo: 'Impuestos', nombre: 'Impuesto Municipal (1%)', icono: '🏙️', es_estandar: true, naturaleza_costo: 'VARIABLE' },
  { id: 'egr-imp-patrimonio', tipo: 'EGRESO', grupo: 'Impuestos', nombre: 'Patrimonio', icono: '🏛️', es_estandar: true, naturaleza_costo: 'FIJO' },
  { id: 'egr-imp-contribucion', tipo: 'EGRESO', grupo: 'Impuestos', nombre: 'Contribución rural', icono: '🏡', es_estandar: true, naturaleza_costo: 'FIJO' },
  { id: 'egr-imp-aportes-patronales', tipo: 'EGRESO', grupo: 'Impuestos', nombre: 'Aportes Patronales', icono: '👥', es_estandar: true, naturaleza_costo: 'FIJO', es_recurrente_mensual: true },
  { id: 'egr-imp-otros', tipo: 'EGRESO', grupo: 'Impuestos', nombre: 'Otros impuestos', icono: '📑', es_estandar: true, naturaleza_costo: 'FIJO' },

  { id: 'egr-sanidad-vacunos', tipo: 'EGRESO', grupo: 'Sanidad', nombre: 'Vacunos', icono: '💊', es_estandar: true, naturaleza_costo: 'VARIABLE' },
  { id: 'egr-sanidad-lanares', tipo: 'EGRESO', grupo: 'Sanidad', nombre: 'Lanares', icono: '💉', es_estandar: true, naturaleza_costo: 'VARIABLE' },

  { id: 'egr-pasturas-semillas-forrajeros', tipo: 'EGRESO', grupo: 'Mantenimiento de Pasturas', nombre: 'Semillas cv. forrajeros', icono: '🌱', es_estandar: true, naturaleza_costo: 'VARIABLE' },
  { id: 'egr-pasturas-fert-forrajeros', tipo: 'EGRESO', grupo: 'Mantenimiento de Pasturas', nombre: 'Fertilizante cv. forrajeros', icono: '🌾', es_estandar: true, naturaleza_costo: 'VARIABLE' },
  { id: 'egr-pasturas-otros-forrajeros', tipo: 'EGRESO', grupo: 'Mantenimiento de Pasturas', nombre: 'Otros gastos cv. forrajeros', icono: '🧪', es_estandar: true, naturaleza_costo: 'VARIABLE' },
  { id: 'egr-pasturas-fert-comercial', tipo: 'EGRESO', grupo: 'Mantenimiento de Pasturas', nombre: 'Fertilizante cv. comercial', icono: '🚜', es_estandar: true, naturaleza_costo: 'VARIABLE' },
  { id: 'egr-pasturas-semilla-comercial', tipo: 'EGRESO', grupo: 'Mantenimiento de Pasturas', nombre: 'Semilla cv. comercial', icono: '🌻', es_estandar: true, naturaleza_costo: 'VARIABLE' },
  { id: 'egr-pasturas-otros-comercial', tipo: 'EGRESO', grupo: 'Mantenimiento de Pasturas', nombre: 'Otros gastos cv. comercial', icono: '📦', es_estandar: true, naturaleza_costo: 'VARIABLE' },

  { id: 'egr-maq-patentes-seguros', tipo: 'EGRESO', grupo: 'Maquinaria y Vehículos', nombre: 'Patentes y seguros', icono: '📋', es_estandar: true, naturaleza_costo: 'FIJO' },
  { id: 'egr-maq-comb-auto', tipo: 'EGRESO', grupo: 'Maquinaria y Vehículos', nombre: 'Comb. y Lubr. auto-camioneta', icono: '⛽', es_estandar: true, naturaleza_costo: 'VARIABLE' },
  { id: 'egr-maq-comb-otros', tipo: 'EGRESO', grupo: 'Maquinaria y Vehículos', nombre: 'Combustibles y Lubr. Otros', icono: '🛢️', es_estandar: true, naturaleza_costo: 'VARIABLE' },
  { id: 'egr-maq-repar-auto', tipo: 'EGRESO', grupo: 'Maquinaria y Vehículos', nombre: 'Repar. y mant. auto-camioneta', icono: '🛞', es_estandar: true, naturaleza_costo: 'VARIABLE' },
  { id: 'egr-maq-repar-otros', tipo: 'EGRESO', grupo: 'Maquinaria y Vehículos', nombre: 'Repar. y mant. Otro', icono: '🔧', es_estandar: true, naturaleza_costo: 'VARIABLE' },

  { id: 'egr-rentas-arrendamientos', tipo: 'EGRESO', grupo: 'Pago de Rentas', nombre: 'Arrendamientos', icono: '🏡', es_estandar: true, naturaleza_costo: 'FIJO' },
  { id: 'egr-rentas-pastoreos', tipo: 'EGRESO', grupo: 'Pago de Rentas', nombre: 'Pastoreos', icono: '🌿', es_estandar: true, naturaleza_costo: 'VARIABLE' },
  { id: 'egr-rentas-capitalizacion', tipo: 'EGRESO', grupo: 'Pago de Rentas', nombre: 'Ganado a capitalización', icono: '📊', es_estandar: true, naturaleza_costo: 'VARIABLE' },

  { id: 'egr-serv-fletes', tipo: 'EGRESO', grupo: 'Servicios Contratados', nombre: 'Fletes', icono: '🚛', es_estandar: true, naturaleza_costo: 'VARIABLE' },
  { id: 'egr-serv-comisiones', tipo: 'EGRESO', grupo: 'Servicios Contratados', nombre: 'Comisiones', icono: '🤝', es_estandar: true, naturaleza_costo: 'VARIABLE' },
  { id: 'egr-serv-esquila', tipo: 'EGRESO', grupo: 'Servicios Contratados', nombre: 'Esquila', icono: '✂️', es_estandar: true, naturaleza_costo: 'VARIABLE' },
  { id: 'egr-serv-maquinaria', tipo: 'EGRESO', grupo: 'Servicios Contratados', nombre: 'Maquinaria', icono: '🚜', es_estandar: true, naturaleza_costo: 'VARIABLE' },
  { id: 'egr-serv-seguros-produccion', tipo: 'EGRESO', grupo: 'Servicios Contratados', nombre: 'Seguros producción', icono: '🛡️', es_estandar: true, naturaleza_costo: 'FIJO' },

  { id: 'egr-adm-sueldo-administrador', tipo: 'EGRESO', grupo: 'Gastos de Administración', nombre: 'Sueldo administrador', icono: '💼', es_estandar: true, naturaleza_costo: 'FIJO', es_recurrente_mensual: true },
  { id: 'egr-adm-honorarios', tipo: 'EGRESO', grupo: 'Gastos de Administración', nombre: 'Pago de Honorarios', icono: '📜', es_estandar: true, naturaleza_costo: 'FIJO' },
  { id: 'egr-adm-escritorio', tipo: 'EGRESO', grupo: 'Gastos de Administración', nombre: 'Gastos de Escritorio', icono: '📑', es_estandar: true, naturaleza_costo: 'FIJO' },

  { id: 'egr-est-antel', tipo: 'EGRESO', grupo: 'Otros Gastos de Estructura', nombre: 'ANTEL', icono: '📞', es_estandar: true, naturaleza_costo: 'FIJO', es_recurrente_mensual: true },
  { id: 'egr-est-ute', tipo: 'EGRESO', grupo: 'Otros Gastos de Estructura', nombre: 'UTE', icono: '⚡', es_estandar: true, naturaleza_costo: 'FIJO', es_recurrente_mensual: true },
  { id: 'egr-est-conservacion-fijas', tipo: 'EGRESO', grupo: 'Otros Gastos de Estructura', nombre: 'Conservación de M.Fijas', icono: '🛠️', es_estandar: true, naturaleza_costo: 'FIJO' },

  { id: 'egr-inv-maquinaria', tipo: 'EGRESO', grupo: 'Inversiones', nombre: 'Inversiones maquinaria', icono: '🚜', es_estandar: true, naturaleza_costo: 'VARIABLE' },
  { id: 'egr-inv-mejoras-fijas', tipo: 'EGRESO', grupo: 'Inversiones', nombre: 'Inversiones mejoras fijas', icono: '🏗️', es_estandar: true, naturaleza_costo: 'VARIABLE' },
  { id: 'egr-inv-pasturas', tipo: 'EGRESO', grupo: 'Inversiones', nombre: 'Inversiones pasturas', icono: '🌱', es_estandar: true, naturaleza_costo: 'VARIABLE' },
  { id: 'egr-inv-tierra', tipo: 'EGRESO', grupo: 'Inversiones', nombre: 'Inversiones Tierra', icono: '🏞️', es_estandar: true, naturaleza_costo: 'VARIABLE' },
  { id: 'egr-inv-otras', tipo: 'EGRESO', grupo: 'Inversiones', nombre: 'Inversiones Otras', icono: '💡', es_estandar: true, naturaleza_costo: 'VARIABLE' },

  { id: 'egr-gastos-suplementacion', tipo: 'EGRESO', grupo: 'Otros Gastos', nombre: 'Suplementación', icono: '🌾', es_estandar: true, naturaleza_costo: 'VARIABLE' },
  { id: 'egr-gastos-otros-vacunos', tipo: 'EGRESO', grupo: 'Otros Gastos', nombre: 'Otros gastos vacunos', icono: '🐮', es_estandar: true, naturaleza_costo: 'VARIABLE' },
  { id: 'egr-gastos-otros-lanares', tipo: 'EGRESO', grupo: 'Otros Gastos', nombre: 'Otros gastos lanares', icono: '🐑', es_estandar: true, naturaleza_costo: 'VARIABLE' },
  { id: 'egr-gastos-varios', tipo: 'EGRESO', grupo: 'Otros Gastos', nombre: 'Otros gastos varios', icono: '📦', es_estandar: true, naturaleza_costo: 'VARIABLE' },

  { id: 'egr-deuda-amortizacion', tipo: 'EGRESO', grupo: 'Servicio de Deuda', nombre: 'Amortización', icono: '🏦', es_estandar: true, naturaleza_costo: 'FIJO' },
  { id: 'egr-deuda-intereses', tipo: 'EGRESO', grupo: 'Servicio de Deuda', nombre: 'Intereses', icono: '📈', es_estandar: true, naturaleza_costo: 'FIJO' },

  { id: 'egr-retiros-personales', tipo: 'EGRESO', grupo: 'Retiros', nombre: 'Retiros personales', icono: '👤', es_estandar: true, naturaleza_costo: 'FIJO' },
];

const IDs_INICIALES_ACTIVOS: string[] = [
  'ing-vacunos',
  'ing-lanares',
  'ing-lana',
  'ing-cereales',
  'ing-brou',
  'ing-pastoreos',
  'ing-servicios',
  'egr-sueldos-jornales',
  'egr-comestibles',
  'egr-leyes-sociales',
  'egr-sanidad-vacunos',
  'egr-sanidad-lanares',
  'egr-pasturas-semillas-forrajeros',
  'egr-maq-comb-auto',
  'egr-rentas-arrendamientos',
  'egr-serv-fletes',
  'egr-adm-sueldo-administrador',
  'egr-est-antel',
  'egr-est-ute',
];

import { obtenerConceptosFinancierosBD, supabase } from '../services/supabase';

interface ConceptosStoreState {
  catalog: ConceptoFinanciero[];
  conceptosActivosIds: string[];
  cargando: boolean;
  cargarConceptosDesdeSupabase: () => Promise<void>;
  toggleConcepto: (conceptoId: string) => void;
  activarTodosGrupo: (grupo: string, activar: boolean) => void;
  obtenerConceptosPorTipo: (tipo: TipoTransaccion) => ConceptoFinanciero[];
  obtenerConceptosActivosPorTipo: (tipo: TipoTransaccion) => ConceptoFinanciero[];
  obtenerGruposPorTipo: (tipo: TipoTransaccion) => string[];
  esConceptoActivo: (conceptoId: string) => boolean;
  agregarConceptoPersonalizado: (nuevo: Omit<ConceptoFinanciero, 'id' | 'es_estandar'>) => ConceptoFinanciero;
}

export const useConceptosFinancierosStore = create<ConceptosStoreState>()(
  persist(
    (set, get) => ({
      catalog: CATALOGO_PLAN_AGROPECUARIO,
      conceptosActivosIds: IDs_INICIALES_ACTIVOS,
      cargando: false,

      cargarConceptosDesdeSupabase: async () => {
        set({ cargando: true });
        const datosBD = await obtenerConceptosFinancierosBD();
        if (datosBD && datosBD.length > 0) {
          set({
            catalog: datosBD,
            conceptosActivosIds: datosBD.map((c) => c.id),
            cargando: false,
          });
        } else {
          set({ cargando: false });
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

      agregarConceptoPersonalizado: (nuevoData) => {
        const newId = `custom-${Date.now()}`;
        const nuevoConcepto: ConceptoFinanciero = {
          ...nuevoData,
          id: newId,
          es_estandar: false,
        };

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
