import React from 'react';
import { Building2, Truck, MapPin } from 'lucide-react';
import type { Estancia, Moneda, TransaccionFinanciera, MovimientoGanado } from '../../types';
import { obtenerMontoEnMoneda } from '../../utils/monedas';

import { useFinanzasStore } from '../../stores/useFinanzasStore';

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
  const { transacciones } = useFinanzasStore();
  const tcEfectivo = transacciones.find((t) => t.tipo_cambio && t.tipo_cambio > 0)?.tipo_cambio || 1;
  const factorConversionHacienda = monedaFiltro === 'UYU' ? tcEfectivo : 1;

  return (
    <section aria-label="Matriz de Rentabilidad por Campo" className="app-card space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-2.5">
        <div>
          <h3 className="app-section-title">
            <Building2 className="w-5 h-5 text-emerald-600" />
            <span>Matriz de Rentabilidad por Campo (Establecimiento)</span>
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Comparativo de margen por hectárea y transferencias valorizadas entre predios de cría e invernada.
          </p>
        </div>

        {/* Selector de Modo de Análisis (Financiero Puro vs Económico) */}
        <div className="flex bg-slate-100 p-1 rounded-lg self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setModoAnalisis('FINANCIERO_PURO')}
            className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
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
            className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
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
      <div className="app-table-container">
        <table className="app-table">
          <thead>
            <tr>
              <th>Establecimiento</th>
              <th>Superficie / Tenencia</th>
              <th className="text-right">Ventas Reales</th>
              {modoAnalisis === 'ECONOMICO_PRODUCTIVO' && (
                <>
                  <th className="text-right text-emerald-700">Transf. Salientes (+USD)</th>
                  <th className="text-right text-rose-700">Transf. Entrantes (-USD)</th>
                </>
              )}
              <th className="text-right">Egresos Reales</th>
              <th className="text-right">Resultado Neto</th>
              <th className="text-right">Margen / Ha / Año</th>
            </tr>
          </thead>
          <tbody>
            {estancias.map((est) => {
              const txEst = obtenerTransaccionesEstancia(est.id);
              const ventasReales = txEst.filter((t) => t.tipo === 'INGRESO').reduce((a, b) => a + obtenerMontoEnMoneda(b, monedaFiltro), 0);
              const egresosReales = txEst.filter((t) => t.tipo === 'EGRESO').reduce((a, b) => a + obtenerMontoEnMoneda(b, monedaFiltro), 0);

              // Transferencias salientes (crédito) y entrantes (débito)
              const transfSalientes = movimientos
                .filter((m) => m.estancia_origen_id === est.id && m.valorizar_transferencia)
                .reduce((a, b) => a + (b.monto_total_imputado * factorConversionHacienda), 0);

              const transfEntrantes = movimientos
                .filter((m) => m.estancia_destino_id === est.id && m.valorizar_transferencia)
                .reduce((a, b) => a + (b.monto_total_imputado * factorConversionHacienda), 0);

              const ingresosEfectivos = modoAnalisis === 'ECONOMICO_PRODUCTIVO'
                ? ventasReales + transfSalientes
                : ventasReales;

              const egresosEfectivos = modoAnalisis === 'ECONOMICO_PRODUCTIVO'
                ? egresosReales + transfEntrantes
                : egresosReales;

              const neto = ingresosEfectivos - egresosEfectivos;
              const margenHa = Math.round(neto / (est.hectareas_totales || 1));

              return (
                <tr key={est.id}>
                  <td className="font-bold text-slate-900 flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>{est.nombre}</span>
                  </td>
                  <td className="text-slate-600">
                    <span className="font-bold">{est.hectareas_totales} Ha</span>
                    <span className="text-[10px] text-slate-400 block uppercase font-mono">{est.tipo_tenencia}</span>
                  </td>
                  <td className="text-right font-mono font-bold text-emerald-800">
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
