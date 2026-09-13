import { create } from 'zustand';
import type { TransaccionFinanciera } from '../types';

interface FinanzasState {
  transacciones: TransaccionFinanciera[];
  agregarTransaccion: (nueva: Omit<TransaccionFinanciera, 'id' | 'creado_por_usuario'>) => void;
  obtenerTransaccionesEstancia: (estanciaId: string) => TransaccionFinanciera[];
}

const mockTransaccionesIniciales: TransaccionFinanciera[] = [
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
    return transacciones.filter((t) => t.estancia_id === estanciaId);
  },
}));
