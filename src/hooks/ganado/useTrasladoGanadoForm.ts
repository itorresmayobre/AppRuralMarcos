import { useState, useEffect } from 'react';
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
  const { stockList, registrarMovimiento, cargarGanadoDesdeSupabase } = useGanadoStore();
  const { mostrarToast } = useToastStore();

  // Asegurar que el stock esté fresco al abrir el formulario de traslado
  useEffect(() => {
    cargarGanadoDesdeSupabase();
  }, [cargarGanadoDesdeSupabase]);

  const estanciaActual = obtenerEstanciaActual();

  const [origenId, setOrigenId] = useState<string>(
    estanciaActual?.id || (estancias[0]?.id ?? '')
  );
  const [destinoId, setDestinoId] = useState<string>(
    estancias.find((e) => e.id !== (estanciaActual?.id || estancias[0]?.id))?.id || (estancias[1]?.id ?? '')
  );

  const [especie, setEspecie] = useState<EspecieGanado>('VACUNO');

  // Obtener todas las categorías conocidas de esta especie (estándar + registradas en BD)
  const categoriasBase = especie === 'VACUNO' ? CATEGORIAS_VACUNAS : CATEGORIAS_OVINAS;
  const categoriasEnStock = stockList
    .filter((s) => s.especie === especie)
    .map((s) => s.categoria);
  const todasLasCategorias = Array.from(new Set([...categoriasBase, ...categoriasEnStock]));

  const [categoria, setCategoria] = useState<string>(
    todasLasCategorias[0] || (especie === 'VACUNO' ? 'VACAS_DE_CRIA' : 'OVEJAS_CRIA')
  );

  // Auto-seleccionar una categoría que sí tenga stock positivo cuando cambie el origen o la especie
  useEffect(() => {
    if (!origenId) return;

    const stockCatActual = stockList.find(
      (s) => s.estancia_id === origenId && s.especie === especie && s.categoria === categoria
    );

    if (!stockCatActual || stockCatActual.cabezas <= 0) {
      const primeraConStock = stockList.find(
        (s) => s.estancia_id === origenId && s.especie === especie && s.cabezas > 0
      );

      if (primeraConStock) {
        setCategoria(primeraConStock.categoria);
      } else if (todasLasCategorias.length > 0) {
        setCategoria(todasLasCategorias[0]);
      }
    }
  }, [origenId, especie, stockList]);

  const [cabezas, setCabezas] = useState<string>('20');
  const [kilosPromedio, setKilosPromedio] = useState<string>('160');
  const [fecha, setFecha] = useState<string>(hoyISO());
  const [observaciones, setObservaciones] = useState<string>('');

  // Imputación económica
  const [valorizar, setValorizar] = useState<boolean>(true);
  const [precioCabeza, setPrecioCabeza] = useState<string>('350');

  // Stock disponible en la estancia de origen seleccionada para la categoría actual
  const stockOrigenItem = stockList.find(
    (s) => s.estancia_id === origenId && s.especie === especie && s.categoria === categoria
  );
  const stockDisponible = stockOrigenItem ? stockOrigenItem.cabezas : 0;

  // Ajustar automáticamente la cantidad de cabezas por defecto si supera el stock disponible
  useEffect(() => {
    if (stockDisponible > 0) {
      const numAct = parseInt(cabezas, 10) || 0;
      if (numAct === 0 || numAct > stockDisponible) {
        setCabezas(Math.min(20, stockDisponible).toString());
      }
    }
  }, [stockDisponible]);

  const numCabezas = parseInt(cabezas, 10) || 0;
  const numKilosProm = parseFloat(kilosPromedio) || 0;
  const numPrecioCab = parseFloat(precioCabeza) || 0;
  const totalKilos = numCabezas * numKilosProm;
  const totalImputado = valorizar ? numCabezas * numPrecioCab : 0;

  const handleSubmit = async (e: React.FormEvent) => {
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

    if (stockDisponible <= 0) {
      mostrarToast(
        'Sin Stock Disponible',
        `El establecimiento de origen no cuenta con stock disponible de ${categoria.replace(/_/g, ' ')}.`,
        'ERROR'
      );
      return;
    }

    if (numCabezas > stockDisponible) {
      mostrarToast(
        'Stock Insuficiente',
        `No puedes trasladar ${numCabezas} cabezas. El establecimiento de origen solo dispone de ${stockDisponible} cabezas.`,
        'ERROR'
      );
      return;
    }

    const estanciaOrigenNom = estancias.find((e) => e.id === origenId)?.nombre || 'Origen';
    const estanciaDestinoNom = estancias.find((e) => e.id === destinoId)?.nombre || 'Destino';

    await registrarMovimiento({
      estancia_origen_id: origenId,
      estancia_destino_id: destinoId,
      especie,
      categoria: categoria as CategoriaVacuno | CategoriaOvino,
      cabezas: numCabezas,
      kilos_promedio: numKilosProm > 0 ? numKilosProm : undefined,
      kilos_totales: totalKilos > 0 ? totalKilos : undefined,
      fecha,
      observaciones: observaciones || `Traslado de ${numCabezas} ${categoria.replace(/_/g, ' ')} de ${estanciaOrigenNom} a ${estanciaDestinoNom}`,
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

    setObservaciones('');
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

  // Opciones de categoría ordenadas para mostrar las que tienen stock primero
  const categoriaOptions: SelectOption[] = todasLasCategorias
    .map((c) => {
      const stockCat = stockList.find(
        (s) => s.estancia_id === origenId && s.especie === especie && s.categoria === c
      )?.cabezas || 0;
      return {
        value: c,
        label: `${c.replace(/_/g, ' ')} (${stockCat} cab. disponible${stockCat !== 1 ? 's' : ''})`,
        stockCat,
      };
    })
    .sort((a, b) => b.stockCat - a.stockCat)
    .map(({ value, label }) => ({ value, label }));

  return {
    estancias,
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
      stockDisponible,
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
