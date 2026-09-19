import React, { useState, useMemo } from 'react';
import { LineChart, Calendar, ArrowUpRight, ArrowDownRight, Info } from 'lucide-react';
import { MESES_AGRICOLAS, type MesAgricola } from '../../utils/periodoAgricola';
import type { Moneda } from '../../types';

interface Props {
  ejercicioFiltro: string;
  evolucionMensualMap: Record<string, { ingresos: number; egresos: number }>;
  monedaFiltro: Moneda;
}

export const EvolucionMensualGraficoSVG: React.FC<Props> = ({
  ejercicioFiltro,
  evolucionMensualMap,
  monedaFiltro,
}) => {
  const [mesHoverIndex, setMesHoverIndex] = useState<number | null>(null);

  // Mapear los 12 meses en orden agrícola
  const dataMeses = useMemo(() => {
    return MESES_AGRICOLAS.map((mes, index) => {
      const item = evolucionMensualMap[mes] || { ingresos: 0, egresos: 0 };
      const neto = item.ingresos - item.egresos;
      return {
        index,
        mes,
        ingresos: item.ingresos,
        egresos: item.egresos,
        neto,
      };
    });
  }, [evolucionMensualMap]);

  // Encontrar valor máximo para escalar el eje Y
  const maxValor = useMemo(() => {
    let max = 1000;
    dataMeses.forEach((d) => {
      if (d.ingresos > max) max = d.ingresos;
      if (d.egresos > max) max = d.egresos;
    });
    return Math.ceil(max * 1.15); // 15% de margen superior
  }, [dataMeses]);

  // Dimensiones del gráfico SVG
  const width = 800;
  const height = 240;
  const marginTop = 20;
  const marginBottom = 40;
  const marginLeft = 55;
  const marginRight = 25;

  const chartWidth = width - marginLeft - marginRight;
  const chartHeight = height - marginTop - marginBottom;

  // Cálculo de coordenadas X e Y para cada mes
  const puntos = useMemo(() => {
    return dataMeses.map((d, i) => {
      const x = marginLeft + (i * chartWidth) / (dataMeses.length - 1);
      const yIngresos = height - marginBottom - (d.ingresos * chartHeight) / maxValor;
      const yEgresos = height - marginBottom - (d.egresos * chartHeight) / maxValor;

      return {
        ...d,
        x,
        yIngresos,
        yEgresos,
      };
    });
  }, [dataMeses, marginLeft, chartWidth, height, marginBottom, chartHeight, maxValor]);

  // Generar paths SVG de líneas continuas
  const pathIngresos = useMemo(() => {
    if (puntos.length === 0) return '';
    return puntos.reduce((acc, p, idx) => {
      return idx === 0 ? `M ${p.x} ${p.yIngresos}` : `${acc} L ${p.x} ${p.yIngresos}`;
    }, '');
  }, [puntos]);

  const pathEgresos = useMemo(() => {
    if (puntos.length === 0) return '';
    return puntos.reduce((acc, p, idx) => {
      return idx === 0 ? `M ${p.x} ${p.yEgresos}` : `${acc} L ${p.x} ${p.yEgresos}`;
    }, '');
  }, [puntos]);

  // Totales acumulados del ejercicio completo para el estado por defecto (sin hover)
  const totalesEjercicio = useMemo(() => {
    const ing = dataMeses.reduce((sum, d) => sum + d.ingresos, 0);
    const egr = dataMeses.reduce((sum, d) => sum + d.egresos, 0);
    return {
      label: `Ejercicio ${ejercicioFiltro}`,
      ingresos: ing,
      egresos: egr,
      neto: ing - egr,
    };
  }, [dataMeses, ejercicioFiltro]);

  // Datos del mes actualmente enfocado (o el total del ejercicio por defecto)
  const infoBannerData = useMemo(() => {
    if (mesHoverIndex !== null && puntos[mesHoverIndex]) {
      const p = puntos[mesHoverIndex];
      return {
        label: `Mes: ${p.mes}`,
        ingresos: p.ingresos,
        egresos: p.egresos,
        neto: p.neto,
      };
    }
    return totalesEjercicio;
  }, [mesHoverIndex, puntos, totalesEjercicio]);

  // Eje Y con 4 divisiones
  const divisionesEjeY = useMemo(() => {
    const pasos = 4;
    const resultado = [];
    for (let i = 0; i <= pasos; i++) {
      const val = Math.round((maxValor / pasos) * i);
      const y = height - marginBottom - (val * chartHeight) / maxValor;
      resultado.push({ val, y });
    }
    return resultado;
  }, [maxValor, height, marginBottom, chartHeight]);

  return (
    <section aria-label="Gráfica de Evolución Mensual" className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <LineChart className="w-4 h-4 text-emerald-600" />
            <span>Evolución Mensual Comparativa ({ejercicioFiltro})</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Gráfica de flujo de caja mes a mes durante el año agrícola (Julio a Junio)
          </p>
        </div>

        {/* Leyenda */}
        <div className="flex items-center space-x-4 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-600 inline-block" />
            <span className="text-emerald-950 font-black">Ingresos</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500 border border-rose-600 inline-block" />
            <span className="text-rose-950 font-black">Egresos</span>
          </div>
        </div>
      </div>

      {/* Canvas SVG de Gráfica de Líneas con Fondo Claro */}
      <div className="relative bg-slate-50/70 text-slate-900 rounded-2xl p-3 border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Info flotante rápida (Por defecto Ejercicio, cambia al mes en hover) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 bg-white px-3.5 py-2 rounded-xl border border-slate-200 text-xs mb-2 shadow-xs">
          <div className="flex items-center space-x-2 font-bold text-slate-800">
            <Calendar className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            <span className="text-slate-950 font-black text-xs">{infoBannerData.label}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-4 font-mono font-bold text-[11px]">
            <span className="text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Ingresos: {monedaFiltro} {infoBannerData.ingresos.toLocaleString('es-UY')}
            </span>
            <span className="text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              Egresos: {monedaFiltro} {infoBannerData.egresos.toLocaleString('es-UY')}
            </span>
            <span className={`px-2 py-0.5 rounded border ${
              infoBannerData.neto >= 0
                ? 'text-emerald-950 bg-emerald-100 border-emerald-300 font-black'
                : 'text-rose-950 bg-rose-100 border-rose-300 font-black'
            }`}>
              Neto: {monedaFiltro} {infoBannerData.neto >= 0 ? '+' : ''}{infoBannerData.neto.toLocaleString('es-UY')}
            </span>
          </div>
        </div>

        {/* Gráfico SVG Vectorial Ultra-Liviano */}
        <div className="w-full overflow-x-auto custom-scrollbar">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto min-w-[650px] select-none"
          >
            {/* Grilla y Eje Y */}
            {divisionesEjeY.map((d, i) => (
              <g key={i}>
                <line
                  x1={marginLeft}
                  y1={d.y}
                  x2={width - marginRight}
                  y2={d.y}
                  stroke="#e2e8f0"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={marginLeft - 8}
                  y={d.y + 4}
                  textAnchor="end"
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="600"
                >
                  {d.val >= 1000000 
                    ? `${(d.val / 1000000) % 1 === 0 ? (d.val / 1000000).toFixed(0) : (d.val / 1000000).toFixed(1)}M`
                    : d.val >= 1000 
                    ? `${(d.val / 1000) % 1 === 0 ? (d.val / 1000).toFixed(0) : (d.val / 1000).toFixed(1)}k`
                    : d.val}
                </text>
              </g>
            ))}

            {/* Línea de Egresos (Roja / Rosa) */}
            {pathEgresos && (
              <path
                d={pathEgresos}
                fill="none"
                stroke="#e11d48"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Línea de Ingresos (Verde Esmeralda) */}
            {pathIngresos && (
              <path
                d={pathIngresos}
                fill="none"
                stroke="#059669"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Puntos de Datos e Interacción por Mes */}
            {puntos.map((p, idx) => {
              const isHovered = mesHoverIndex === idx;

              return (
                <g
                  key={p.mes}
                  onMouseEnter={() => setMesHoverIndex(idx)}
                  onMouseLeave={() => setMesHoverIndex(null)}
                  className="cursor-pointer"
                >
                  {/* Línea Vertical de Hover */}
                  {isHovered && (
                    <line
                      x1={p.x}
                      y1={marginTop}
                      x2={p.x}
                      y2={height - marginBottom}
                      stroke="#94a3b8"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                    />
                  )}

                  {/* Punto Egresos */}
                  <circle
                    cx={p.x}
                    cy={p.yEgresos}
                    r={isHovered ? 6 : 4}
                    fill="#e11d48"
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="transition-all duration-150 shadow-xs"
                  />

                  {/* Punto Ingresos */}
                  <circle
                    cx={p.x}
                    cy={p.yIngresos}
                    r={isHovered ? 7 : 4.5}
                    fill="#059669"
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="transition-all duration-150 shadow-xs"
                  />

                  {/* Etiqueta del Mes en Eje X */}
                  <text
                    x={p.x}
                    y={height - 12}
                    textAnchor="middle"
                    fill={isHovered ? '#047857' : '#475569'}
                    fontSize="11"
                    fontWeight={isHovered ? '900' : '700'}
                  >
                    {p.mes.slice(0, 3)}
                  </text>

                  {/* Zona de Hover Invisible Ampliada */}
                  <rect
                    x={p.x - 20}
                    y={marginTop}
                    width={40}
                    height={chartHeight}
                    fill="transparent"
                  />
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </section>
  );
};
