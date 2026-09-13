import React, { useState, useEffect } from 'react';
import { 
  obtenerClimaEstancia, 
  type ClimaActualData, 
  type PronosticoDia 
} from '../../services/api/climaService';
import { 
  Sun, 
  CloudSun, 
  CloudRain, 
  CloudLightning, 
  CloudFog, 
  Wind, 
  Droplets, 
  RefreshCw, 
  MapPin, 
  Calendar,
  CloudDrizzle
} from 'lucide-react';

interface ClimaWidgetProps {
  departamento?: string;
  nombreEstancia?: string;
}

export const ClimaWidget: React.FC<ClimaWidgetProps> = ({ departamento, nombreEstancia }) => {
  const [clima, setClima] = useState<ClimaActualData | null>(null);
  const [cargando, setCargando] = useState(true);

  const cargarClima = async () => {
    setCargando(true);
    try {
      const data = await obtenerClimaEstancia(departamento, nombreEstancia);
      setClima(data);
    } catch (e) {
      console.error('Error cargando clima:', e);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarClima();
  }, [departamento, nombreEstancia]);

  const renderIconoClima = (icono: string, className: string) => {
    switch (icono) {
      case 'sun':
        return <Sun className={`${className} text-amber-400`} />;
      case 'cloud-sun':
        return <CloudSun className={`${className} text-amber-300`} />;
      case 'rain':
        return <CloudRain className={`${className} text-blue-400`} />;
      case 'thunder':
        return <CloudLightning className={`${className} text-purple-400`} />;
      case 'fog':
        return <CloudFog className={`${className} text-slate-300`} />;
      default:
        return <Sun className={`${className} text-amber-400`} />;
    }
  };

  if (cargando) {
    return (
      <article className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 text-white shadow-xl animate-pulse space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-slate-800 rounded w-1/3"></div>
          <div className="h-4 bg-slate-800 rounded w-1/4"></div>
        </div>
        <div className="h-16 bg-slate-800 rounded-2xl w-full"></div>
        <div className="grid grid-cols-7 gap-2">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-800 rounded-xl"></div>
          ))}
        </div>
      </article>
    );
  }

  if (!clima) return null;

  return (
    <article aria-label="Widget del Clima y Pronóstico Agrometeorológico" className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-6 text-white shadow-2xl space-y-5">
      
      {/* Cabecera del Clima */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-emerald-500/30 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-emerald-400" />
              {clima.ubicacionNombre}
            </span>
            <span className="text-slate-400 text-xs font-semibold">
              Open-Meteo Uruguay
            </span>
          </div>
          <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
            <span>Pronóstico Agrometeorológico Semanal</span>
          </h3>
        </div>

        <button
          onClick={cargarClima}
          title="Actualizar datos del clima"
          aria-label="Actualizar datos del clima"
          className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white p-2 rounded-xl transition-all border border-slate-700/60 min-h-[38px] min-w-[38px] flex items-center justify-center cursor-pointer active:scale-95"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </header>

      {/* Bloque Principal del Clima Actual */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/70 p-4 sm:p-5 rounded-2xl border border-slate-800/90 shadow-inner">
        
        {/* Temperatura Actual e Ícono */}
        <div className="flex items-center space-x-4 md:border-r border-slate-800/80 pr-4">
          <div className="p-3 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-md">
            {renderIconoClima(clima.icono, 'w-10 h-10')}
          </div>
          <div>
            <div className="flex items-baseline space-x-1">
              <span className="text-3xl font-black text-white">{clima.temperaturaActual}°</span>
              <span className="text-sm text-slate-400 font-semibold">C</span>
            </div>
            <p className="text-xs font-bold text-slate-300">{clima.descripcion}</p>
          </div>
        </div>

        {/* Métricas Agrometeorológicas (Viento y Humedad) */}
        <div className="grid grid-cols-2 gap-3 md:col-span-2">
          
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex items-center space-x-3">
            <div className="p-2 bg-blue-950/80 rounded-lg text-blue-400 border border-blue-800/50">
              <Wind className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Viento</p>
              <p className="text-xs font-extrabold text-white">{clima.vientoKmh} km/h</p>
            </div>
          </div>

          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex items-center space-x-3">
            <div className="p-2 bg-cyan-950/80 rounded-lg text-cyan-400 border border-cyan-800/50">
              <Droplets className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Humedad</p>
              <p className="text-xs font-extrabold text-white">{clima.humedadPorcentaje} %</p>
            </div>
          </div>

        </div>

      </div>

      {/* Título Pronóstico 7 Días */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-300">
          <Calendar className="w-4 h-4 text-emerald-400" />
          <span>Pronóstico a 7 Días para Pasturas y Ganado:</span>
        </div>
      </div>

      {/* Grid de Pronóstico 7 Días */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {clima.pronostico7Dias.map((dia: PronosticoDia, idx: number) => (
          <div
            key={dia.fecha}
            className={`p-3 rounded-2xl border text-center transition-all flex flex-col justify-between space-y-2 ${
              idx === 0
                ? 'bg-gradient-to-b from-emerald-950/80 to-slate-900 border-emerald-700/60 shadow-lg shadow-emerald-950/50 ring-1 ring-emerald-500/40'
                : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
            }`}
          >
            <div>
              <span className={`text-[11px] font-extrabold block ${idx === 0 ? 'text-emerald-300' : 'text-slate-300'}`}>
                {dia.diaNombre}
              </span>
              <span className="text-[10px] text-slate-400 block truncate" title={dia.descripcion}>
                {dia.descripcion}
              </span>
            </div>

            <div className="my-1 flex justify-center">
              {renderIconoClima(dia.icono, 'w-7 h-7')}
            </div>

            <div className="space-y-1">
              <div className="flex justify-center items-baseline space-x-1.5 text-xs font-bold">
                <span className="text-white">{dia.tempMax}°</span>
                <span className="text-slate-500 text-[10px]">{dia.tempMin}°</span>
              </div>

              {dia.precipitacionMm > 0 ? (
                <div className="inline-flex items-center gap-1 bg-blue-950/90 text-blue-300 border border-blue-800/60 px-1.5 py-0.5 rounded-md text-[10px] font-extrabold">
                  <CloudDrizzle className="w-3 h-3 text-blue-400 flex-shrink-0" />
                  <span>{dia.precipitacionMm} mm</span>
                </div>
              ) : (
                <div className="text-[10px] text-slate-500 font-medium py-0.5">
                  0 mm
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

    </article>
  );
};
