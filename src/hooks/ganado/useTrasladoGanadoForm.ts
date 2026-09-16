import { useState } from 'react';
import { useEstanciasStore } from '../../stores/useEstanciasStore';
import { useGanadoStore } from '../../stores/useGanadoStore';
import { useToastStore } from '../../stores/useToastStore';
import type { SelectOption } from '../../components/ui/CustomSelect';
import type { EspecieGanado, CategoriaVacuno, CategoriaOvino } from '../../types';
import { hoyISO } from '../../utils/fechas';

const CATEGORIAS_VACUNAS: CategoriaVacuno[] = [
  'VACAS_DE_CRIA',
  'VAQUILLONAS_1_2',
  'VAQUILLONAS_MAS_2',
  'NOVILLOS_1_2',
  'NOVILLOS_MAS_2',
  'TERNEROS',
  'TERNERAS',
  'TOROS'
];

const CATEGORIAS_OVINAS: CategoriaOvino[] = [
  'OVEJAS_CRIA',
  'CAPONES',
  'CORDEROS_AS',
  'CARNEROS'
];

export const useTrasladoGanadoForm = (onClose: () => void) => {
  const { estancias, obtenerEstanciaActual } = useEstanciasStore();
  const { registrarMovimiento } = useGanadoStore();
  const { mostrarToast } = useToastStore();

  const estanciaActual = obtenerEstanciaActual();

  const [origenId, setOrigenId] = useState<string>(
    estanciaActual?.id || (estancias[0]?.id ?? '')
  );
  const [destinoId, setDestinoId] = useState<string>(
    estancias.find((e) => e.id !== origenId)?.id || (estancias[1]?.id ?? '')
  );

  const [especie, setEspecie] = useState<EspecieGanado>('VACUNO');
  const [categoria, setCategoria] = useState<string>('TERNEROS');
  const [cabezas, setCabezas] = useState<string>('20');
  const [kilosPromedio, setKilosPromedio] = useState<string>('160');
  const [fecha, setFecha] = useState<string>(hoyISO());
  const [observaciones, setObservaciones] = useState<string>('');

  // Imputación económica
  const [valorizar, setValorizar] = useState<boolean>(true);
  const [precioCabeza, setPrecioCabeza] = useState<string>('350');

  const numCabezas = parseInt(cabezas, 10) || 0;
  const numKilosProm = parseFloat(kilosPromedio) || 0;
  const numPrecioCab = parseFloat(precioCabeza) || 0;
  const totalKilos = numCabezas * numKilosProm;
  const totalImputado = valorizar ? numCabezas * numPrecioCab : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!estancias || estancias.length < 2 || !origenId || !destinoId) {
      mostrarToast(
        'Campos Insuficientes',
        'Necesitas al menos 2 establecimientos registrados para poder realizar un traslado de ganado.',
        'ADVERTENCIA'
      );
      return;
    }

    if (origenId === destinoId) {
      mostrarToast('Error de Validación', 'El establecimiento de origen y destino deben ser distintos.', 'ERROR');
      return;
    }

    if (numCabezas <= 0) {
      mostrarToast('Error de Validación', 'Ingresa una cantidad de cabezas válida mayor a 0.', 'ERROR');
      return;
    }

    const estanciaOrigenNom = estancias.find((e) => e.id === origenId)?.nombre || 'Origen';
    const estanciaDestinoNom = estancias.find((e) => e.id === destinoId)?.nombre || 'Destino';

    registrarMovimiento({
      estancia_origen_id: origenId,
      estancia_destino_id: destinoId,
      especie,
      categoria: categoria as CategoriaVacuno | CategoriaOvino,
      cabezas: numCabezas,
      kilos_promedio: numKilosProm > 0 ? numKilosProm : undefined,
      kilos_totales: totalKilos > 0 ? totalKilos : undefined,
      fecha,
      observaciones: observaciones || `Traslado de ${numCabezas} ${categoria} de ${estanciaOrigenNom} a ${estanciaDestinoNom}`,
      valorizar_transferencia: valorizar,
      precio_por_cabeza: valorizar ? numPrecioCab : undefined,
      precio_por_kilo: (valorizar && numKilosProm > 0) ? numPrecioCab / numKilosProm : undefined,
      monto_total_imputado: totalImputado,
    });

    mostrarToast(
      'Traslado Registrado',
      `Se trasladaron ${numCabezas} cabezas de ${estanciaOrigenNom} a ${estanciaDestinoNom}${
        valorizar ? ` (Imputación: USD ${totalImputado.toLocaleString()})` : ''
      }`,
      'EXITO'
    );

    onClose();
  };

  const origenOptions: SelectOption[] = estancias.map((e) => ({
    value: e.id,
    label: e.nombre,
    badge: `${e.hectareas_totales} Ha`,
  }));

  const destinoOptions: SelectOption[] = estancias.map((e) => ({
    value: e.id,
    label: `${e.nombre}${e.id === origenId ? ' (Origen)' : ''}`,
    badge: `${e.hectareas_totales} Ha`,
    disabled: e.id === origenId,
  }));

  const categoriaOptions: SelectOption[] = (
    especie === 'VACUNO' ? CATEGORIAS_VACUNAS : CATEGORIAS_OVINAS
  ).map((c) => ({
    value: c,
    label: c.replace(/_/g, ' '),
  }));

  // Retorno estructurado en submódulos legibles
  return {
    ubicacion: {
      origenId,
      setOrigenId,
      destinoId,
      setDestinoId,
      origenOptions,
      destinoOptions,
    },
    hacienda: {
      especie,
      setEspecie,
      categoria,
      setCategoria,
      cabezas,
      setCabezas,
      kilosPromedio,
      setKilosPromedio,
      categoriaOptions,
    },
    imputacion: {
      valorizar,
      setValorizar,
      precioCabeza,
      setPrecioCabeza,
      totalImputado,
    },
    detalle: {
      fecha,
      setFecha,
      observaciones,
      setObservaciones,
    },
    handleSubmit,
  };
};
