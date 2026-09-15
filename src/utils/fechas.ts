/**
 * Utilidades centralizadas para manejo de fechas en formato uruguayo (DD/MM/YYYY).
 * Resuelve desfasajes de días provocados por conversiones de zona horaria (UTC vs UYT local)
 * y estandariza la presentación visual en toda la aplicación.
 */

/**
 * Formatea cualquier representación de fecha (ISO "YYYY-MM-DD", "YYYY-MM-DDTHH:mm:ss", o Date)
 * al formato estándar uruguayo "DD/MM/YYYY".
 * 
 * Evita el desfasaje del día anterior al no asumir medianoche UTC.
 */
export function formatearFechaUY(fecha: string | Date | null | undefined): string {
  if (!fecha) return '-';

  if (fecha instanceof Date) {
    if (isNaN(fecha.getTime())) return '-';
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const anio = fecha.getFullYear();
    return `${dia}/${mes}/${anio}`;
  }

  const str = String(fecha).trim();
  if (!str) return '-';

  // Si ya viene en formato DD/MM/YYYY o DD/MM/YY
  const uyMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (uyMatch) {
    const [, day, month, year] = uyMatch;
    const fullYear = year.length === 2 ? `20${year}` : year;
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${fullYear}`;
  }

  // Si viene en formato ISO YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss
  const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  }

  // Fallback con Date object
  const d = new Date(str);
  if (isNaN(d.getTime())) return str;

  // Si la string era corta YYYY-MM-DD sin hora, extraer partes UTC para evitar timezone shift
  if (str.length === 10 && str.includes('-')) {
    const dia = String(d.getUTCDate()).padStart(2, '0');
    const mes = String(d.getUTCMonth() + 1).padStart(2, '0');
    const anio = d.getUTCFullYear();
    return `${dia}/${mes}/${anio}`;
  }

  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const anio = d.getFullYear();
  return `${dia}/${mes}/${anio}`;
}

/**
 * Obtiene la fecha actual de hoy en formato ISO "YYYY-MM-DD" respetando la zona horaria LOCAL.
 * Evita que `new Date().toISOString().split('T')[0]` devuelva el día siguiente cuando es de noche en Uruguay (UTC-3).
 */
export function hoyISO(refDate: Date = new Date()): string {
  const dia = String(refDate.getDate()).padStart(2, '0');
  const mes = String(refDate.getMonth() + 1).padStart(2, '0');
  const anio = refDate.getFullYear();
  return `${anio}-${mes}-${dia}`;
}

/**
 * Convierte cualquier fecha (DD/MM/YYYY o ISO) a formato ISO "YYYY-MM-DD" apto para inputs `<input type="date">`.
 */
export function aFechaInputHTML(fecha: string | Date | null | undefined): string {
  if (!fecha) return hoyISO();

  if (fecha instanceof Date) {
    return hoyISO(fecha);
  }

  const str = String(fecha).trim();
  const uyMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (uyMatch) {
    const [, day, month, year] = uyMatch;
    const fullYear = year.length === 2 ? `20${year}` : year;
    return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  return hoyISO();
}
