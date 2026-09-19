import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StockGanadero, MovimientoGanado, EspecieGanado, CategoriaVacuno, CategoriaOvino } from '../types';
import { obtenerStockGanaderoBD, guardarStockGanaderoBD, supabase } from '../services/supabase';

interface GanadoState {
  stockList: StockGanadero[];
  movimientos: MovimientoGanado[];
  cargando: boolean;
  inicializado: boolean;
  cargarGanadoDesdeSupabase: () => Promise<void>;
  actualizarStock: (item: {
    id?: string;
    estancia_id: string;
    especie: EspecieGanado;
    categoria: CategoriaVacuno | CategoriaOvino;
    cabezas: number;
    kilos_promedio?: number;
  }) => Promise<void>;
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
      inicializado: false,

      cargarGanadoDesdeSupabase: async () => {
        set({ cargando: true });
        const datosStock = await obtenerStockGanaderoBD();

        let datosMovimientos: MovimientoGanado[] = [];
        try {
          const { data } = await supabase
            .from('movimientos_ganado')
            .select('*')
            .order('created_at', { ascending: false });

          if (data) {
            datosMovimientos = data.map((m: any) => ({
              ...m,
              valorizar_transferencia: (m.monto_total_imputado || 0) > 0,
              precio_por_cabeza: m.cabezas > 0 ? (m.monto_total_imputado || 0) / m.cabezas : 0,
              creado_por_usuario: m.creado_por || 'usuario.actual',
            }));
          }
        } catch (e) {
          console.warn('Error al cargar movimientos_ganado desde Supabase:', e);
        }

        set({
          stockList: datosStock || [],
          movimientos: datosMovimientos,
          cargando: false,
          inicializado: true,
        });
      },

      actualizarStock: async (itemData) => {
        const stockGuardado = await guardarStockGanaderoBD(itemData);
        const fechaActual = stockGuardado?.ultima_actualizacion || new Date().toISOString();

        set((state) => {
          const idx = state.stockList.findIndex(
            (s) => (s.id && s.id === itemData.id) || (s.estancia_id === itemData.estancia_id && s.especie === itemData.especie && s.categoria === itemData.categoria)
          );

          if (idx >= 0) {
            const copia = [...state.stockList];
            copia[idx] = {
              ...copia[idx],
              id: stockGuardado?.id || copia[idx].id,
              cabezas: itemData.cabezas,
              kilos_promedio: itemData.kilos_promedio !== undefined ? itemData.kilos_promedio : copia[idx].kilos_promedio,
              ultima_actualizacion: fechaActual,
            };
            return { stockList: copia };
          } else {
            const nuevoItem: StockGanadero = {
              id: stockGuardado?.id || `temp-${Date.now()}`,
              estancia_id: itemData.estancia_id,
              especie: itemData.especie,
              categoria: itemData.categoria,
              cabezas: itemData.cabezas,
              kilos_promedio: itemData.kilos_promedio || 0,
              ultima_actualizacion: fechaActual,
            };
            return { stockList: [...state.stockList, nuevoItem] };
          }
        });
      },

      registrarMovimiento: async (movData) => {
        const newId = `mov-${Date.now()}`;
        const nuevoMovimiento: MovimientoGanado = {
          ...movData,
          id: newId,
          creado_por_usuario: 'usuario.actual',
        };

        const currentStock = get().stockList;
        const stockOrigen = currentStock.find(
          (s) => s.estancia_id === movData.estancia_origen_id && s.especie === movData.especie && s.categoria === movData.categoria
        );
        const stockDestino = currentStock.find(
          (s) => s.estancia_id === movData.estancia_destino_id && s.especie === movData.especie && s.categoria === movData.categoria
        );

        const cabezasOrigenNuevas = Math.max(0, (stockOrigen?.cabezas || 0) - movData.cabezas);
        const cabezasDestinoNuevas = (stockDestino?.cabezas || 0) + movData.cabezas;

        try {
          // 1. Guardar el movimiento en Supabase
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
            monto_total_imputado: movData.monto_total_imputado || 0,
          }]);

          // 2. Persistir stock actualizado en Supabase (Origen y Destino)
          if (stockOrigen) {
            await guardarStockGanaderoBD({
              id: stockOrigen.id,
              estancia_id: movData.estancia_origen_id,
              especie: movData.especie,
              categoria: movData.categoria,
              cabezas: cabezasOrigenNuevas,
              kilos_promedio: stockOrigen.kilos_promedio || movData.kilos_promedio || 0,
            });
          }

          await guardarStockGanaderoBD({
            id: stockDestino?.id,
            estancia_id: movData.estancia_destino_id,
            especie: movData.especie,
            categoria: movData.categoria,
            cabezas: cabezasDestinoNuevas,
            kilos_promedio: stockDestino?.kilos_promedio || movData.kilos_promedio || 0,
          });
        } catch (e) {
          console.warn('Error registrando movimiento y actualizando stock en Supabase:', e);
        }

        // 3. Actualizar memoria local en Zustand
        set((state) => {
          let destinoEncontrado = false;
          const updatedStock = state.stockList.map((item) => {
            if (
              item.estancia_id === movData.estancia_origen_id &&
              item.especie === movData.especie &&
              item.categoria === movData.categoria
            ) {
              return { ...item, cabezas: cabezasOrigenNuevas, ultima_actualizacion: movData.fecha };
            }
            if (
              item.estancia_id === movData.estancia_destino_id &&
              item.especie === movData.especie &&
              item.categoria === movData.categoria
            ) {
              destinoEncontrado = true;
              return { ...item, cabezas: cabezasDestinoNuevas, ultima_actualizacion: movData.fecha };
            }
            return item;
          });

          if (!destinoEncontrado) {
            updatedStock.push({
              id: stockDestino?.id || `temp-${Date.now()}`,
              estancia_id: movData.estancia_destino_id,
              especie: movData.especie,
              categoria: movData.categoria,
              cabezas: cabezasDestinoNuevas,
              kilos_promedio: movData.kilos_promedio || 0,
              ultima_actualizacion: movData.fecha,
            });
          }

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
