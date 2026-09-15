import React from 'react';
import { Tag } from 'lucide-react';
import type { Moneda } from '../../types';

interface EstructuraCostosCardProps {
  totalEgresos: number;
  totalCostosFijos: number;
  totalCostosVariables: number;
  pctFijos: number;
  pctVariables: number;
  monedaFiltro: Moneda;
}

export const EstructuraCostosCard: React.FC<EstructuraCostosCardProps> = ({
  totalEgresos,
  totalCostosFijos,
  totalCostosVariables,
  pctFijos,
  pctVariables,
  monedaFiltro,
}) => {
  return (
    <section aria-label="Estructura Costos Fijos y Variables" className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <Tag className="w-4 h-4 text-emerald-600" />
          <span>Estructura de Costos (Fijos vs. Variables)</span>
        </h3>
        <span className="text-[11px] font-extrabold text-slate-500">
          Total: {monedaFiltro} {totalEgresos.toLocaleString('es-UY')}
        </span>
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
  );
};
