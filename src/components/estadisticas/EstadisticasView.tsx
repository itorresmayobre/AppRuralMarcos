import React, { useState, useMemo } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useEstanciasStore } from '../../stores/useEstanciasStore';
import { useFinanzasStore } from '../../stores/useFinanzasStore';
import { useConceptosFinancierosStore } from '../../stores/useConceptosFinancierosStore';
import { useGanadoStore } from '../../stores/useGanadoStore';
import {
  calcularEjercicioYMesAgricola,
  obtenerEjercicioAgricolaActual,
  obtenerListaEjerciciosDinamica,
  MESES_AGRICOLAS
} from '../../utils/periodoAgricola';
import { CustomSelect, type SelectOption } from '../ui/CustomSelect';
import type { Moneda } from '../../types';
import { BarChart3, DollarSign, ShieldAlert, Calendar, MapPin } from 'lucide-react';

import { KpiCardsSection } from './KpiCardsSection';
import { EstructuraCostosCard } from './EstructuraCostosCard';
import { RankingGruposCard, type GrupoRankingItem } from './RankingGruposCard';
import { MatrizRentabilidadTabla } from './MatrizRentabilidadTabla';
import { EvolucionMensualGrid } from './EvolucionMensualGrid';

export const EstadisticasView: React.FC = () => {
  const { usuario } = useAuthStore();
  const { estancias, estanciaSeleccionadaId } = useEstanciasStore();
  const { obtenerTransaccionesEstancia, transacciones } = useFinanzasStore();
  const { catalog } = useConceptosFinancierosStore();
  const { movimientos } = useGanadoStore();

  const currentRole = usuario?.rol || 'OPERARIO';
  const canAccess = currentRole === 'ADMIN' || currentRole === 'CONTADOR';

  const ejercicioActualCalculado = useMemo(() => obtenerEjercicioAgricolaActual(), []);

  const [ejercicioFiltro, setEjercicioFiltro] = useState<string>(ejercicioActualCalculado);
  const [monedaFiltro, setMonedaFiltro] = useState<Moneda>('USD');
  const [estanciaFiltroId, setEstanciaFiltroId] = useState<string>(estanciaSeleccionadaId || 'TODAS');
  const [modoAnalisis, setModoAnalisis] = useState<'FINANCIERO_PURO' | 'ECONOMICO_PRODUCTIVO'>('ECONOMICO_PRODUCTIVO');

  // Generación dinámica de opciones de Ejercicio Agrícola (no hardcodeadas)
  const ejercicioOptions: SelectOption[] = useMemo(() => {
    const fechas = transacciones.map((t) => t.fecha);
    const listaEjercicios = obtenerListaEjerciciosDinamica(fechas);

    const opciones: SelectOption[] = listaEjercicios.map((ej) => ({
      value: ej,
      label: `Ejercicio ${ej}${ej === ejercicioActualCalculado ? ' (Actual)' : ''}`,
      badge: ej === ejercicioActualCalculado ? 'Actual' : undefined,
    }));

    opciones.push({ value: 'TODOS', label: 'Todos los Ejercicios' });
    return opciones;
  }, [transacciones, ejercicioActualCalculado]);

  if (!canAccess) {
    return (
      <main className="p-4 sm:p-6 max-w-lg mx-auto mt-6">
        <section aria-label="Acceso denegado a estadísticas" className="bg-amber-50 border border-amber-200/90 rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-sm">
          <ShieldAlert className="w-12 h-12 text-amber-600 mx-auto" />
          <h2 className="text-lg font-extrabold text-amber-950">Acceso Restringido a Análisis Financiero</h2>
          <p className="text-xs text-amber-800 leading-relaxed">
            Las estadísticas avanzadas, estructura de costos fijos/variables y análisis por hectárea están reservadas para roles de <strong>Administrador / Propietario</strong> y <strong>Contador</strong>.
          </p>
        </section>
      </main>
    );
  }

  // Opciones para CustomSelect de Estancia
  const estanciaOptions: SelectOption[] = [
    { value: 'TODOS', label: 'Consolidado Total Empresa' },
    ...estancias.map((est) => ({
      value: est.id,
      label: est.nombre,
      badge: `${est.hectareas_totales} Ha`,
      badgeColor: 'bg-emerald-100 text-emerald-900 border border-emerald-200',
    })),
  ];

  // Obtener transacciones según estancia seleccionada
  const todasTransacciones = obtenerTransaccionesEstancia(estanciaFiltroId);

  // Filtrar transacciones por Moneda y Ejercicio Agrícola (o TODOS)
  const transaccionesFiltradas = todasTransacciones.filter((t) => {
    const coincideMoneda = t.moneda === monedaFiltro;
    const { ejercicio } = calcularEjercicioYMesAgricola(t.fecha);
    const ejercicioEfectivo = t.ejercicio_agricola || ejercicio;
    const coincideEjercicio = ejercicioFiltro === 'TODOS' || ejercicioEfectivo === ejercicioFiltro;
    return coincideMoneda && coincideEjercicio;
  });

  // Totales generales
  const ingresosList = transaccionesFiltradas.filter((t) => t.tipo === 'INGRESO');
  const egresosList = transaccionesFiltradas.filter((t) => t.tipo === 'EGRESO');

  const totalIngresos = ingresosList.reduce((sum, t) => sum + t.monto, 0);
  const totalEgresos = egresosList.reduce((sum, t) => sum + t.monto, 0);
  const resultadoNeto = totalIngresos - totalEgresos;

  // Clasificación de Costos Fijos vs. Variables
  const totalCostosFijos = egresosList.reduce((sum, t) => {
    let esFijo = t.naturaleza_costo === 'FIJO';
    if (!t.naturaleza_costo) {
      const conc = catalog.find((c) => c.nombre === t.categoria);
      if (conc?.naturaleza_costo === 'FIJO') esFijo = true;
    }
    return esFijo ? sum + t.monto : sum;
  }, 0);

  const totalCostosVariables = totalEgresos - totalCostosFijos;

  const pctFijos = totalEgresos > 0 ? Math.round((totalCostosFijos / totalEgresos) * 100) : 0;
  const pctVariables = totalEgresos > 0 ? Math.round((totalCostosVariables / totalEgresos) * 100) : 0;

  // Hectáreas totales calculadas para métrica $/Ha
  const hectareasTotales = estanciaFiltroId === 'TODAS'
    ? estancias.reduce((a, b) => a + b.hectareas_totales, 0)
    : (estancias.find((e) => e.id === estanciaFiltroId)?.hectareas_totales || 1);

  const egresoPorHectarea = Math.round(totalEgresos / (hectareasTotales || 1));
  const margenPorHectarea = Math.round(resultadoNeto / (hectareasTotales || 1));

  // Agrupamiento por Grupo del Plan Agropecuario (Para Ranking de Egresos)
  const egresosPorGrupoMap: Record<string, number> = {};
  egresosList.forEach((t) => {
    const conc = catalog.find((c) => c.nombre === t.categoria);
    const grupoNombre = conc?.grupo || 'Otros Gastos';
    egresosPorGrupoMap[grupoNombre] = (egresosPorGrupoMap[grupoNombre] || 0) + t.monto;
  });

  const gruposRanking: GrupoRankingItem[] = Object.entries(egresosPorGrupoMap)
    .map(([grupo, monto]) => ({ grupo, monto, pct: totalEgresos > 0 ? (monto / totalEgresos) * 100 : 0 }))
    .sort((a, b) => b.monto - a.monto);

  // Evolución mensual para los 12 meses agrícolas (Julio a Junio)
  const evolucionMensualMap: Record<string, { ingresos: number; egresos: number }> = {};
  MESES_AGRICOLAS.forEach((mes) => {
    evolucionMensualMap[mes] = { ingresos: 0, egresos: 0 };
  });

  transaccionesFiltradas.forEach((t) => {
    const { mes } = calcularEjercicioYMesAgricola(t.fecha);
    const mesNombre = t.periodo_mes || mes;
    if (evolucionMensualMap[mesNombre]) {
      if (t.tipo === 'INGRESO') evolucionMensualMap[mesNombre].ingresos += t.monto;
      else evolucionMensualMap[mesNombre].egresos += t.monto;
    }
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <header className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
              <span>Análisis Financiero y Estadísticas de Caja</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Indicadores clave del ciclo agropecuario, estructura de costos (Fijos vs Variables) y márgenes por hectárea.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-black text-emerald-900 bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200">
              Ciclo Productivo (Julio - Junio)
            </span>
          </div>
        </div>

        {/* Barra de Filtros (Estancia, Ejercicio, Moneda) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Selector Estancia */}
          <div>
            <CustomSelect
              label="Establecimiento:"
              value={estanciaFiltroId}
              options={estanciaOptions}
              onChange={(val) => setEstanciaFiltroId(val)}
              icon={<MapPin className="w-4 h-4 text-emerald-600" />}
            />
          </div>

          {/* Selector Ejercicio Agrícola */}
          <div>
            <CustomSelect
              label="Ejercicio Agrícola:"
              value={ejercicioFiltro}
              options={ejercicioOptions}
              onChange={(val) => setEjercicioFiltro(val)}
              icon={<Calendar className="w-4 h-4 text-emerald-600" />}
            />
          </div>

          {/* Selector Moneda */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-slate-500" />
              <span>Moneda:</span>
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

      {/* Grid 1: Tarjetas Principales de KPIs */}
      <KpiCardsSection
        totalIngresos={totalIngresos}
        totalEgresos={totalEgresos}
        resultadoNeto={resultadoNeto}
        egresoPorHectarea={egresoPorHectarea}
        margenPorHectarea={margenPorHectarea}
        hectareasTotales={hectareasTotales}
        monedaFiltro={monedaFiltro}
        totalIngresosCount={ingresosList.length}
        totalEgresosCount={egresosList.length}
      />

      {/* Grid 2: Estructura de Costos Fijos vs. Variables & Ranking por Grupo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EstructuraCostosCard
          totalEgresos={totalEgresos}
          totalCostosFijos={totalCostosFijos}
          totalCostosVariables={totalCostosVariables}
          pctFijos={pctFijos}
          pctVariables={pctVariables}
          monedaFiltro={monedaFiltro}
        />
        <RankingGruposCard
          gruposRanking={gruposRanking}
          monedaFiltro={monedaFiltro}
        />
      </div>

      {/* Matriz de Rentabilidad y Eficiencia por Establecimiento */}
      <MatrizRentabilidadTabla
        estancias={estancias}
        obtenerTransaccionesEstancia={obtenerTransaccionesEstancia}
        movimientos={movimientos}
        monedaFiltro={monedaFiltro}
        modoAnalisis={modoAnalisis}
        setModoAnalisis={setModoAnalisis}
      />

      {/* Grid 3: Evolución Mensual del Ejercicio Agrícola (Julio a Junio) */}
      <EvolucionMensualGrid
        ejercicioFiltro={ejercicioFiltro}
        evolucionMensualMap={evolucionMensualMap}
      />
    </div>
  );
};
