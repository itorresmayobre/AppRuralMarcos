import React from 'react';
import type { Moneda } from '../../types';

interface KpiCardsSectionProps {
  totalIngresos: number;
  totalEgresos: number;
  resultadoNeto: number;
  egresoPorHectarea: number;
  margenPorHectarea: number;
  hectareasTotales: number;
  monedaFiltro: Moneda;
  totalIngresosCount: number;
  totalEgresosCount: number;
}

export const KpiCardsSection: React.FC<KpiCardsSectionProps> = ({
  totalIngresos,
  totalEgresos,
  resultadoNeto,
  egresoPorHectarea,
  margenPorHectarea,
  hectareasTotales,
  monedaFiltro,
  totalIngresosCount,
  totalEgresosCount,
}) => {
  const symbol = monedaFiltro === 'USD' ? 'USD ' : '$ ';

  return (
    <section aria-label="Resumen de Indicadores Financieros" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Ingresos Totales */}
      <article className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
        <header>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ingresos Totales</h3>
        </header>
        <p className="text-2xl font-black text-emerald-800">
          {symbol}{totalIngresos.toLocaleString('es-UY')}
        </p>
        <span className="text-xs font-medium text-emerald-700 block">
          {totalIngresosCount} Operaciones de entrada
        </span>
      </article>

      {/* Egresos Totales */}
      <article className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
        <header>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Egresos Totales</h3>
        </header>
        <p className="text-2xl font-black text-slate-900">
          {symbol}{totalEgresos.toLocaleString('es-UY')}
        </p>
        <span className="text-xs font-medium text-rose-700 block">
          {totalEgresosCount} Operaciones de salida
        </span>
      </article>

      {/* Margen Neto */}
      <article className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
        <header>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Resultado Neto de Caja</h3>
        </header>
        <p className={`text-2xl font-black ${resultadoNeto >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
          {symbol}{resultadoNeto.toLocaleString('es-UY')}
        </p>
        <span className={`text-xs font-bold ${resultadoNeto >= 0 ? 'text-emerald-800' : 'text-rose-800'} block`}>
          {resultadoNeto >= 0 ? 'Superávit Financiero' : 'Déficit Financiero'}
        </span>
      </article>

      {/* Indicadores por Hectárea */}
      <article className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
        <header>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Métricas por Hectárea</h3>
        </header>
        <div className="space-y-0.5">
          <p className="text-lg font-black text-slate-900">
            Gasto: <span className="text-slate-800">{symbol}{egresoPorHectarea} / Ha</span>
          </p>
          <p className={`text-xs font-extrabold ${margenPorHectarea >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            Margen: {symbol}{margenPorHectarea} / Ha
          </p>
        </div>
        <span className="text-xs text-slate-500 block">
          Sobre {hectareasTotales.toLocaleString('es-UY')} Hectáreas Totales
        </span>
      </article>
    </section>
  );
};
