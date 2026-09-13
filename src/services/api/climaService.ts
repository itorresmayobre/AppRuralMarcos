// Servicio de Clima con Open-Meteo API (100% Gratuita, sin API key)

export interface PronosticoDia {
  fecha: string; // YYYY-MM-DD
  diaNombre: string; // ej: "Hoy", "Lun 15", "Mar 16"
  tempMax: number;
  tempMin: number;
  precipitacionMm: number;
  codigoClima: number;
  descripcion: string;
  icono: string; // 'sun' | 'cloud-sun' | 'rain' | 'thunder' | 'fog'
}

export interface ClimaActualData {
  ubicacionNombre: string;
  departamento: string;
  temperaturaActual: number;
  vientoKmh: number;
  humedadPorcentaje: number;
  codigoClima: number;
  descripcion: string;
  icono: string;
  pronostico7Dias: PronosticoDia[];
}

// Coordenadas geográficas de los departamentos de Uruguay
const COORDENADAS_URUGUAY: Record<string, { lat: number; lon: number }> = {
  Salto: { lat: -31.3833, lon: -57.9667 },
  Tacuarembó: { lat: -31.7167, lon: -55.9833 },
  Paysandú: { lat: -32.3167, lon: -58.0833 },
  Durazno: { lat: -33.3833, lon: -56.5167 },
  Florida: { lat: -34.1000, lon: -56.2167 },
  Lavalleja: { lat: -34.3759, lon: -55.2378 },
  Rocha: { lat: -34.4833, lon: -54.3333 },
  DEFAULT: { lat: -32.5200, lon: -55.7600 }, // Centro geográfico Uruguay
};

function interpretarCodigoWMO(code: number): { descripcion: string; icono: string } {
  if (code === 0) return { descripcion: 'Despejado / Soleado', icono: 'sun' };
  if (code >= 1 && code <= 3) return { descripcion: 'Parcialmente Nublado', icono: 'cloud-sun' };
  if (code === 45 || code === 48) return { descripcion: 'Niebla / Neblina', icono: 'fog' };
  if (code >= 51 && code <= 67) return { descripcion: 'Lluvias / Llovizna', icono: 'rain' };
  if (code >= 80 && code <= 82) return { descripcion: 'Chubascos Aislados', icono: 'rain' };
  if (code >= 95 && code <= 99) return { descripcion: 'Tormenta Eléctrica', icono: 'thunder' };
  return { descripcion: 'Nublado', icono: 'cloud-sun' };
}

function formatearNombreDia(fechaStr: string, index: number): string {
  if (index === 0) return 'Hoy';
  const fecha = new Date(fechaStr + 'T00:00:00');
  const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  return `${dias[fecha.getDay()]} ${fecha.getDate()}`;
}

export async function obtenerClimaEstancia(departamento?: string, nombreUbicacion?: string): Promise<ClimaActualData> {
  const coords = (departamento && COORDENADAS_URUGUAY[departamento]) 
    ? COORDENADAS_URUGUAY[departamento] 
    : COORDENADAS_URUGUAY.DEFAULT;

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=America%2FMontevideo`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Error al conectar con la API del clima');
    
    const data = await res.json();
    const current = data.current;
    const daily = data.daily;

    const actualInfo = interpretarCodigoWMO(current.weather_code);

    const pronostico7Dias: PronosticoDia[] = daily.time.map((fecha: string, idx: number) => {
      const wmo = interpretarCodigoWMO(daily.weather_code[idx]);
      return {
        fecha,
        diaNombre: formatearNombreDia(fecha, idx),
        tempMax: Math.round(daily.temperature_2m_max[idx]),
        tempMin: Math.round(daily.temperature_2m_min[idx]),
        precipitacionMm: Math.round((daily.precipitation_sum[idx] || 0) * 10) / 10,
        codigoClima: daily.weather_code[idx],
        descripcion: wmo.descripcion,
        icono: wmo.icono,
      };
    });

    return {
      ubicacionNombre: nombreUbicacion || (departamento ? `Depto. ${departamento}` : 'Uruguay Central'),
      departamento: departamento || 'Nacional',
      temperaturaActual: Math.round(current.temperature_2m),
      vientoKmh: Math.round(current.wind_speed_10m),
      humedadPorcentaje: Math.round(current.relative_humidity_2m),
      codigoClima: current.weather_code,
      descripcion: actualInfo.descripcion,
      icono: actualInfo.icono,
      pronostico7Dias,
    };
  } catch (error) {
    console.warn('Usando datos de clima offline/fallback:', error);

    // Fallback de contingencia si falla la red o está offline
    return {
      ubicacionNombre: nombreUbicacion || 'Establecimiento Rural',
      departamento: departamento || 'Uruguay',
      temperaturaActual: 22,
      vientoKmh: 14,
      humedadPorcentaje: 65,
      codigoClima: 0,
      descripcion: 'Despejado / Soleado (Estimado)',
      icono: 'sun',
      pronostico7Dias: [
        { fecha: '2026-09-13', diaNombre: 'Hoy', tempMax: 24, tempMin: 12, precipitacionMm: 0, codigoClima: 0, descripcion: 'Soleado', icono: 'sun' },
        { fecha: '2026-09-14', diaNombre: 'Lun 14', tempMax: 22, tempMin: 13, precipitacionMm: 2, codigoClima: 2, descripcion: 'Parcialmente Nublado', icono: 'cloud-sun' },
        { fecha: '2026-09-15', diaNombre: 'Mar 15', tempMax: 20, tempMin: 11, precipitacionMm: 15, codigoClima: 61, descripcion: 'Lluvias', icono: 'rain' },
        { fecha: '2026-09-16', diaNombre: 'Mié 16', tempMax: 19, tempMin: 9, precipitacionMm: 0, codigoClima: 1, descripcion: 'Algo Nublado', icono: 'cloud-sun' },
        { fecha: '2026-09-17', diaNombre: 'Jue 17', tempMax: 21, tempMin: 10, precipitacionMm: 0, codigoClima: 0, descripcion: 'Soleado', icono: 'sun' },
        { fecha: '2026-09-18', diaNombre: 'Vie 18', tempMax: 23, tempMin: 12, precipitacionMm: 5, codigoClima: 80, descripcion: 'Chubascos', icono: 'rain' },
        { fecha: '2026-09-19', diaNombre: 'Sáb 19', tempMax: 25, tempMin: 14, precipitacionMm: 0, codigoClima: 0, descripcion: 'Despejado', icono: 'sun' },
      ],
    };
  }
}
