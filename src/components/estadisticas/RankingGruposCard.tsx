import React from 'react';
import { Layers } from 'lucide-react';
import type { Moneda } from '../../types';

export interface GrupoRankingItem {
  grupo: string;
  monto: number;
  pct: number;
}

interface RankingGruposCardProps {
  gruposRanking: GrupoRankingItem[];
  monedaFiltro: Moneda;
}

export const RankingGruposCard: React.FC<RankingGruposCardProps> = ({
  gruposRanking,
  monedaFiltro,
}) => {
  return (
    <section aria-label="Ranking de Gastos por Grupo" className="app-card space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <h3 className="app-section-title">
          <Layers className="w-4 h-4 text-emerald-600" />
          <span>Gastos por Grupo (Plan Agropecuario)</span>
        </h3>
        <span className="text-xs font-bold text-slate-500">{gruposRanking.length} Grupos Activos</span>
      </div>

      <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar pr-1">
        {gruposRanking.length > 0 ? (
          gruposRanking.map((g) => (
            <div key={g.grupo} className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-slate-800">
                <span className="truncate">{g.grupo}</span>
                <span className="font-mono font-black">
                  {monedaFiltro} {g.monto.toLocaleString('es-UY')} ({g.pct.toFixed(1)}%)
                </span>
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
  );
};
