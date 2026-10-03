import React, { useState, useMemo } from 'react';
import type { PesadaGanado } from '../../types';
import { formatearFechaUY } from '../../utils/fechas';
import { TrendingUp, LineChart } from 'lucide-react';

interface GraficoEvolucionPesadasSVGProps {
  pesadas: PesadaGanado[];
}

const CATEGORY_COLORS: Record<string, string> = {
  TERNEROS: '#059669', // Emerald
  TERNERAS: '#d97706', // Amber
  NOVILLOS_1_2: '#2563eb', // Blue
  NOVILLOS_MAS_2: '#4f46e5', // Indigo
  VAQUILLONAS_1_2: '#9333ea', // Purple
  VAQUILLONAS_MAS_2: '#e11d48', // Rose
  VACAS_DE_CRIA: '#0891b2', // Cyan
  TOROS: '#dc2626', // Red
  CORDEROS_AS: '#16a34a',
  OVEJAS_CRIA: '#ca8a04',
  CAPONES: '#0284c7',
  CARNEROS: '#9333ea',
};

const DEFAULT_COLOR = '#64748b';

export const GraficoEvolucionPesadasSVG: React.FC<GraficoEvolucionPesadasSVGProps> = ({ pesadas }) => {
  const [metrica, setMetrica] = useState<'KG_PROMEDIO' | 'GDP_DIARIO'>('KG_PROMEDIO');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('TODAS');
  const [hoverPoint, setHoverPoint] = useState<{
    fecha: string;
    categoria: string;
    valor: number;
    cabezas: number;
    gdp?: number;
    x: number;
    y: number;
  } | null>(null);

  // 1. Obtener lista única de categorías presentes en los datos
  const categoriasPresentes = useMemo(() => {
    const setCats = new Set<string>();
    pesadas.forEach((p) => setCats.add(p.categoria));
    return Array.from(setCats);
  }, [pesadas]);

  // 2. Ordenar pesadas cronológicamente y procesar GDP
  const pesadasOrdenadas = useMemo(() => {
    const copia = [...pesadas].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
    
    // Calcular GDP para cada pesada
    return copia.map((p, idx) => {
      const pesadaPrevia = copia.slice(0, idx).reverse().find(
        (prev) => prev.estancia_id === p.estancia_id && prev.especie === p.especie && prev.categoria === p.categoria
      );

      let gdpGramos = 0;
      let difKilos = 0;
      let dias = 0;

      if (pesadaPrevia) {
        difKilos = p.kilos_promedio - pesadaPrevia.kilos_promedio;
        const dateActual = new Date(p.fecha).getTime();
        const datePrev = new Date(pesadaPrevia.fecha).getTime();
        dias = Math.max(1, Math.round((dateActual - datePrev) / (1000 * 60 * 60 * 24)));
        if (dias > 0) {
          gdpGramos = Math.round((difKilos * 1000) / dias);
        }
      }

      return {
        ...p,
        gdpGramos,
        difKilos,
        dias,
      };
    });
  }, [pesadas]);

  // 3. Filtrar por categoría seleccionada
  const pesadasFiltradas = useMemo(() => {
    if (categoriaFiltro === 'TODAS') return pesadasOrdenadas;
    return pesadasOrdenadas.filter((p) => p.categoria === categoriaFiltro);
  }, [pesadasOrdenadas, categoriaFiltro]);

  // Si no hay datos suficientes para graficar
  if (pesadasFiltradas.length === 0) {
    return (
      <article className="app-card bg-white border border-slate-200 p-6 rounded-xl shadow-sm text-center space-y-2">
        <LineChart className="w-8 h-8 text-slate-400 mx-auto" />
        <h3 className="text-xs font-bold text-slate-700">Sin Datos de Pesada para Graficar</h3>
        <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
          Registra al menos dos pesadas en la misma categoría para visualizar la evolución del peso promedio y la ganancia diaria (GDP g/día).
        </p>
      </article>
    );
  }

  // 4. Dimensiones del gráfico SVG
  const width = 800;
  const height = 260;
  const paddingLeft = 50;
  const paddingRight = 30;
  const paddingTop = 30;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // 5. Determinar rango Min y Max para Eje Y
  const valoresY = pesadasFiltradas.map((p) => (metrica === 'KG_PROMEDIO' ? p.kilos_promedio : p.gdpGramos));
  let minY = Math.min(...valoresY);
  let maxY = Math.max(...valoresY);

  if (minY === maxY) {
    minY = Math.max(0, minY - 20);
    maxY = maxY + 20;
  } else {
    const margin = (maxY - minY) * 0.15;
    minY = Math.max(0, Math.floor(minY - margin));
    maxY = Math.ceil(maxY + margin);
  }

  // 6. Agrupar pesadas por categoría para dibujar líneas independientes
  const seriesPorCategoriaMap = new Map<string, typeof pesadasFiltradas>();
  pesadasFiltradas.forEach((p) => {
    if (!seriesPorCategoriaMap.has(p.categoria)) {
      seriesPorCategoriaMap.set(p.categoria, []);
    }
    seriesPorCategoriaMap.get(p.categoria)!.push(p);
  });

  // Fechas globales para posicionar Eje X
  const fechasUnicas = Array.from(new Set(pesadasFiltradas.map((p) => p.fecha))).sort();
  const minTime = fechasUnicas.length > 0 ? new Date(fechasUnicas[0]).getTime() : 1;
  const maxTime = fechasUnicas.length > 1 ? new Date(fechasUnicas[fechasUnicas.length - 1]).getTime() : minTime + 86400000;

  const getX = (fechaStr: string) => {
    if (minTime === maxTime) return paddingLeft + chartWidth / 2;
    const t = new Date(fechaStr).getTime();
    return paddingLeft + ((t - minTime) / (maxTime - minTime)) * chartWidth;
  };

  const getY = (val: number) => {
    return height - paddingBottom - ((val - minY) / (maxY - minY)) * chartHeight;
  };

  return (
    <article className="app-card bg-white border border-slate-200 p-4 rounded-xl shadow-sm space-y-3">
      {/* Cabecera del Gráfico con Controles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>Curva de Evolución {metrica === 'KG_PROMEDIO' ? 'de Peso (Kg/Cab)' : 'de Ganancia Diaria (GDP g/día)'}</span>
          </h3>
          <p className="text-[11px] text-slate-500 font-medium">
            Trayectoria histórica comparativa por categoría y mes
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Toggle de Métrica */}
          <div className="bg-slate-100 p-0.5 rounded-lg border border-slate-200 flex items-center">
            <button
              type="button"
              onClick={() => setMetrica('KG_PROMEDIO')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                metrica === 'KG_PROMEDIO'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Kg Promedio
            </button>
            <button
              type="button"
              onClick={() => setMetrica('GDP_DIARIO')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                metrica === 'GDP_DIARIO'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              GDP (g/día)
            </button>
          </div>

          {/* Selector de Categoría */}
          <select
            value={categoriaFiltro}
            onChange={(e) => setCategoriaFiltro(e.target.value)}
            className="px-2.5 py-1 bg-slate-50 text-slate-800 border border-slate-300 rounded-lg text-[11px] font-bold outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="TODAS">Todas las Categorías</option>
            {categoriasPresentes.map((cat) => (
              <option key={cat} value={cat}>
                {cat.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Leyenda de Categorías */}
      <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold text-slate-600 px-1">
        {Array.from(seriesPorCategoriaMap.keys()).map((cat) => {
          const color = CATEGORY_COLORS[cat] || DEFAULT_COLOR;
          return (
            <div key={cat} className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: color }} />
              <span>{cat.replace(/_/g, ' ')}</span>
            </div>
          );
        })}
      </div>

      {/* Renderizado de SVG */}
      <div className="relative w-full">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto max-h-[300px] select-none overflow-visible">
          
          {/* Líneas de Grilla Horizontales Eje Y */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const val = minY + (maxY - minY) * (1 - ratio);
            const yPos = paddingTop + ratio * chartHeight;
            return (
              <g key={i}>
                <line
                  x1={paddingLeft}
                  y1={yPos}
                  x2={width - paddingRight}
                  y2={yPos}
                  stroke="#e2e8f0"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 8}
                  y={yPos + 4}
                  textAnchor="end"
                  className="fill-slate-400 text-[10px] font-mono font-bold"
                >
                  {Math.round(val)} {metrica === 'KG_PROMEDIO' ? 'kg' : 'g'}
                </text>
              </g>
            );
          })}

          {/* Etiquetas Eje X (Fechas) */}
          {fechasUnicas.map((fStr, idx) => {
            const xPos = getX(fStr);
            return (
              <text
                key={idx}
                x={xPos}
                y={height - 12}
                textAnchor="middle"
                className="fill-slate-500 text-[10px] font-mono font-medium"
              >
                {formatearFechaUY(fStr)}
              </text>
            );
          })}

          {/* Dibujo de Líneas por Categoría */}
          {Array.from(seriesPorCategoriaMap.entries()).map(([catKey, puntos]) => {
            const colorLine = CATEGORY_COLORS[catKey] || DEFAULT_COLOR;

            // Construir path 'd'
            const pathPoints = puntos.map((p) => {
              const val = metrica === 'KG_PROMEDIO' ? p.kilos_promedio : p.gdpGramos;
              return `${getX(p.fecha)},${getY(val)}`;
            });
            const dPath = `M ${pathPoints.join(' L ')}`;

            return (
              <g key={catKey}>
                {/* Línea Principal */}
                {puntos.length > 1 && (
                  <path
                    d={dPath}
                    fill="none"
                    stroke={colorLine}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Puntos de Datos */}
                {puntos.map((p, pIdx) => {
                  const val = metrica === 'KG_PROMEDIO' ? p.kilos_promedio : p.gdpGramos;
                  const cx = getX(p.fecha);
                  const cy = getY(val);

                  return (
                    <g
                      key={pIdx}
                      className="cursor-pointer"
                      onMouseEnter={() =>
                        setHoverPoint({
                          fecha: p.fecha,
                          categoria: p.categoria,
                          valor: val,
                          cabezas: p.cabezas,
                          gdp: p.gdpGramos,
                          x: cx,
                          y: cy,
                        })
                      }
                      onMouseLeave={() => setHoverPoint(null)}
                    >
                      {/* Zona de contacto invisible más amplia (14px) para evitar parpadeos */}
                      <circle cx={cx} cy={cy} r="14" fill="transparent" />
                      
                      {/* Círculo visual */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r="5"
                        fill="#ffffff"
                        stroke={colorLine}
                        strokeWidth="2.5"
                      />
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>

        {/* Tooltip Flotante en Hover con Posicionamiento Inteligente Anti-Recorte */}
        {hoverPoint && (() => {
          const isNearTop = hoverPoint.y < 80;
          const isNearLeft = hoverPoint.x < 140;
          const isNearRight = hoverPoint.x > width - 140;

          const alignX = isNearLeft ? 'translate-x-0' : isNearRight ? '-translate-x-full' : '-translate-x-1/2';
          const alignY = isNearTop ? 'translate-y-4' : '-translate-y-[calc(100%+12px)]';

          return (
            <div
              className={`absolute z-50 bg-slate-900/95 text-white p-2.5 rounded-xl shadow-xl text-[11px] font-bold pointer-events-none select-none transform transition-all duration-75 border border-slate-700 backdrop-blur-xs whitespace-nowrap ${alignX} ${alignY}`}
              style={{
                left: `${(hoverPoint.x / width) * 100}%`,
                top: `${(hoverPoint.y / height) * 100}%`,
                pointerEvents: 'none',
              }}
            >
              <div className="text-emerald-400 border-b border-slate-800 pb-1 mb-1 flex items-center justify-between gap-3">
                <span>{hoverPoint.categoria.replace(/_/g, ' ')}</span>
                <span className="text-[10px] bg-slate-800 text-emerald-300 px-1.5 py-0.5 rounded font-mono">
                  {hoverPoint.cabezas} cab.
                </span>
              </div>
              <div>Fecha: {formatearFechaUY(hoverPoint.fecha)}</div>
              <div className="text-emerald-300 font-extrabold mt-0.5">
                {metrica === 'KG_PROMEDIO'
                  ? `Peso: ${hoverPoint.valor} kg/cab`
                  : `GDP: ${hoverPoint.valor} g/día`}
              </div>
              {hoverPoint.gdp !== undefined && metrica === 'KG_PROMEDIO' && (
                <div className="text-slate-400 text-[10px] font-medium mt-0.5">
                  Ganancia: {hoverPoint.gdp >= 0 ? `+${hoverPoint.gdp}` : hoverPoint.gdp} g/día
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </article>
  );
};
