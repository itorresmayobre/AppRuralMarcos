// Servicio para obtener la cotización del dólar en Uruguay (USD a UYU)

const COTIZACION_FALLBACK_DEFAULT = 40.50; // Tipo de cambio base en Uruguay (Pesos por Dólar)

export const cotizacionService = {
  /**
   * Obtiene la cotización del dólar en tiempo real para USD/UYU
   */
  async obtenerCotizacionDolar(_fecha?: string): Promise<number> {
    try {
      // API pública de divisas con soporte de cotización UYU (Pesos Uruguayos)
      const response = await fetch(`https://open.er-api.com/v6/latest/USD`);
      if (response.ok) {
        const data = await response.json();
        if (data?.rates?.UYU && typeof data.rates.UYU === 'number' && data.rates.UYU > 0) {
          return Math.round(data.rates.UYU * 100) / 100;
        }
      }
    } catch {
      // En caso de corte de conexión o fallo de red, retorna el fallback de 40.50
    }
    return COTIZACION_FALLBACK_DEFAULT;
  },

  /**
   * Convierte un monto entre USD y UYU según la cotización dada
   */
  convertirMonto(monto: number, monedaOrigen: 'USD' | 'UYU', tipoCambio: number) {
    const tc = tipoCambio > 0 ? tipoCambio : COTIZACION_FALLBACK_DEFAULT;

    if (monedaOrigen === 'USD') {
      return {
        monto_usd: monto,
        monto_uyu: Math.round(monto * tc * 100) / 100,
        tipo_cambio: tc,
      };
    } else {
      return {
        monto_usd: Math.round((monto / tc) * 100) / 100,
        monto_uyu: monto,
        tipo_cambio: tc,
      };
    }
  }
};
