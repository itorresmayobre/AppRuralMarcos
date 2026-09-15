import React from 'react';
import { Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { MESES_AGRICOLAS } from '../../utils/periodoAgricola';

interface EvolucionMensualGridProps {
  ejercicioFiltro: string;
  evolucionMensualMap: Record<string, { ingresos: number; egresos: number }>;
}

export const EvolucionMensualGrid: React.FC<EvolucionMensualGridProps> = ({
  ejercicioFiltro,
  evolucionMensualMap,
}) => {
  return (
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
  );
};
