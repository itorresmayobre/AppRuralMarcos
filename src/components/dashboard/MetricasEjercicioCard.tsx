import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinanzasStore } from '../../stores/useFinanzasStore';
import { useConceptosFinancierosStore } from '../../stores/useConceptosFinancierosStore';
import { useEstanciasStore } from '../../stores/useEstanciasStore';
import { calcularEjercicioYMesAgricola, obtenerEjercicioAgricolaActual } from '../../utils/periodoAgricola';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Tag,
  ArrowRight
} from 'lucide-react';

export const MetricasEjercicioCard: React.FC = () => {
  const navigate = useNavigate();
  const { estanciaSeleccionadaId } = useEstanciasStore();
  const { obtenerTransaccionesEstancia } = useFinanzasStore();
  const { catalog } = useConceptosFinancierosStore();

  const transacciones = obtenerTransaccionesEstancia(estanciaSeleccionadaId);

  // Ejercicio agrícola actual dinámico (calculado según la fecha del sistema 1 Jul - 30 Jun)
  const ejercicioActual = obtenerEjercicioAgricolaActual();
  const transaccionesEjercicio = transacciones.filter((t) => {
    const { ejercicio } = calcularEjercicioYMesAgricola(t.fecha);
    const ef = t.ejercicio_agricola || ejercicio;
    return ef === ejercicioActual && t.moneda === 'USD';
  });

  const ingresos = transaccionesEjercicio
    .filter((t) => t.tipo === 'INGRESO')
    .reduce((sum, t) => sum + t.monto, 0);

  const egresos = transaccionesEjercicio
    .filter((t) => t.tipo === 'EGRESO')
    .reduce((sum, t) => sum + t.monto, 0);

  const resultadoNeto = ingresos - egresos;

  // Clasificación Fijos vs Variables
  const egresosList = transaccionesEjercicio.filter((t) => t.tipo === 'EGRESO');
  const costosFijos = egresosList.reduce((sum, t) => {
    let esFijo = t.naturaleza_costo === 'FIJO';
    if (!t.naturaleza_costo) {
      const conc = catalog.find((c) => c.nombre === t.categoria);
      if (conc?.naturaleza_costo === 'FIJO') esFijo = true;
    }
    return esFijo ? sum + t.monto : sum;
  }, 0);

  const costosVariables = egresos - costosFijos;
  const pctFijos = egresos > 0 ? Math.round((costosFijos / egresos) * 100) : 0;
  const pctVariables = egresos > 0 ? Math.round((costosVariables / egresos) * 100) : 0;

  // Top 3 Rubros con más gasto
  const rankingRubrosMap: Record<string, number> = {};
  egresosList.forEach((t) => {
    rankingRubrosMap[t.categoria] = (rankingRubrosMap[t.categoria] || 0) + t.monto;
  });

  const top3Rubros = Object.entries(rankingRubrosMap)
    .map(([nombre, monto]) => ({ nombre, monto }))
    .sort((a, b) => b.monto - a.monto)
    .slice(0, 3);

  return (
    <section aria-label="Métricas del Ejercicio Agrícola" className="app-card space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-2.5">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-emerald-100 text-emerald-900 rounded-lg">
            <BarChart3 className="w-4 h-4 text-emerald-700" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span>Métricas del Ejercicio Agrícola ({ejercicioActual})</span>
              <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-900 px-1.5 py-0.2 rounded border border-emerald-200">
                USD
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Resumen en tiempo real del flujo de caja y estructura de costos en curso
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/estadisticas')}
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition-all cursor-pointer active:scale-95 self-start sm:self-auto min-h-[34px]"
        >
          <span>Ver Análisis Completo</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Grid Resumen del Ejercicio */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* KPI 1: Ingresos vs Egresos */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
          <span className="app-metric-label block">Flujo de Caja Ejercicio</span>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between items-center text-emerald-800 font-black">
              <span className="flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> Ingresos</span>
              <span>USD {ingresos.toLocaleString('es-UY')}</span>
            </div>
            <div className="flex justify-between items-center text-slate-900 font-black">
              <span className="flex items-center gap-1"><TrendingDown className="w-3.5 h-3.5 text-rose-600" /> Egresos</span>
              <span>USD {egresos.toLocaleString('es-UY')}</span>
            </div>
            <div className={`pt-1.5 border-t border-slate-200 flex justify-between font-black text-sm ${
              resultadoNeto >= 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}>
              <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" /> Resultado</span>
              <span>USD {resultadoNeto.toLocaleString('es-UY')}</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Costos Fijos vs Variables */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">Estructura de Costos</span>
            <Tag className="w-3.5 h-3.5 text-slate-400" />
          </div>

          <div className="space-y-2">
            <div className="h-3 bg-slate-200 rounded-full overflow-hidden flex">
              <div style={{ width: `${pctFijos}%` }} className="bg-amber-500" title={`Fijos: ${pctFijos}%`} />
              <div style={{ width: `${pctVariables}%` }} className="bg-blue-600" title={`Variables: ${pctVariables}%`} />
            </div>

            <div className="flex justify-between text-xs font-black pt-0.5">
              <span className="text-amber-800">📌 Fijos: {pctFijos}%</span>
              <span className="text-blue-800">📈 Variables: {pctVariables}%</span>
            </div>

            <p className="text-[10px] text-slate-500">
              Fijos: USD {costosFijos.toLocaleString()} | Var: USD {costosVariables.toLocaleString()}
            </p>
          </div>
        </div>

        {/* KPI 3: Top Rubros con Más Gasto */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-2">
          <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">Top Rubros con Más Gasto</span>
          <div className="space-y-1 text-xs">
            {top3Rubros.length > 0 ? (
              top3Rubros.map((item, idx) => (
                <div key={item.nombre} className="flex justify-between items-center text-slate-800 font-bold">
                  <span className="truncate">{idx + 1}. {item.nombre.replace(/_/g, ' ')}</span>
                  <span className="font-mono text-slate-900 font-black">USD {item.monto.toLocaleString()}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-2">Sin egresos en el ejercicio</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
