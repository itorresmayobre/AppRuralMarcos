import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StockGanadero, MovimientoGanado } from '../types';
import { obtenerStockGanaderoBD, supabase } from '../services/supabase';

interface GanadoState {
  stockList: StockGanadero[];
  movimientos: MovimientoGanado[];
  cargando: boolean;
  cargarGanadoDesdeSupabase: () => Promise<void>;
  registrarMovimiento: (mov: Omit<MovimientoGanado, 'id' | 'creado_por_usuario'>) => Promise<void>;
  obtenerStockEstancia: (estanciaId: string) => StockGanadero[];
  obtenerMovimientosEstancia: (estanciaId: string) => MovimientoGanado[];
}

export const useGanadoStore = create<GanadoState>()(
  persist(
    (set, get) => ({
      stockList: [],
      movimientos: [],
      cargando: false,

      cargarGanadoDesdeSupabase: async () => {
        set({ cargando: true });
        const datosStock = await obtenerStockGanaderoBD();
        if (datosStock && datosStock.length > 0) {
          set({ stockList: datosStock, cargando: false });
        } else {
          set({ cargando: false });
        }
      },

      registrarMovimiento: async (movData) => {
        const newId = `mov-${Date.now()}`;
        const nuevoMovimiento: MovimientoGanado = {
          ...movData,
          id: newId,
          creado_por_usuario: 'usuario.actual',
        };

        try {
          await supabase.from('movimientos_ganado').insert([{
            estancia_origen_id: movData.estancia_origen_id,
            estancia_destino_id: movData.estancia_destino_id,
            especie: movData.especie,
            categoria: movData.categoria,
            cabezas: movData.cabezas,
            kilos_totales: movData.kilos_totales,
            kilos_promedio: movData.kilos_promedio,
            fecha: movData.fecha,
            observaciones: movData.observaciones,
            valorizar_transferencia: movData.valorizar_transferencia,
            precio_por_cabeza: movData.precio_por_cabeza,
            precio_por_kilo: movData.precio_por_kilo,
            monto_total_imputado: movData.monto_total_imputado,
          }]);
        } catch (e) {
          console.warn('Error registrando movimiento en Supabase:', e);
        }

        set((state) => {
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
