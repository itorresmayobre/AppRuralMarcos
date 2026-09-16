// Servicio para obtener la cotización del dólar en Uruguay (USD a UYU)

const COTIZACION_FALLBACK_DEFAULT = 40.50; // Tipo de cambio base en Uruguay (Pesos por Dólar)

// Caché en memoria y almacenamiento de sesión (válido por 12 horas)
let cotizacionCacheInMemory: { valor: number; fechaHora: number } | null = null;
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 horas

export const cotizacionService = {
  /**
   * Obtiene la cotización del dólar para USD/UYU con caché de 12hs para evitar llamados HTTP redundantes
   */
  async obtenerCotizacionDolar(_fecha?: string): Promise<number> {
    const ahora = Date.now();

    // 1. Verificar caché en memoria
    if (cotizacionCacheInMemory && (ahora - cotizacionCacheInMemory.fechaHora < CACHE_TTL_MS)) {
      return cotizacionCacheInMemory.valor;
    }

    // 2. Verificar caché en sessionStorage
    try {
      const cacheGuardado = sessionStorage.getItem('app_cotizacion_usd_uyu');
      if (cacheGuardado) {
        const parsed = JSON.parse(cacheGuardado);
        if (parsed?.valor && (ahora - parsed.fechaHora < CACHE_TTL_MS)) {
          cotizacionCacheInMemory = parsed;
          return parsed.valor;
        }
      }
    } catch {
      // Ignorar lectura de storage si no está disponible
    }

    // 3. Consultar API pública de divisas
    try {
      const response = await fetch(`https://open.er-api.com/v6/latest/USD`);
      if (response.ok) {
        const data = await response.json();
        if (data?.rates?.UYU && typeof data.rates.UYU === 'number' && data.rates.UYU > 0) {
          const tc = Math.round(data.rates.UYU * 100) / 100;
          cotizacionCacheInMemory = { valor: tc, fechaHora: ahora };
          try {
            sessionStorage.setItem('app_cotizacion_usd_uyu', JSON.stringify({ valor: tc, fechaHora: ahora }));
          } catch {
            // Ignorar escritura de storage
          }
          return tc;
        }
      }
    } catch {
      // Fallback ante desconexión
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
