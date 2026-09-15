import { useState } from 'react';
import { useEstanciasStore } from '../../stores/useEstanciasStore';
import type { DistribucionProrrateoItem } from '../../types';

export const useProrrateoCampos = () => {
  const { estancias, reglasProrrateo } = useEstanciasStore();

  const [esProrrateado, setEsProrrateado] = useState<boolean>(false);
  const [customProrrateo, setCustomProrrateo] = useState<Record<string, number>>(reglasProrrateo);

  const handleProrrateoChange = (estanciaId: string, porcentaje: number) => {
    setCustomProrrateo((prev) => ({ ...prev, [estanciaId]: porcentaje }));
  };

  const calcularDistribucion = (montoTotal: number): DistribucionProrrateoItem[] | undefined => {
    if (!esProrrateado) return undefined;
    return estancias.map((est) => {
      const pct = customProrrateo[est.id] || 0;
      const montoParcial = Math.round((montoTotal * (pct / 100)) * 100) / 100;
      return {
        estancia_id: est.id,
        porcentaje: pct,
        monto: montoParcial,
      };
    });
  };

  return {
    estancias,
    esProrrateado,
    setEsProrrateado,
    customProrrateo,
    handleProrrateoChange,
    calcularDistribucion,
  };
};
