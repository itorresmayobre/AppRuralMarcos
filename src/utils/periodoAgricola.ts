import { aFechaInputHTML } from './fechas';

export const MESES_AGRICOLAS = [
  'Julio',
  'Agosto',
  'Setiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio'
] as const;

export type MesAgricola = typeof MESES_AGRICOLAS[number];

/**
 * En Uruguay, el Ejercicio Agrícola-Ganadero va del 1 de Julio al 30 de Junio.
 * Ejemplo:
 * - 15/09/2025 -> Ejercicio 2025/2026, Mes: Setiembre
 * - 10/03/2026 -> Ejercicio 2025/2026, Mes: Marzo
 * - 15/09/2026 -> Ejercicio 2026/2027, Mes: Setiembre
 */
export function calcularEjercicioYMesAgricola(fechaStr: string): { ejercicio: string; mes: MesAgricola } {
  if (!fechaStr) {
    return { ejercicio: obtenerEjercicioAgricolaActual(), mes: 'Setiembre' };
  }

  const isoFecha = aFechaInputHTML(fechaStr);
  const partes = isoFecha.split('-');
  let year = parseInt(partes[0], 10);
  let month = parseInt(partes[1], 10); // 1 = Enero, 7 = Julio

  if (isNaN(year) || isNaN(month)) {
    const d = new Date();
    year = d.getFullYear();
    month = d.getMonth() + 1;
  }

  const mapaMeses: Record<number, MesAgricola> = {
    1: 'Enero',
    2: 'Febrero',
    3: 'Marzo',
    4: 'Abril',
    5: 'Mayo',
    6: 'Junio',
    7: 'Julio',
    8: 'Agosto',
    9: 'Setiembre',
    10: 'Octubre',
    11: 'Noviembre',
    12: 'Diciembre'
  };

  const mesNombre = mapaMeses[month] || 'Setiembre';

  let ejercicio = '';
  if (month >= 7) {
    // Julio (7) a Diciembre (12)
    ejercicio = `${year}/${year + 1}`;
  } else {
    // Enero (1) a Junio (6)
    ejercicio = `${year - 1}/${year}`;
  }

  return {
    ejercicio,
    mes: mesNombre
  };
}

/**
 * Obtiene el Ejercicio Agrícola en curso basado en la fecha actual (o la fecha provista).
 * Si la fecha es a partir de Julio, el ejercicio es YYYY/YYYY+1.
 * Si es antes de Julio (Enero-Junio), el ejercicio es YYYY-1/YYYY.
 */
export function obtenerEjercicioAgricolaActual(refDate: Date = new Date()): string {
  const year = refDate.getFullYear();
  const month = refDate.getMonth() + 1;
  if (month >= 7) {
    return `${year}/${year + 1}`;
  } else {
    return `${year - 1}/${year}`;
  }
}

/**
 * Genera dinámicamente la lista de ejercicios disponibles combinando:
 * - El ejercicio agrícola actual según el calendario.
 * - Todos los ejercicios con transacciones registradas.
 * - Un rango de ejercicios anteriores y futuros de cortesía.
 */
export function obtenerListaEjerciciosDinamica(fechasTransacciones: string[] = []): string[] {
  const ejercicioActual = obtenerEjercicioAgricolaActual();
  const ejerciciosSet = new Set<string>();

  ejerciciosSet.add(ejercicioActual);

  // Agregar ejercicios de transacciones reales
  fechasTransacciones.forEach((fecha) => {
    if (fecha) {
      const { ejercicio } = calcularEjercicioYMesAgricola(fecha);
      ejerciciosSet.add(ejercicio);
    }
  });

  // Agregar también el año pasado y el año siguiente para facilidad de navegación
  const hoy = new Date();
  const startYearActual = hoy.getMonth() + 1 >= 7 ? hoy.getFullYear() : hoy.getFullYear() - 1;
  for (let i = -2; i <= 1; i++) {
    const startY = startYearActual + i;
    ejerciciosSet.add(`${startY}/${startY + 1}`);
  }

  // Ordenar descendentemente por año de inicio (ej: 2026/2027 > 2025/2026 > 2024/2025)
  return Array.from(ejerciciosSet).sort((a, b) => {
    const yearA = parseInt(a.split('/')[0], 10) || 0;
    const yearB = parseInt(b.split('/')[0], 10) || 0;
    return yearB - yearA;
  });
}
