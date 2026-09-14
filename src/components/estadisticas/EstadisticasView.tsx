import React, { useState } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useEstanciasStore } from '../../stores/useEstanciasStore';
import { useFinanzasStore } from '../../stores/useFinanzasStore';
import { useConceptosFinancierosStore } from '../../stores/useConceptosFinancierosStore';
import { useGanadoStore } from '../../stores/useGanadoStore';
import { calcularEjercicioYMesAgricola, MESES_AGRICOLAS } from '../../utils/periodoAgricola';
import { CustomSelect, type SelectOption } from '../ui/CustomSelect';
import type { Moneda } from '../../types';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShieldAlert,
  PieChart,
  Calendar,
  Layers,
  MapPin,
  Tag,
  ArrowUpRight,
  ArrowDownRight,
  Truck,
  Building2
} from 'lucide-react';

export const EstadisticasView: React.FC = () => {
  const { usuario } = useAuthStore();
  const { estancias, estanciaSeleccionadaId } = useEstanciasStore();
  const { obtenerTransaccionesEstancia } = useFinanzasStore();
  const { catalog } = useConceptosFinancierosStore();
  const { movimientos } = useGanadoStore();

  const currentRole = usuario?.rol || 'OPERARIO';
  const canAccess = currentRole === 'ADMIN' || currentRole === 'CONTADOR';

  const [ejercicioFiltro, setEjercicioFiltro] = useState<string>('2025/2026');
  const [monedaFiltro, setMonedaFiltro] = useState<Moneda>('USD');
  const [estanciaFiltroId, setEstanciaFiltroId] = useState<string>(estanciaSeleccionadaId || 'TODAS');
  const [modoAnalisis, setModoAnalisis] = useState<'FINANCIERO_PURO' | 'ECONOMICO_PRODUCTIVO'>('ECONOMICO_PRODUCTIVO');

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

  // Opciones para CustomSelect
  const estanciaOptions: SelectOption[] = [
    { value: 'TODOS', label: 'Consolidado Total Empresa' },
    ...estancias.map((est) => ({
      value: est.id,
      label: est.nombre,
      badge: `${est.hectareas_totales} Ha`,
      badgeColor: 'bg-emerald-100 text-emerald-900 border border-emerald-200',
    })),
  ];

  const ejercicioOptions: SelectOption[] = [
    { value: '2025/2026', label: 'Ejercicio 2025/2026 (Actual)', badge: 'Actual' },
    { value: '2024/2025', label: 'Ejercicio 2024/2025' },
    { value: 'TODOS', label: 'Todos los Ejercicios' },
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
  const totalIngresos = transaccionesFiltradas
    .filter((t) => t.tipo === 'INGRESO')
    .reduce((sum, t) => sum + t.monto, 0);

  const totalEgresos = transaccionesFiltradas
    .filter((t) => t.tipo === 'EGRESO')
    .reduce((sum, t) => sum + t.monto, 0);

  const resultadoNeto = totalIngresos - totalEgresos;

  // Clasificación de Costos Fijos vs. Variables
  const egresosList = transaccionesFiltradas.filter((t) => t.tipo === 'EGRESO');

  const totalCostosFijos = egresosList.reduce((sum, t) => {
    // Si la transacción tiene naturaleza definida la usa, si no la busca en el catálogo por categoría/rubro
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

  const gruposRanking = Object.entries(egresosPorGrupoMap)
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Ingresos Totales */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500">Ingresos Totales</span>
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-800">
            {monedaFiltro === 'USD' ? 'USD ' : '$ '}
            {totalIngresos.toLocaleString('es-UY')}
          </p>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md inline-block">
            {transaccionesFiltradas.filter(t => t.tipo === 'INGRESO').length} Operaciones de entrada
          </span>
        </div>

        {/* Egresos Totales */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500">Egresos Totales</span>
            <div className="p-2 bg-rose-100 text-rose-800 rounded-xl">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">
            {monedaFiltro === 'USD' ? 'USD ' : '$ '}
            {totalEgresos.toLocaleString('es-UY')}
          </p>
          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md inline-block">
            {egresosList.length} Operaciones de salida
          </span>
        </div>

        {/* Margen Neto */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500">Resultado Neto de Caja</span>
            <div className={`p-2 rounded-xl ${resultadoNeto >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl font-black ${resultadoNeto >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {monedaFiltro === 'USD' ? 'USD ' : '$ '}
            {resultadoNeto.toLocaleString('es-UY')}
          </p>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md inline-block ${
            resultadoNeto >= 0 ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'
          }`}>
            {resultadoNeto >= 0 ? 'Superávit Financiero' : 'Déficit Financiero'}
          </span>
        </div>

        {/* Indicadores por Hectárea */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500">Métricas por Hectárea</span>
            <div className="p-2 bg-slate-100 text-slate-700 rounded-xl">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="text-lg font-black text-slate-900">
              Gasto: <span className="text-slate-800">{monedaFiltro === 'USD' ? 'USD ' : '$ '}{egresoPorHectarea} / Ha</span>
            </p>
            <p className={`text-xs font-extrabold ${margenPorHectarea >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              Margen: {monedaFiltro === 'USD' ? 'USD ' : '$ '}{margenPorHectarea} / Ha
            </p>
          </div>
          <span className="text-[10px] font-bold text-slate-500 block">
            Sobre {hectareasTotales.toLocaleString('es-UY')} Hectáreas Totales
          </span>
        </div>

      </div>

      {/* Grid 2: Estructura de Costos Fijos vs. Variables & Ranking por Grupo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Card 1: Estructura de Costos Fijos vs. Costos Variables */}
        <section aria-label="Estructura Costos Fijos y Variables" className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Tag className="w-4 h-4 text-emerald-600" />
              <span>Estructura de Costos (Fijos vs. Variables)</span>
            </h3>
            <span className="text-[11px] font-extrabold text-slate-500">Total: {monedaFiltro} {totalEgresos.toLocaleString('es-UY')}</span>
          </div>

          {/* Barra Dual Proporcional */}
          <div className="space-y-2">
            <div className="h-4 bg-slate-100 rounded-full overflow-hidden flex border border-slate-200">
              <div
                style={{ width: `${pctFijos}%` }}
                className="bg-amber-500 transition-all duration-500"
                title={`Costos Fijos: ${pctFijos}%`}
              />
              <div
                style={{ width: `${pctVariables}%` }}
                className="bg-blue-600 transition-all duration-500"
                title={`Costos Variables: ${pctVariables}%`}
              />
            </div>

            <div className="flex justify-between text-xs font-black">
              <span className="text-amber-800 flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                <span>📌 Fijos: {pctFijos}% ({monedaFiltro} {totalCostosFijos.toLocaleString('es-UY')})</span>
              </span>

              <span className="text-blue-800 flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                <span>📈 Variables: {pctVariables}% ({monedaFiltro} {totalCostosVariables.toLocaleString('es-UY')})</span>
              </span>
            </div>
          </div>

          {/* Desglose de Gastos Fijos Principales */}
          <div className="pt-2 grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 space-y-1">
              <p className="font-extrabold text-amber-950 text-[11px]">Costos Fijos (Estructura)</p>
              <p className="text-xs text-amber-900 font-medium">Sueldos, Renta, UTE, ANTEL, Impuestos patrimoniales.</p>
              <p className="text-sm font-black text-amber-900 pt-1">
                {monedaFiltro} {totalCostosFijos.toLocaleString('es-UY')}
              </p>
            </div>

            <div className="p-3 bg-blue-50 rounded-xl border border-blue-200/80 space-y-1">
              <p className="font-extrabold text-blue-950 text-[11px]">Costos Variables (Productivos)</p>
              <p className="text-xs text-blue-900 font-medium">Hacienda, Sanidad, Fertilizantes, Semillas, Fletes.</p>
              <p className="text-sm font-black text-blue-900 pt-1">
                {monedaFiltro} {totalCostosVariables.toLocaleString('es-UY')}
              </p>
            </div>
          </div>
        </section>

        {/* Card 2: Ranking de Gastos por Grupo del Plan Agropecuario */}
        <section aria-label="Ranking de Gastos por Grupo" className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Gastos por Grupo (Plan Agropecuario)</span>
            </h3>
            <span className="text-[11px] font-extrabold text-slate-500">{gruposRanking.length} Grupos Activos</span>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar pr-1">
            {gruposRanking.length > 0 ? (
              gruposRanking.map((g) => (
                <div key={g.grupo} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-800">
                    <span className="truncate">{g.grupo}</span>
                    <span className="font-mono font-black">{monedaFiltro} {g.monto.toLocaleString('es-UY')} ({g.pct.toFixed(1)}%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, Math.max(2, g.pct))}%` }}
                      className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 text-center py-6">No hay egresos registrados para este período.</p>
            )}
          </div>
        </section>

      </div>

      {/* Matriz de Rentabilidad y Eficiencia por Establecimiento */}
      <section aria-label="Matriz de Rentabilidad por Campo" className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600" />
              <span>Matriz de Rentabilidad por Campo (Establecimiento)</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Comparativo de margen por hectárea y transferencias valorizadas entre predios de cría e invernada.
            </p>
          </div>

          {/* Selector de Modo de Análisis (Financiero Puro vs Económico) */}
          <div className="flex bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setModoAnalisis('FINANCIERO_PURO')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                modoAnalisis === 'FINANCIERO_PURO'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              💵 Caja Bancaria Real
            </button>
            <button
              type="button"
              onClick={() => setModoAnalisis('ECONOMICO_PRODUCTIVO')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center space-x-1 ${
                modoAnalisis === 'ECONOMICO_PRODUCTIVO'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>📊 Económico (Con Traslados)</span>
            </button>
          </div>
        </div>

        {/* Tabla Matriz de Rentabilidad */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider font-extrabold border-b border-slate-200">
                <th className="py-3 px-4">Establecimiento</th>
                <th className="py-3 px-4">Superficie / Tenencia</th>
                <th className="py-3 px-4 text-right">Ventas Reales</th>
                {modoAnalisis === 'ECONOMICO_PRODUCTIVO' && (
                  <>
                    <th className="py-3 px-4 text-right text-emerald-700">Transf. Salientes (+USD)</th>
                    <th className="py-3 px-4 text-right text-rose-700">Transf. Entrantes (-USD)</th>
                  </>
                )}
                <th className="py-3 px-4 text-right">Egresos Reales</th>
                <th className="py-3 px-4 text-right">Resultado Neto</th>
                <th className="py-3 px-4 text-right">Margen / Ha / Año</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium">
              {estancias.map((est) => {
                const txEst = obtenerTransaccionesEstancia(est.id).filter((t) => t.moneda === monedaFiltro);
                const ventasReales = txEst.filter((t) => t.tipo === 'INGRESO').reduce((a, b) => a + b.monto, 0);
                const egresosReales = txEst.filter((t) => t.tipo === 'EGRESO').reduce((a, b) => a + b.monto, 0);

                // Transferencias salientes (crédito) y entrantes (débito)
                const transfSalientes = movimientos
                  .filter((m) => m.estancia_origen_id === est.id && m.valorizar_transferencia)
                  .reduce((a, b) => a + b.monto_total_imputado, 0);

                const transfEntrantes = movimientos
                  .filter((m) => m.estancia_destino_id === est.id && m.valorizar_transferencia)
                  .reduce((a, b) => a + b.monto_total_imputado, 0);

                const ingresosEfectivos = modoAnalisis === 'ECONOMICO_PRODUCTIVO'
                  ? ventasReales + transfSalientes
                  : ventasReales;

                const egresosEfectivos = modoAnalisis === 'ECONOMICO_PRODUCTIVO'
                  ? egresosReales + transfEntrantes
                  : egresosReales;

                const neto = ingresosEfectivos - egresosEfectivos;
                const margenHa = Math.round(neto / (est.hectareas_totales || 1));

                return (
                  <tr key={est.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-black text-slate-900 flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>{est.nombre}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <span className="font-bold">{est.hectareas_totales} Ha</span>
                      <span className="text-[10px] text-slate-400 block uppercase font-mono">{est.tipo_tenencia}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-800">
                      {monedaFiltro} {ventasReales.toLocaleString('es-UY')}
                    </td>
                    {modoAnalisis === 'ECONOMICO_PRODUCTIVO' && (
                      <>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600">
                          {transfSalientes > 0 ? `+ ${transfSalientes.toLocaleString('es-UY')}` : '-'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-600">
                          {transfEntrantes > 0 ? `- ${transfEntrantes.toLocaleString('es-UY')}` : '-'}
                        </td>
                      </>
                    )}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-700">
                      {monedaFiltro} {egresosReales.toLocaleString('es-UY')}
                    </td>
                    <td className={`py-3.5 px-4 text-right font-mono font-black text-sm ${neto >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {monedaFiltro} {neto.toLocaleString('es-UY')}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className={`inline-block text-xs font-black px-2.5 py-1 rounded-xl ${
                        margenHa >= 0 ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-rose-100 text-rose-900 border border-rose-300'
                      }`}>
                        {monedaFiltro} {margenHa} / Ha / año
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Grid 3: Evolución Mensual del Ejercicio Agrícola (Julio a Junio) */}
      <section aria-label="Evolución del Ejercicio Agrícola" className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>Evolución Mensual - Ejercicio Agrícola ({ejercicioFiltro})</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Ingresos vs. Egresos durante el ciclo productivo de Julio a Junio</p>
          </div>

          <span className="text-xs font-black text-slate-700 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200">
            12 Meses Agrícolas
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {MESES_AGRICOLAS.map((mes) => {
            const dataMes = evolucionMensualMap[mes] || { ingresos: 0, egresos: 0 };
            const balanceMes = dataMes.ingresos - dataMes.egresos;
            const tieneMovimientos = dataMes.ingresos > 0 || dataMes.egresos > 0;

            return (
              <div
                key={mes}
                className={`p-3 rounded-2xl border transition-all ${
                  tieneMovimientos
                    ? 'bg-slate-50/90 border-slate-200 hover:border-slate-300 shadow-2xs'
                    : 'bg-slate-50/40 border-slate-100 opacity-60'
                }`}
              >
                <span className="text-xs font-black text-slate-900 block border-b border-slate-200/60 pb-1 mb-2">
                  {mes}
                </span>

                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between items-center text-emerald-700 font-extrabold">
                    <span className="flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3" /> Entradas</span>
                    <span>{dataMes.ingresos > 0 ? dataMes.ingresos.toLocaleString('es-UY') : '-'}</span>
                  </div>

                  <div className="flex justify-between items-center text-rose-700 font-extrabold">
                    <span className="flex items-center gap-0.5"><ArrowDownRight className="w-3 h-3" /> Salidas</span>
                    <span>{dataMes.egresos > 0 ? dataMes.egresos.toLocaleString('es-UY') : '-'}</span>
                  </div>

                  {tieneMovimientos && (
                    <div className={`pt-1 border-t border-slate-200 flex justify-between font-black text-[10px] ${
                      balanceMes >= 0 ? 'text-emerald-800' : 'text-rose-800'
                    }`}>
                      <span>Neto</span>
                      <span>{balanceMes >= 0 ? '+' : ''}{balanceMes.toLocaleString('es-UY')}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
};
