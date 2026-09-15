import React from 'react';
import { Building2, Truck, MapPin } from 'lucide-react';
import type { Estancia, Moneda, TransaccionFinanciera, MovimientoGanado } from '../../types';

interface MatrizRentabilidadTablaProps {
  estancias: Estancia[];
  obtenerTransaccionesEstancia: (estanciaId: string) => TransaccionFinanciera[];
  movimientos: MovimientoGanado[];
  monedaFiltro: Moneda;
  modoAnalisis: 'FINANCIERO_PURO' | 'ECONOMICO_PRODUCTIVO';
  setModoAnalisis: (modo: 'FINANCIERO_PURO' | 'ECONOMICO_PRODUCTIVO') => void;
}

export const MatrizRentabilidadTabla: React.FC<MatrizRentabilidadTablaProps> = ({
  estancias,
  obtenerTransaccionesEstancia,
  movimientos,
  monedaFiltro,
  modoAnalisis,
  setModoAnalisis,
}) => {
  return (
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
  );
};
