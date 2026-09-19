import type { TransaccionFinanciera, Moneda } from '../types';

/**
 * Convierte dinámicamente el monto de una transacción a la moneda seleccionada (USD o UYU)
 * utilizando estrictamente los valores convertidos almacenados (monto_usd, monto_uyu)
 * o el tipo de cambio oficial guardado (tipo_cambio) de la transacción.
 * NUNCA utiliza constantes arbitrarias hardcodeadas.
 */
export function obtenerMontoEnMoneda(t: TransaccionFinanciera, monedaDeseada: Moneda): number {
  if (monedaDeseada === 'USD') {
    if (typeof t.monto_usd === 'number' && !isNaN(t.monto_usd) && t.monto_usd > 0) {
      return t.monto_usd;
    }
    if (t.moneda === 'USD') return t.monto;
    if (t.tipo_cambio && t.tipo_cambio > 0) {
      return Math.round((t.monto / t.tipo_cambio) * 100) / 100;
    }
    return t.monto;
  } else {
    if (typeof t.monto_uyu === 'number' && !isNaN(t.monto_uyu) && t.monto_uyu > 0) {
      return t.monto_uyu;
    }
    if (t.moneda === 'UYU') return t.monto;
    if (t.tipo_cambio && t.tipo_cambio > 0) {
      return Math.round(t.monto * t.tipo_cambio);
    }
    return t.monto;
  }
}
