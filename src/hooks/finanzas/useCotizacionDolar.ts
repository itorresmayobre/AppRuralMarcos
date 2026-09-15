import { useState, useEffect } from 'react';
import { cotizacionService } from '../../services/api/cotizacionService';
import type { Moneda } from '../../types';

export const useCotizacionDolar = (fecha: string) => {
  const [tipoCambio, setTipoCambio] = useState<number>(40.50);

  useEffect(() => {
    let unmounted = false;
    cotizacionService.obtenerCotizacionDolar(fecha).then((tc) => {
      if (!unmounted && tc > 0) setTipoCambio(tc);
    });
    return () => { unmounted = true; };
  }, [fecha]);

  const calcularConversion = (monto: number, moneda: Moneda) => {
    return cotizacionService.convertirMonto(monto, moneda, tipoCambio);
  };

  return {
    tipoCambio,
    calcularConversion,
  };
};
