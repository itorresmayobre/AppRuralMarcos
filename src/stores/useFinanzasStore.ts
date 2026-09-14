import { create } from 'zustand';
import type { TransaccionFinanciera } from '../types';

interface FinanzasState {
  transacciones: TransaccionFinanciera[];
  agregarTransaccion: (nueva: Omit<TransaccionFinanciera, 'id' | 'creado_por_usuario'>) => void;
  obtenerTransaccionesEstancia: (estanciaId: string) => TransaccionFinanciera[];
}

const mockTransaccionesIniciales: TransaccionFinanciera[] = [
  { 
    id: 't-prorrateo-1', 
    estancia_id: 'TODAS', 
    tipo: 'EGRESO', 
    moneda: 'UYU', 
    monto: 120000, 
    categoria: 'Sueldo administrador', 
    descripcion: 'Sueldo mensual Administración General Empresa', 
    fecha: '2026-09-12', 
    creado_por_usuario: 'marcos.propietario',
    naturaleza_costo: 'FIJO',
    es_prorrateado: true,
    distribucion_prorrateo: [
      { estancia_id: 'est-1', porcentaje: 35, monto: 42000 },
      { estancia_id: 'est-2', porcentaje: 24, monto: 28800 },
      { estancia_id: 'est-3', porcentaje: 41, monto: 49200 }
    ],
    moneda_original: 'UYU',
    monto_original: 120000,
    tipo_cambio: 40.50,
    monto_usd: 2962.96,
    monto_uyu: 120000
  },
  { 
    id: 't-prorrateo-2', 
    estancia_id: 'TODAS', 
    tipo: 'EGRESO', 
    moneda: 'UYU', 
    monto: 45000, 
    categoria: 'Pago de Honorarios', 
    descripcion: 'Honorarios Contables y Asesoría Fiscal', 
    fecha: '2026-09-11', 
    creado_por_usuario: 'marcos.propietario',
    naturaleza_costo: 'FIJO',
    es_prorrateado: true,
    distribucion_prorrateo: [
      { estancia_id: 'est-1', porcentaje: 35, monto: 15750 },
      { estancia_id: 'est-2', porcentaje: 24, monto: 10800 },
      { estancia_id: 'est-3', porcentaje: 41, monto: 18450 }
    ],
    moneda_original: 'UYU',
    monto_original: 45000,
    tipo_cambio: 40.50,
    monto_usd: 1111.11,
    monto_uyu: 45000
  },
  { 
    id: 't1', 
    estancia_id: 'est-1', 
    tipo: 'INGRESO', 
    moneda: 'USD', 
    monto: 48500, 
    categoria: 'VENTA_HACIENDA', 
    descripcion: 'Venta 95 Novillos 2-3 años remate Lote 21', 
    fecha: '2026-09-08', 
    creado_por_usuario: 'marcos.propietario' 
  },
  { 
    id: 't2', 
    estancia_id: 'est-1', 
    tipo: 'EGRESO', 
    moneda: 'USD', 
    monto: 12300, 
    categoria: 'INSUMOS_VETERINARIOS', 
    descripcion: 'Vacunación Aftosa y dosificación otoñal', 
    fecha: '2026-09-05', 
    creado_por_usuario: 'marcos.propietario' 
  },
  { 
    id: 't3', 
    estancia_id: 'est-1', 
    tipo: 'EGRESO', 
    moneda: 'UYU', 
    monto: 185000, 
    categoria: 'COMBUSTIBLE', 
    descripcion: 'Gasoil 3.500 Litros para tractores', 
    fecha: '2026-09-02', 
    creado_por_usuario: 'marcos.propietario' 
  },
  { 
    id: 't4', 
    estancia_id: 'est-2', 
    tipo: 'INGRESO', 
    moneda: 'USD', 
    monto: 29000, 
    categoria: 'VENTA_HACIENDA', 
    descripcion: 'Venta Terneros destete', 
    fecha: '2026-09-10', 
    creado_por_usuario: 'juan.perez' 
  },
];

export const useFinanzasStore = create<FinanzasState>((set, get) => ({
  transacciones: mockTransaccionesIniciales,

  agregarTransaccion: (nuevaData) => {
    const nueva: TransaccionFinanciera = {
      ...nuevaData,
      id: `t-${Date.now()}`,
      creado_por_usuario: 'usuario.actual',
    };

    set((state) => ({
      transacciones: [nueva, ...state.transacciones],
    }));
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
