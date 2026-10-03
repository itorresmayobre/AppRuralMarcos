import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StockGanadero, MovimientoGanado, EspecieGanado, CategoriaVacuno, CategoriaOvino } from '../types';
import { obtenerStockGanaderoBD, guardarStockGanaderoBD, supabase } from '../services/supabase';
import { useAuthStore } from './useAuthStore';

interface GanadoState {
  stockList: StockGanadero[];
  movimientos: MovimientoGanado[];
  categoriasBD: { especie: EspecieGanado; categoria: string; descripcion: string }[];
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
      categoriasBD: [],
      cargando: false,
      inicializado: false,

      cargarGanadoDesdeSupabase: async () => {
        set({ cargando: true });
        const datosStock = await obtenerStockGanaderoBD();

        let datosCategorias: { especie: EspecieGanado; categoria: string; descripcion: string }[] = [];
        try {
          const { data: cats } = await supabase
            .from('configuracion_equivalencias_ug')
            .select('especie, categoria, descripcion');

          if (cats && cats.length > 0) {
            datosCategorias = cats.map((c) => ({
              especie: c.especie as EspecieGanado,
              categoria: c.categoria,
              descripcion: c.descripcion || c.categoria.replace(/_/g, ' '),
            }));
          }
        } catch (e) {
          console.warn('Error cargando equivalencias UG de Supabase:', e);
        }

        let datosMovimientos: MovimientoGanado[] = [];
        try {
          const { data: perfiles } = await supabase.from('perfiles').select('id, nombre, apellido, email');
          const mapaPerfiles = new Map<string, string>();
          if (perfiles) {
            perfiles.forEach((p) => {
              const nom = `${p.nombre || ''} ${p.apellido || ''}`.trim() || p.email || 'Usuario';
              mapaPerfiles.set(p.id, nom);
            });
          }

          const { data } = await supabase
            .from('movimientos_ganado')
            .select('*')
            .order('created_at', { ascending: false });

          if (data) {
            datosMovimientos = data.map((m: any) => {
              const idCreador = m.creado_por || m.usuario_id || m.creado_por_usuario;
              const esUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(idCreador || '');
              const nombreResolvido = esUUID ? (mapaPerfiles.get(idCreador) || 'Usuario') : (idCreador || 'Usuario');

              return {
                ...m,
                valorizar_transferencia: (m.monto_total_imputado || 0) > 0,
                precio_por_cabeza: m.cabezas > 0 ? (m.monto_total_imputado || 0) / m.cabezas : 0,
                creado_por_usuario: nombreResolvido,
              };
            });
          }
        } catch (e) {
          console.warn('Error al cargar movimientos_ganado desde Supabase:', e);
        }

        set({
          stockList: datosStock || [],
          movimientos: datosMovimientos,
          categoriasBD: datosCategorias,
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
        const currentStock = get().stockList;
        const tipo = movData.tipo_movimiento || 'TRASLADO';

        if (tipo === 'CAMBIO_CATEGORIA' && movData.estancia_origen_id && movData.categoria_destino) {
          const catDestino = movData.categoria_destino as any;

          const stockOrigen = currentStock.find(
            (s) => s.estancia_id === movData.estancia_origen_id && s.especie === movData.especie && s.categoria === movData.categoria
          );
          const stockDestino = currentStock.find(
            (s) => s.estancia_id === movData.estancia_origen_id && s.especie === movData.especie && s.categoria === catDestino
          );

          try {
            const usuario = useAuthStore.getState().usuario;
            const usuarioId = usuario?.id || null;

            await supabase.from('movimientos_ganado').insert([{
              estancia_origen_id: movData.estancia_origen_id,
              estancia_destino_id: movData.estancia_origen_id,
              tipo_movimiento: 'CAMBIO_CATEGORIA',
              especie: movData.especie,
              categoria: movData.categoria,
              cabezas: movData.cabezas,
              kilos_totales: movData.kilos_totales || null,
              kilos_promedio: movData.kilos_promedio || null,
              fecha: movData.fecha,
              observaciones: movData.observaciones || `Recategorización a ${catDestino.replace(/_/g, ' ')}`,
              monto_total_imputado: 0,
              ...(usuarioId ? { creado_por: usuarioId } : {}),
            }]);

            // Restar de categoría origen
            const cabezasOrigenNuevas = Math.max(0, (stockOrigen?.cabezas || 0) - movData.cabezas);
            await guardarStockGanaderoBD({
              id: stockOrigen?.id,
              estancia_id: movData.estancia_origen_id,
              especie: movData.especie,
              categoria: movData.categoria,
              cabezas: cabezasOrigenNuevas,
              kilos_promedio: stockOrigen?.kilos_promedio || movData.kilos_promedio || 0,
            });

            // Sumar a categoría destino
            const cabezasDestinoNuevas = (stockDestino?.cabezas || 0) + movData.cabezas;
            await guardarStockGanaderoBD({
              id: stockDestino?.id,
              estancia_id: movData.estancia_origen_id,
              especie: movData.especie,
              categoria: catDestino,
              cabezas: cabezasDestinoNuevas,
              kilos_promedio: movData.kilos_promedio || stockOrigen?.kilos_promedio || stockDestino?.kilos_promedio || 0,
            });
          } catch (e) {
            console.warn('Error al registrar recategorización de ganado:', e);
          }

          await get().cargarGanadoDesdeSupabase();
          return;
        }

        const stockOrigen = movData.estancia_origen_id
          ? currentStock.find(
              (s) => s.estancia_id === movData.estancia_origen_id && s.especie === movData.especie && s.categoria === movData.categoria
            )
          : undefined;

        const stockDestino = movData.estancia_destino_id
          ? currentStock.find(
              (s) => s.estancia_id === movData.estancia_destino_id && s.especie === movData.especie && s.categoria === movData.categoria
            )
          : undefined;

        try {
          const usuario = useAuthStore.getState().usuario;
          const usuarioId = usuario?.id || null;

          // 1. Guardar el movimiento en Supabase
          await supabase.from('movimientos_ganado').insert([{
            estancia_origen_id: movData.estancia_origen_id || null,
            estancia_destino_id: movData.estancia_destino_id || null,
            tipo_movimiento: tipo,
            causa_baja: movData.causa_baja || null,
            transaccion_id: movData.transaccion_id || null,
            especie: movData.especie,
            categoria: movData.categoria,
            cabezas: movData.cabezas,
            kilos_totales: movData.kilos_totales || null,
            kilos_promedio: movData.kilos_promedio || null,
            fecha: movData.fecha,
            observaciones: movData.observaciones || null,
            monto_total_imputado: movData.monto_usd !== undefined ? movData.monto_usd : (movData.monto_total_imputado || 0),
            moneda: movData.moneda || 'USD',
            monto_usd: movData.monto_usd !== undefined ? movData.monto_usd : (movData.monto_total_imputado || 0),
            monto_uyu: movData.monto_uyu || null,
            tipo_cambio: movData.tipo_cambio || null,
            ...(usuarioId ? { creado_por: usuarioId } : {}),
          }]);

          // 2. Si hay estancia de Origen (Resta stock: Traslado, Venta, Mortandad)
          if (movData.estancia_origen_id) {
            const cabezasOrigenNuevas = Math.max(0, (stockOrigen?.cabezas || 0) - movData.cabezas);
            await guardarStockGanaderoBD({
              id: stockOrigen?.id,
              estancia_id: movData.estancia_origen_id,
              especie: movData.especie,
              categoria: movData.categoria,
              cabezas: cabezasOrigenNuevas,
              kilos_promedio: stockOrigen?.kilos_promedio || movData.kilos_promedio || 0,
            });
          }

          // 3. Si hay estancia de Destino (Suma stock: Traslado, Compra, Nacimiento)
          if (movData.estancia_destino_id) {
            const cabezasDestinoNuevas = (stockDestino?.cabezas || 0) + movData.cabezas;
            await guardarStockGanaderoBD({
              id: stockDestino?.id,
              estancia_id: movData.estancia_destino_id,
              especie: movData.especie,
              categoria: movData.categoria,
              cabezas: cabezasDestinoNuevas,
              kilos_promedio: movData.kilos_promedio || stockDestino?.kilos_promedio || 0,
            });
          }
        } catch (e) {
          console.warn('Error registrando movimiento y actualizando stock en Supabase:', e);
        }

        // 4. Re-cargar desde Supabase para mantener sincronía total
        await get().cargarGanadoDesdeSupabase();
      },

      obtenerStockEstancia: (estanciaId: string) => {
        const { stockList } = get();
        if (!estanciaId || estanciaId === 'TODAS' || estanciaId === 'TODOS') return stockList;
        return stockList.filter((s) => s.estancia_id === estanciaId);
      },

      obtenerMovimientosEstancia: (estanciaId: string) => {
        const { movimientos } = get();
        if (!estanciaId || estanciaId === 'TODAS' || estanciaId === 'TODOS') return movimientos;
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
