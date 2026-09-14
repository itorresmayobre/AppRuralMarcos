import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StockGanadero, MovimientoGanado } from '../types';

interface GanadoState {
  stockList: StockGanadero[];
  movimientos: MovimientoGanado[];
  registrarMovimiento: (mov: Omit<MovimientoGanado, 'id' | 'creado_por_usuario'>) => void;
  obtenerStockEstancia: (estanciaId: string) => StockGanadero[];
  obtenerMovimientosEstancia: (estanciaId: string) => MovimientoGanado[];
}

const mockStockInicial: StockGanadero[] = [
  // Estancia La Cruz (est-1)
  { id: 'st-1', estancia_id: 'est-1', especie: 'VACUNO', categoria: 'VACAS_DE_CRIA', cabezas: 420, kilos_promedio: 420, ultima_actualizacion: '2026-09-10' },
  { id: 'st-2', estancia_id: 'est-1', especie: 'VACUNO', categoria: 'TERNEROS', cabezas: 280, kilos_promedio: 165, ultima_actualizacion: '2026-09-10' },
  { id: 'st-3', estancia_id: 'est-1', especie: 'VACUNO', categoria: 'NOVILLOS_1_2', cabezas: 145, kilos_promedio: 290, ultima_actualizacion: '2026-09-10' },
  { id: 'st-4', estancia_id: 'est-1', especie: 'OVINO', categoria: 'OVEJAS_CRIA', cabezas: 350, kilos_promedio: 48, ultima_actualizacion: '2026-09-10' },

  // Campo El Donoso (est-2)
  { id: 'st-5', estancia_id: 'est-2', especie: 'VACUNO', categoria: 'NOVILLOS_MAS_2', cabezas: 310, kilos_promedio: 440, ultima_actualizacion: '2026-09-10' },
  { id: 'st-6', estancia_id: 'est-2', especie: 'VACUNO', categoria: 'TERNEROS', cabezas: 190, kilos_promedio: 170, ultima_actualizacion: '2026-09-10' },
  { id: 'st-7', estancia_id: 'est-2', especie: 'OVINO', categoria: 'CAPONES', cabezas: 210, kilos_promedio: 52, ultima_actualizacion: '2026-09-10' },
];

const mockMovimientosIniciales: MovimientoGanado[] = [
  {
    id: 'mov-1',
    estancia_origen_id: 'est-1', // La Cruz (Cría)
    estancia_destino_id: 'est-2', // El Donoso (Recría)
    especie: 'VACUNO',
    categoria: 'TERNEROS',
    cabezas: 50,
    kilos_promedio: 160,
    kilos_totales: 8000,
    fecha: '2026-09-01',
    observaciones: 'Traslado destete de otoño para recría en pastura',
    valorizar_transferencia: true,
    precio_por_cabeza: 350,
    precio_por_kilo: 2.18,
    monto_total_imputado: 17500,
    creado_por_usuario: 'marcos.propietario'
  }
];

export const useGanadoStore = create<GanadoState>()(
  persist(
    (set, get) => ({
      stockList: mockStockInicial,
      movimientos: mockMovimientosIniciales,

      registrarMovimiento: (movData) => {
        const newId = `mov-${Date.now()}`;
        const nuevoMovimiento: MovimientoGanado = {
          ...movData,
          id: newId,
          creado_por_usuario: 'marcos.propietario',
        };

        set((state) => {
          // Actualizar stock de origen (decrementar) y destino (incrementar)
          const updatedStock = state.stockList.map((item) => {
            if (
              item.estancia_id === movData.estancia_origen_id &&
              item.especie === movData.especie &&
              item.categoria === movData.categoria
            ) {
              return { ...item, cabezas: Math.max(0, item.cabezas - movData.cabezas), ultima_actualizacion: movData.fecha };
            }
            if (
              item.estancia_id === movData.estancia_destino_id &&
              item.especie === movData.especie &&
              item.categoria === movData.categoria
            ) {
              return { ...item, cabezas: item.cabezas + movData.cabezas, ultima_actualizacion: movData.fecha };
            }
            return item;
          });

          return {
            movimientos: [nuevoMovimiento, ...state.movimientos],
            stockList: updatedStock,
          };
        });
      },

      obtenerStockEstancia: (estanciaId: string) => {
        const { stockList } = get();
        if (estanciaId === 'TODAS') return stockList;
        return stockList.filter((s) => s.estancia_id === estanciaId);
      },

      obtenerMovimientosEstancia: (estanciaId: string) => {
        const { movimientos } = get();
        if (estanciaId === 'TODAS') return movimientos;
        return movimientos.filter(
          (m) => m.estancia_origen_id === estanciaId || m.estancia_destino_id === estanciaId
        );
      },
    }),
    {
      name: 'ganado-agro-uy-storage',
    }
  )
);
