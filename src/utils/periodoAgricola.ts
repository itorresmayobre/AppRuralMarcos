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
 */
export function calcularEjercicioYMesAgricola(fechaStr: string): { ejercicio: string; mes: MesAgricola } {
  if (!fechaStr) {
    return { ejercicio: '2025/2026', mes: 'Setiembre' };
  }

  const partes = fechaStr.split('-');
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
