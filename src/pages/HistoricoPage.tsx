import React, { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { useEstanciasStore } from '../stores/useEstanciasStore';
import { useEmpresasStore } from '../stores/useEmpresasStore';
import { useFinanzasStore } from '../stores/useFinanzasStore';
import { supabase } from '../services/supabase';
import {
  calcularEjercicioYMesAgricola,
  obtenerEjercicioAgricolaActual
} from '../utils/periodoAgricola';
import { obtenerMontoEnMoneda } from '../utils/monedas';
import { CustomSelect, type SelectOption } from '../components/ui/CustomSelect';
import type { Moneda } from '../types';
import {
  History,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShieldAlert,
  MapPin,
  Building2,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Lock,
  Unlock,
  Loader2,
  AlertCircle
} from 'lucide-react';

export interface EstadoEjercicioBD {
  ejercicio: string;
  estado: 'ABIERTO' | 'CERRADO';
}

export interface ResumenEjercicioHistorico {
  ejercicio: string;
  esActual: boolean;
  estado: 'ABIERTO' | 'CERRADO';
  ingresos: number;
  egresos: number;
  resultadoNeto: number;
  hectareasTotales: number;
  margenPorHectarea: number;
  relacionEficiencia: number; // (Ingresos / Egresos) * 100
  variacionMargenPct: number | null; // % respecto al ejercicio anterior
}

export const HistoricoPage: React.FC = () => {
  const { usuario } = useAuthStore();
  const { estancias, estanciaSeleccionadaId, seleccionarEstancia } = useEstanciasStore();
  const { obtenerEmpresaActual } = useEmpresasStore();
  const { obtenerTransaccionesEstancia } = useFinanzasStore();

  const empresaActual = obtenerEmpresaActual();
  const currentRole = usuario?.rol || 'OPERARIO';
  const esAdminOPropietario = currentRole === 'ADMIN' || currentRole === 'PROPIETARIO' || currentRole === 'SUPERADMIN';
  const canAccess = esAdminOPropietario || currentRole === 'CONTADOR';

  const [estanciaFiltroId, setEstanciaFiltroId] = useState<string>(estanciaSeleccionadaId || 'TODAS');
  const [monedaFiltro, setMonedaFiltro] = useState<Moneda>('USD');
  const [estadosBD, setEstadosBD] = useState<Record<string, 'ABIERTO' | 'CERRADO'>>({});
  const [snapshotsBD, setSnapshotsBD] = useState<Record<string, number>>({});
  const [guardandoEstado, setGuardandoEstado] = useState<string | null>(null);

  // Sincronizar filtro local si cambia la estancia seleccionada globalmente (ej: desde el Navbar)
  useEffect(() => {
    if (estanciaSeleccionadaId) {
      setEstanciaFiltroId(estanciaSeleccionadaId);
    }
  }, [estanciaSeleccionadaId]);

  const ejercicioActual = useMemo(() => obtenerEjercicioAgricolaActual(), []);

  // Cargar estados y snapshots de ejercicios desde Supabase
  useEffect(() => {
    if (empresaActual?.id) {
      cargarEstadosEjercicios();
    }
  }, [empresaActual?.id]);

  const cargarEstadosEjercicios = async () => {
    if (!empresaActual?.id) return;
    try {
      const { data, error } = await supabase
        .from('ejercicios_agricolas_estado')
        .select('ejercicio, estado, carga_ug_ha_snapshot')
        .eq('empresa_id', empresaActual.id);

      if (!error && data) {
        const mapaEstados: Record<string, 'ABIERTO' | 'CERRADO'> = {};
        const mapaSnaps: Record<string, number> = {};
        data.forEach((row) => {
          mapaEstados[row.ejercicio] = row.estado as 'ABIERTO' | 'CERRADO';
          if (row.carga_ug_ha_snapshot !== null && row.carga_ug_ha_snapshot !== undefined) {
            mapaSnaps[row.ejercicio] = Number(row.carga_ug_ha_snapshot);
          }
        });
        setEstadosBD(mapaEstados);
        setSnapshotsBD(mapaSnaps);
      }
    } catch (err) {
      console.error('Error cargando estados de ejercicios:', err);
    }
  };

  const handleToggleEstadoEjercicio = async (ejercicio: string, nuevoEstado: 'ABIERTO' | 'CERRADO', cargaUgActual?: number) => {
    if (!esAdminOPropietario || !empresaActual?.id) return;
    setGuardandoEstado(ejercicio);

    try {
      const payload: Record<string, any> = {
        empresa_id: empresaActual.id,
        ejercicio,
        estado: nuevoEstado,
        cerrado_por: usuario?.id || null,
        cerrado_at: new Date().toISOString(),
      };

      if (nuevoEstado === 'CERRADO' && cargaUgActual != null) {
        payload.carga_ug_ha_snapshot = cargaUgActual;
      }

      const { error } = await supabase
        .from('ejercicios_agricolas_estado')
        .upsert(payload, { onConflict: 'empresa_id,ejercicio' });

      if (!error) {
        setEstadosBD((prev) => ({ ...prev, [ejercicio]: nuevoEstado }));
        if (nuevoEstado === 'CERRADO' && cargaUgActual != null) {
          setSnapshotsBD((prev) => ({ ...prev, [ejercicio]: cargaUgActual }));
        }
      } else {
        console.error('Error al actualizar estado del ejercicio:', error.message);
      }
    } catch (err) {
      console.error('Error inesperado al cambiar estado del ejercicio:', err);
    } finally {
      setGuardandoEstado(null);
    }
  };

  // Opciones para CustomSelect de Estancia
  const estanciaOptions: SelectOption[] = useMemo(() => [
    { value: 'TODOS', label: 'Consolidado Total Empresa' },
    ...estancias.map((est) => ({
      value: est.id,
      label: est.nombre,
      badge: `${est.hectareas_totales} Ha`,
      badgeColor: 'bg-emerald-100 text-emerald-900 border border-emerald-200',
    })),
  ], [estancias]);

  // Transacciones de la estancia seleccionada (sin filtrar por moneda, para convertir todas dinámicamente)
  const todasTransacciones = obtenerTransaccionesEstancia(estanciaFiltroId);

  // Generar datos agrupados ÚNICAMENTE por Ejercicios Agrícolas con datos reales
  const resumenEjercicios: ResumenEjercicioHistorico[] = useMemo(() => {
    // Extraer solo los ejercicios con fechas reales registradas
    const ejerciciosSet = new Set<string>();
    todasTransacciones.forEach((t) => {
      if (t.fecha) {
        const { ejercicio } = calcularEjercicioYMesAgricola(t.fecha);
        ejerciciosSet.add(t.ejercicio_agricola || ejercicio);
      }
    });

    const listaEjerciciosReales = Array.from(ejerciciosSet);

    const hectareasTotales = estanciaFiltroId === 'TODOS'
      ? estancias.reduce((a, b) => a + b.hectareas_totales, 0)
      : (estancias.find((e) => e.id === estanciaFiltroId)?.hectareas_totales || 1);

    const listaProcesada: ResumenEjercicioHistorico[] = listaEjerciciosReales.map((ej) => {
      const transaccionesDelEj = todasTransacciones.filter((t) => {
        const { ejercicio } = calcularEjercicioYMesAgricola(t.fecha);
        return (t.ejercicio_agricola || ejercicio) === ej;
      });

      const ingresos = transaccionesDelEj
        .filter((t) => t.tipo === 'INGRESO')
        .reduce((sum, t) => sum + obtenerMontoEnMoneda(t, monedaFiltro), 0);

      const egresos = transaccionesDelEj
        .filter((t) => t.tipo === 'EGRESO')
        .reduce((sum, t) => sum + obtenerMontoEnMoneda(t, monedaFiltro), 0);

      const resultadoNeto = ingresos - egresos;
      const margenPorHectarea = Math.round(resultadoNeto / (hectareasTotales || 1));
      const relacionEficiencia = egresos > 0 ? Math.round((ingresos / egresos) * 100) : (ingresos > 0 ? 100 : 0);

      const estadoActual = estadosBD[ej] || (ej === ejercicioActual ? 'ABIERTO' : 'CERRADO');

      return {
        ejercicio: ej,
        esActual: ej === ejercicioActual,
        estado: estadoActual,
        ingresos,
        egresos,
        resultadoNeto,
        hectareasTotales,
        margenPorHectarea,
        relacionEficiencia,
        variacionMargenPct: null,
      };
    });

    // Ordenar cronológicamente (más antiguo primero) para calcular la variación interanual
    listaProcesada.sort((a, b) => a.ejercicio.localeCompare(b.ejercicio));

    for (let i = 1; i < listaProcesada.length; i++) {
      const prev = listaProcesada[i - 1];
      const curr = listaProcesada[i];
      if (prev.margenPorHectarea !== 0) {
        const diff = curr.margenPorHectarea - prev.margenPorHectarea;
        curr.variacionMargenPct = Math.round((diff / Math.abs(prev.margenPorHectarea)) * 100);
      }
    }

    // Retornar en orden inverso (más reciente arriba)
    return listaProcesada.reverse();
  }, [todasTransacciones, estanciaFiltroId, estancias, ejercicioActual, estadosBD, monedaFiltro]);

  // Totales acumulados históricos
  const acumuladosTotales = useMemo(() => {
    const ingTotal = resumenEjercicios.reduce((sum, e) => sum + e.ingresos, 0);
    const egrTotal = resumenEjercicios.reduce((sum, e) => sum + e.egresos, 0);
    const netoTotal = ingTotal - egrTotal;
    const cantEjercicios = resumenEjercicios.length;
    const divisorEjercicios = Math.max(1, cantEjercicios);
    const haTotales = estanciaFiltroId === 'TODOS'
      ? estancias.reduce((a, b) => a + b.hectareas_totales, 0)
      : (estancias.find((e) => e.id === estanciaFiltroId)?.hectareas_totales || 1);

    const promedioMargenAnualHa = Math.round((netoTotal / divisorEjercicios) / (haTotales || 1));

    return {
      ingTotal,
      egrTotal,
      netoTotal,
      promedioMargenAnualHa,
      cantEjercicios,
    };
  }, [resumenEjercicios, estanciaFiltroId, estancias]);

  // Valor máximo para escala de barras comparativas
  const maxMontoEjercicio = useMemo(() => {
    let max = 1;
    resumenEjercicios.forEach((e) => {
      if (e.ingresos > max) max = e.ingresos;
      if (e.egresos > max) max = e.egresos;
    });
    return max;
  }, [resumenEjercicios]);

  if (!canAccess) {
    return (
      <main className="p-4 sm:p-6 max-w-lg mx-auto mt-6">
        <section aria-label="Acceso denegado al histórico" className="bg-amber-50 border border-amber-200/90 rounded-2xl p-6 text-center space-y-4 shadow-sm">
          <ShieldAlert className="w-12 h-12 text-amber-600 mx-auto" />
          <h2 className="text-lg font-extrabold text-amber-950">Acceso Restringido</h2>
          <p className="text-xs text-amber-800 leading-relaxed">
            El histórico comparativo de ejercicios agrícolas está reservado para roles de <strong>Administrador / Propietario</strong> y <strong>Contador</strong>.
          </p>
        </section>
      </main>
    );
  }

  return (
    <section aria-label="Histórico Completo y Comparativa Interanual" className="space-y-4 animate-fadeIn">
      {/* Encabezado */}
      <header className="app-card space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-950 border border-emerald-700/60 rounded-2xl text-emerald-400">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Histórico Completo de Ejercicios Agrícolas</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Comparativa interanual macro de ingresos, egresos y rentabilidad por hectárea año a año.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <span className="text-xs font-bold text-emerald-900 bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-emerald-700" />
              <span>{acumuladosTotales.cantEjercicios} Ejercicios Registrados</span>
            </span>
          </div>
        </div>

        {/* Filtros Macro (Establecimiento y Moneda) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <CustomSelect
              label="Filtrar Establecimiento:"
              value={estanciaFiltroId}
              options={estanciaOptions}
              onChange={(val) => {
                setEstanciaFiltroId(val);
                seleccionarEstancia(val);
              }}
              icon={<MapPin className="w-4 h-4 text-emerald-600" />}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-slate-500" />
              <span>Moneda de Análisis:</span>
            </label>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setMonedaFiltro('USD')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  monedaFiltro === 'USD' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                USD (Dólares)
              </button>
              <button
                type="button"
                onClick={() => setMonedaFiltro('UYU')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  monedaFiltro === 'UYU' ? 'bg-blue-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                UYU (Pesos)
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tarjetas de Acumulados Totales Históricos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Acumulado Ingresos */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Ingresos Históricos</span>
            <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
              <TrendingUp className="w-4 h-4 text-emerald-700" />
            </div>
          </div>
          <div className="text-xl font-black text-emerald-950 font-mono">
            {monedaFiltro} {acumuladosTotales.ingTotal.toLocaleString('es-UY')}
          </div>
          <p className="text-[10px] text-slate-400 font-medium">Sumatoria de todos los ejercicios</p>
        </div>

        {/* Acumulado Egresos */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Egresos Históricos</span>
            <div className="p-1.5 bg-rose-100 text-rose-800 rounded-lg">
              <TrendingDown className="w-4 h-4 text-rose-600" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 font-mono">
            {monedaFiltro} {acumuladosTotales.egrTotal.toLocaleString('es-UY')}
          </div>
          <p className="text-[10px] text-slate-400 font-medium">Costos operacionales acumulados</p>
        </div>

        {/* Resultado Neto Acumulado */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Resultado Neto Histórico</span>
            <div className="p-1.5 bg-blue-100 text-blue-800 rounded-lg">
              <DollarSign className="w-4 h-4 text-blue-700" />
            </div>
          </div>
          <div className={`text-xl font-black font-mono ${
            acumuladosTotales.netoTotal >= 0 ? 'text-emerald-700' : 'text-rose-700'
          }`}>
            {monedaFiltro} {acumuladosTotales.netoTotal.toLocaleString('es-UY')}
          </div>
          <p className="text-[10px] text-slate-400 font-medium">Resultado consolidado global</p>
        </div>

        {/* Margen Promedio Anual / Ha */}
        <div className="p-4 bg-emerald-950 text-white rounded-2xl border border-emerald-900 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-emerald-300 text-xs font-bold">
            <span>Margen Promedio / Ha / Año</span>
            <div className="p-1.5 bg-emerald-900/80 text-emerald-300 rounded-lg border border-emerald-700">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-white font-mono">
            {monedaFiltro} {acumuladosTotales.promedioMargenAnualHa.toLocaleString('es-UY')} / Ha
          </div>
          <p className="text-[10px] text-emerald-400 font-medium">Promedio anual por hectárea</p>
        </div>
      </div>

      {/* Tabla Comparativa de Ejercicios Agrícolas */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden space-y-2 p-4">
        <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <span>Comparativa Ejercicio por Ejercicio</span>
        </h3>

        {resumenEjercicios.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-3 bg-slate-50 rounded-2xl border border-slate-200/80">
            <AlertCircle className="w-10 h-10 text-emerald-600 mx-auto" />
            <div className="space-y-1">
              <h4 className="text-sm font-extrabold text-slate-900">Aún no hay ejercicios ni transacciones registradas</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Los indicadores interanuales y el historial de rentabilidad por hectárea se consolidarán automáticamente a medida que registres movimientos de caja o hacienda.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-extrabold text-[11px] uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-3">Ejercicio Agrícola</th>
                  <th className="py-3 px-3 text-center">Estado Contable</th>
                  <th className="py-3 px-3 text-right">Superficie</th>
                  <th className="py-3 px-3 text-right text-emerald-900">Ingresos ({monedaFiltro})</th>
                  <th className="py-3 px-3 text-right text-slate-700">Egresos ({monedaFiltro})</th>
                  <th className="py-3 px-3 text-right font-black">Resultado Neto</th>
                  <th className="py-3 px-3 text-right bg-emerald-50/60 text-emerald-950 font-black">Margen ($/Ha)</th>
                  <th className="py-3 px-3 text-center">Eficiencia (I/E)</th>
                  <th className="py-3 px-3 text-center">Variación Interanual</th>
                  {esAdminOPropietario && <th className="py-3 px-3 text-center">Acción Admin</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {resumenEjercicios.map((item) => (
                  <tr key={item.ejercicio} className="hover:bg-slate-50/80 transition-colors">
                    {/* Ejercicio */}
                    <td className="py-3 px-3 font-black text-slate-900 flex items-center gap-2">
                      <span className="font-mono text-xs">{item.ejercicio}</span>
                      {item.esActual && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300">
                          Actual
                        </span>
                      )}
                    </td>

                    {/* Estado Contable y Snapshot de Carga UG */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        {item.estado === 'CERRADO' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-900 border border-rose-300">
                            <Lock className="w-3 h-3 text-rose-700" />
                            <span>Cerrado</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                            <Unlock className="w-3 h-3 text-emerald-700" />
                            <span>Abierto</span>
                          </span>
                        )}
                        {snapshotsBD[item.ejercicio] != null && (
                          <span className="text-[10px] font-bold text-slate-500 font-mono">
                            UG Cierre: {snapshotsBD[item.ejercicio].toFixed(2)} / Ha
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Superficie */}
                    <td className="py-3 px-3 text-right font-mono text-slate-600">
                      {item.hectareasTotales.toLocaleString()} Ha
                    </td>

                    {/* Ingresos */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-800">
                      {monedaFiltro} {item.ingresos.toLocaleString('es-UY')}
                    </td>

                    {/* Egresos */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-700">
                      {monedaFiltro} {item.egresos.toLocaleString('es-UY')}
                    </td>

                    {/* Resultado Neto */}
                    <td className={`py-3 px-3 text-right font-mono font-black ${
                      item.resultadoNeto >= 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}>
                      {monedaFiltro} {item.resultadoNeto.toLocaleString('es-UY')}
                    </td>

                    {/* Margen $/Ha */}
                    <td className="py-3 px-3 text-right font-mono font-black text-emerald-950 bg-emerald-50/30">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-100/90 border border-emerald-300 text-emerald-950">
                        {monedaFiltro} {item.margenPorHectarea.toLocaleString('es-UY')} / Ha
                      </span>
                    </td>

                    {/* Eficiencia (I/E) */}
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                        item.relacionEficiencia >= 100
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : 'bg-amber-100 text-amber-900 border-amber-300'
                      }`}>
                        {item.relacionEficiencia}%
                      </span>
                    </td>

                    {/* Variación Interanual */}
                    <td className="py-3 px-3 text-center">
                      {item.variacionMargenPct === null ? (
                        <span className="text-slate-400 flex items-center justify-center gap-0.5">
                          <Minus className="w-3 h-3" /> Sin base
                        </span>
                      ) : item.variacionMargenPct > 0 ? (
                        <span className="inline-flex items-center text-emerald-700 font-black text-[11px]">
                          <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                          +{item.variacionMargenPct}%
                        </span>
                      ) : item.variacionMargenPct < 0 ? (
                        <span className="inline-flex items-center text-rose-700 font-black text-[11px]">
                          <ArrowDownRight className="w-4 h-4 text-rose-600" />
                          {item.variacionMargenPct}%
                        </span>
                      ) : (
                        <span className="text-slate-500 font-bold text-[11px]">0%</span>
                      )}
                    </td>

                    {/* Acción Admin: Cerrar / Reabrir */}
                    {esAdminOPropietario && (
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          disabled={guardandoEstado === item.ejercicio}
                          onClick={() => handleToggleEstadoEjercicio(item.ejercicio, item.estado === 'CERRADO' ? 'ABIERTO' : 'CERRADO')}
                          className={`px-3 py-1 rounded-xl font-bold text-[10px] transition-all border shadow-xs cursor-pointer flex items-center space-x-1 mx-auto disabled:opacity-50 ${
                            item.estado === 'CERRADO'
                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300'
                              : 'bg-rose-50 hover:bg-rose-100 text-rose-900 border-rose-300'
                          }`}
                        >
                          {guardandoEstado === item.ejercicio ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : item.estado === 'CERRADO' ? (
                            <>
                              <Unlock className="w-3 h-3 text-emerald-700" />
                              <span>Reabrir</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-3 h-3 text-rose-700" />
                              <span>Cerrar Ejercicio</span>
                            </>
                          )}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Gráfico Visual de Barras Interanuales */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 space-y-4">
        <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          <span>Evolución Visual de Ingresos vs Egresos por Ejercicio</span>
        </h3>

        <div className="space-y-3">
          {resumenEjercicios.map((item) => {
            const pctIngresos = Math.round((item.ingresos / maxMontoEjercicio) * 100);
            const pctEgresos = Math.round((item.egresos / maxMontoEjercicio) * 100);

            return (
              <div key={item.ejercicio} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="font-mono text-slate-900 flex items-center gap-1.5">
                    <span>Ejercicio {item.ejercicio}</span>
                    {item.esActual && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-900 px-1.5 py-0.2 rounded border border-emerald-300">
                        Actual
                      </span>
                    )}
                  </span>
                  <span className="font-mono text-emerald-900">
                    Margen: {monedaFiltro} {item.resultadoNeto.toLocaleString('es-UY')} ({monedaFiltro} {item.margenPorHectarea}/Ha)
                  </span>
                </div>

                {/* Barras Horizontales Comparativas */}
                <div className="space-y-1 text-[11px]">
                  {/* Barra Ingresos */}
                  <div className="flex items-center space-x-2">
                    <span className="w-16 font-extrabold text-emerald-800 text-[10px]">Ingresos:</span>
                    <div className="flex-1 bg-slate-200 h-3 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${pctIngresos}%` }}
                        className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                      />
                    </div>
                    <span className="w-24 text-right font-mono font-bold text-emerald-900">
                      {monedaFiltro} {item.ingresos.toLocaleString('es-UY')}
                    </span>
                  </div>

                  {/* Barra Egresos */}
                  <div className="flex items-center space-x-2">
                    <span className="w-16 font-extrabold text-slate-600 text-[10px]">Egresos:</span>
                    <div className="flex-1 bg-slate-200 h-3 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${pctEgresos}%` }}
                        className="bg-slate-700 h-full rounded-full transition-all duration-500"
                      />
                    </div>
                    <span className="w-24 text-right font-mono font-bold text-slate-700">
                      {monedaFiltro} {item.egresos.toLocaleString('es-UY')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
