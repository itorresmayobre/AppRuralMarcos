import type { ConceptoFinanciero } from '../types';

export const CONCEPTOS_ESTANDAR: ConceptoFinanciero[] = [
  // INGRESOS
  { id: 'c-ing-1', tipo: 'INGRESO', grupo: 'Venta de Hacienda', nombre: 'Venta Vacunos (Faena / Exportación)', icono: '🐂', es_estandar: true },
  { id: 'c-ing-2', tipo: 'INGRESO', grupo: 'Venta de Hacienda', nombre: 'Venta Ovinos', icono: '🐑', es_estandar: true },
  { id: 'c-ing-3', tipo: 'INGRESO', grupo: 'Venta de Productos', nombre: 'Venta de Lana', icono: '🌾', es_estandar: true },
  { id: 'c-ing-4', tipo: 'INGRESO', grupo: 'Venta de Productos', nombre: 'Venta de Leche / Lácteos', icono: '🥛', es_estandar: true },
  { id: 'c-ing-5', tipo: 'INGRESO', grupo: 'Agronomía & Granos', nombre: 'Venta de Granos (Soja, Trigo, Maíz)', icono: '🌽', es_estandar: true },
  { id: 'c-ing-6', tipo: 'INGRESO', grupo: 'Servicios & Otros', nombre: 'Pastoreos Cobrados', icono: '🌱', es_estandar: true },
  { id: 'c-ing-7', tipo: 'INGRESO', grupo: 'Servicios & Otros', nombre: 'Servicios de Maquinaria a Terceros', icono: '🚜', es_estandar: true },

  // EGRESOS - VARIABLE
  { id: 'c-egr-1', tipo: 'EGRESO', grupo: 'Alimentación & Suplementos', nombre: 'Ración, Fardos y Suplementación', icono: '🌾', es_estandar: true, naturaleza_costo: 'VARIABLE' },
  { id: 'c-egr-2', tipo: 'EGRESO', grupo: 'Sanidad & Veterinaria', nombre: 'Vacunas, Específicos y Veterinaria', icono: '💉', es_estandar: true, naturaleza_costo: 'VARIABLE' },
  { id: 'c-egr-3', tipo: 'EGRESO', grupo: 'Pasturas & Insumos', nombre: 'Semillas, Fertilizantes y Agroquímicos', icono: '🌱', es_estandar: true, naturaleza_costo: 'VARIABLE' },
  { id: 'c-egr-4', tipo: 'EGRESO', grupo: 'Logística & Fletes', nombre: 'Fletes y Comisiones Ferias/Consignatarios', icono: '🚛', es_estandar: true, naturaleza_costo: 'VARIABLE' },
  { id: 'c-egr-5', tipo: 'EGRESO', grupo: 'Combustible & Reparaciones', nombre: 'Gasoil, Lubricantes y Repuestos', icono: '⛽', es_estandar: true, naturaleza_costo: 'VARIABLE' },

  // EGRESOS - FIJO
  { id: 'c-egr-6', tipo: 'EGRESO', grupo: 'Personal & Mano de Obra', nombre: 'Sueldos, Jornales y BPS (BPS Rural)', icono: '👥', es_estandar: true, naturaleza_costo: 'FIJO' },
  { id: 'c-egr-7', tipo: 'EGRESO', grupo: 'Arrendamientos & Impuestos', nombre: 'Arrendamiento de Campo & Contribución', icono: '🏡', es_estandar: true, naturaleza_costo: 'FIJO' },
  { id: 'c-egr-8', tipo: 'EGRESO', grupo: 'Administración & Asesoría', nombre: 'Honorarios Contables, DICOSE & Asesoría', icono: '💼', es_estandar: true, naturaleza_costo: 'FIJO' },
  { id: 'c-egr-9', tipo: 'EGRESO', grupo: 'Servicios Generales', nombre: 'Electricidad (UTE), Comunicaciones y Seguros', icono: '⚡', es_estandar: true, naturaleza_costo: 'FIJO' },
];
