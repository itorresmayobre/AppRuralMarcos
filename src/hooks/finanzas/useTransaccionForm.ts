import { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useEstanciasStore } from '../../stores/useEstanciasStore';
import { useFinanzasStore } from '../../stores/useFinanzasStore';
import { useGanadoStore } from '../../stores/useGanadoStore';
import { useConceptosFinancierosStore } from '../../stores/useConceptosFinancierosStore';
import { useToastStore } from '../../stores/useToastStore';
import { useCotizacionDolar } from './useCotizacionDolar';
import { useProrrateoCampos } from './useProrrateoCampos';
import { calcularEjercicioYMesAgricola } from '../../utils/periodoAgricola';
import { hoyISO } from '../../utils/fechas';
import type { Moneda, TipoTransaccion, TransaccionFinanciera, EspecieGanado } from '../../types';

export const useTransaccionForm = (
  onClose: () => void,
  transaccionAEditar?: TransaccionFinanciera | null
) => {
  const { usuario } = useAuthStore();
  const { estancias, obtenerEstanciaActual } = useEstanciasStore();
  const { agregarTransaccion, actualizarTransaccion } = useFinanzasStore();
  const { registrarMovimiento } = useGanadoStore();
  const { catalog, obtenerConceptosActivosPorTipo } = useConceptosFinancierosStore();
  const { mostrarToast } = useToastStore();

  const currentRole = usuario?.rol || 'OPERARIO';
  const puedeVerFinanzas = currentRole === 'ADMIN' || currentRole === 'CONTADOR' || currentRole === 'PROPIETARIO' || currentRole === 'SUPERADMIN';

  const estanciaActual = obtenerEstanciaActual();
  const [estanciaFormId, setEstanciaFormId] = useState<string>(
    estanciaActual?.id || (estancias[0]?.id ?? '')
  );

  const [tipoFinanciero, setTipoFinanciero] = useState<TipoTransaccion>('INGRESO');
  const [moneda, setMoneda] = useState<Moneda>('USD');
  const [monto, setMonto] = useState<string>('');

  const conceptosDisponibles = obtenerConceptosActivosPorTipo(tipoFinanciero);
  const [categoria, setCategoria] = useState<string>(conceptosDisponibles[0]?.nombre || 'Ventas de Hacienda');
  const [naturalezaCosto, setNaturalezaCosto] = useState<'FIJO' | 'VARIABLE'>(
    conceptosDisponibles[0]?.naturaleza_costo || 'VARIABLE'
  );
  const [descripcionFinanciera, setDescripcionFinanciera] = useState<string>('');
  const [fecha, setFecha] = useState<string>(hoyISO());
  const [comprobanteUrl, setComprobanteUrl] = useState<string>('');
  const [comprobanteTipo, setComprobanteTipo] = useState<'IMAGE' | 'PDF' | undefined>(undefined);
  const [nroFactura, setNroFactura] = useState<string>('');

  // Campos de hacienda vinculados a stock
  const [sincronizarGanado, setSincronizarGanado] = useState<boolean>(false);
  const [ganadoEspecie, setGanadoEspecie] = useState<EspecieGanado>('VACUNO');
  const [ganadoCategoria, setGanadoCategoria] = useState<string>('NOVILLOS_1_2');
  const [ganadoCabezas, setGanadoCabezas] = useState<string>('');
  const [ganadoKilosPromedio, setGanadoKilosPromedio] = useState<string>('');
  const [ganadoKilosTotales, setGanadoKilosTotales] = useState<string>('');
  const [ganadoPrecioKg, setGanadoPrecioKg] = useState<string>('');

  // Consumir Sub-Hooks
  const cotizacion = useCotizacionDolar(fecha);
  const prorrateo = useProrrateoCampos();

  // Activar automáticamente el panel de hacienda si la categoría es Venta o Compra de Hacienda
  useEffect(() => {
    const esHacienda = categoria.toLowerCase().includes('hacienda');
    setSincronizarGanado(esHacienda);
  }, [categoria]);

  useEffect(() => {
    if (transaccionAEditar) {
      setEstanciaFormId(transaccionAEditar.estancia_id);
      setTipoFinanciero(transaccionAEditar.tipo);
      setMoneda(transaccionAEditar.moneda);
      setMonto(transaccionAEditar.monto.toString());
      setCategoria(transaccionAEditar.categoria);
      if (transaccionAEditar.naturaleza_costo) {
        setNaturalezaCosto(transaccionAEditar.naturaleza_costo);
      }
      setDescripcionFinanciera(transaccionAEditar.descripcion || '');
      setFecha(transaccionAEditar.fecha);
      setComprobanteUrl(transaccionAEditar.comprobante_url || '');
      setComprobanteTipo(transaccionAEditar.comprobante_tipo);
      setNroFactura(transaccionAEditar.nro_factura || '');
      prorrateo.setEsProrrateado(transaccionAEditar.es_prorrateado || false);
    }
  }, [transaccionAEditar]);

  const { ejercicio: ejercicioAgricola, mes: mesAgricola } = calcularEjercicioYMesAgricola(fecha);

  const handleSeleccionarCategoria = (conceptoItem: typeof catalog[0]) => {
    setCategoria(conceptoItem.nombre);
    if (conceptoItem.naturaleza_costo) {
      setNaturalezaCosto(conceptoItem.naturaleza_costo);
    }
    if (conceptoItem.es_recurrente_mensual || conceptoItem.naturaleza_costo === 'FIJO') {
      prorrateo.setEsProrrateado(true);
    }
  };

  const handleComprobanteChange = (url: string, fileType?: 'IMAGE' | 'PDF') => {
    setComprobanteUrl(url);
    if (fileType) setComprobanteTipo(fileType);
  };

  // Handlers sincronizados para kilos y cabezas
  const handleCabezasChange = (val: string) => {
    setGanadoCabezas(val);
    const numCab = parseInt(val) || 0;
    const numProm = parseFloat(ganadoKilosPromedio) || 0;
    if (numCab > 0 && numProm > 0) {
      const tot = Math.round(numCab * numProm);
      setGanadoKilosTotales(tot.toString());
      const numMonto = parseFloat(monto) || 0;
      if (numMonto > 0 && tot > 0) {
        setGanadoPrecioKg((numMonto / tot).toFixed(2));
      }
    }
  };

  const handleKilosPromedioChange = (val: string) => {
    setGanadoKilosPromedio(val);
    const numCab = parseInt(ganadoCabezas) || 0;
    const numProm = parseFloat(val) || 0;
    if (numCab > 0 && numProm > 0) {
      const tot = Math.round(numCab * numProm);
      setGanadoKilosTotales(tot.toString());
      const numMonto = parseFloat(monto) || 0;
      if (numMonto > 0 && tot > 0) {
        setGanadoPrecioKg((numMonto / tot).toFixed(2));
      }
    }
  };

  const handleKilosTotalesChange = (val: string) => {
    setGanadoKilosTotales(val);
    const numTot = parseFloat(val) || 0;
    const numCab = parseInt(ganadoCabezas) || 0;
    if (numCab > 0 && numTot > 0) {
      setGanadoKilosPromedio((numTot / numCab).toFixed(1));
    }
    const numMonto = parseFloat(monto) || 0;
    if (numMonto > 0 && numTot > 0) {
      setGanadoPrecioKg((numMonto / numTot).toFixed(2));
    }
  };

  const handlePrecioKgChange = (val: string) => {
    setGanadoPrecioKg(val);
    const numPrecio = parseFloat(val) || 0;
    const numTot = parseFloat(ganadoKilosTotales) || 0;
    if (numPrecio > 0 && numTot > 0) {
      setMonto(Math.round(numPrecio * numTot).toString());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!estancias || estancias.length === 0 || (!prorrateo.esProrrateado && !estanciaFormId)) {
      mostrarToast(
        'Sin Campo Seleccionado',
        'Debes crear primero al menos un establecimiento antes de registrar transacciones.',
        'ADVERTENCIA'
      );
      return;
    }

    const valMonto = parseFloat(monto);

    if (isNaN(valMonto) || valMonto <= 0) {
      mostrarToast('Error de Validación', 'Por favor ingresa un monto válido mayor a 0', 'ERROR');
      return;
    }

    const conversion = cotizacion.calcularConversion(valMonto, moneda);
    const distribucion = prorrateo.calcularDistribucion(valMonto);

    const estanciaIdReal = (estanciaFormId && estanciaFormId !== 'TODAS')
      ? estanciaFormId
      : (estancias[0]?.id || '');

    const payload = {
      estancia_id: estanciaIdReal,
      tipo: tipoFinanciero,
      categoria: categoria || 'General',
      descripcion: descripcionFinanciera || `${tipoFinanciero === 'INGRESO' ? 'Ingreso' : 'Egreso'} financiero`,
      fecha,
      ejercicio_agricola: ejercicioAgricola,
      periodo_mes: mesAgricola,
      naturaleza_costo: tipoFinanciero === 'EGRESO' ? naturalezaCosto : undefined,
      moneda,
      monto: valMonto,
      moneda_original: moneda,
      monto_original: valMonto,
      tipo_cambio: cotizacion.tipoCambio,
      monto_usd: conversion.monto_usd,
      monto_uyu: conversion.monto_uyu,
      es_prorrateado: prorrateo.esProrrateado,
      distribucion_prorrateo: distribucion,
      comprobante_url: comprobanteUrl || undefined,
      comprobante_tipo: comprobanteTipo,
      nro_factura: nroFactura || undefined,
    };

    try {
      if (transaccionAEditar?.id) {
        await actualizarTransaccion(transaccionAEditar.id, payload);
        mostrarToast(
          'Transacción Actualizada',
          `Se modificó la transacción por ${moneda} ${valMonto.toLocaleString('es-UY')}`,
          'EXITO'
        );
      } else {
        const transGuardada = await agregarTransaccion(payload);

        // Si se activó la sincronización con el stock de hacienda
        const numCab = parseInt(ganadoCabezas) || 0;
        if (sincronizarGanado && numCab > 0) {
          const numKgTot = parseFloat(ganadoKilosTotales) || undefined;
          const numKgProm = parseFloat(ganadoKilosPromedio) || undefined;
          const numPrecKg = parseFloat(ganadoPrecioKg) || undefined;

          const esVenta = tipoFinanciero === 'INGRESO';
          await registrarMovimiento({
            tipo_movimiento: esVenta ? 'VENTA' : 'COMPRA',
            estancia_origen_id: esVenta ? estanciaIdReal : null,
            estancia_destino_id: esVenta ? null : estanciaIdReal,
            especie: ganadoEspecie,
            categoria: ganadoCategoria as any,
            cabezas: numCab,
            kilos_totales: numKgTot,
            kilos_promedio: numKgProm,
            precio_por_kilo: numPrecKg,
            monto_total_imputado: conversion.monto_usd,
            fecha,
            observaciones: descripcionFinanciera || (esVenta ? 'Venta de hacienda' : 'Compra de hacienda'),
            transaccion_id: transGuardada || null,
          });

          mostrarToast(
            'Stock de Ganado Actualizado',
            `Se ${esVenta ? 'descontaron' : 'sumaron'} ${numCab} cabezas (${ganadoCategoria}) en el stock.`,
            'EXITO'
          );
        }
      }

      // Limpiar formulario y cerrar
      setMonto('');
      setDescripcionFinanciera('');
      setComprobanteUrl('');
      setComprobanteTipo(undefined);
      setNroFactura('');
      setGanadoCabezas('');
      setGanadoKilosPromedio('');
      setGanadoKilosTotales('');
      setGanadoPrecioKg('');
      onClose();
    } catch (err) {
      console.error('Error al guardar transacción:', err);
    }
  };

  return {
    puedeVerFinanzas,
    estanciaFormId,
    setEstanciaFormId,
    tipoFinanciero,
    setTipoFinanciero,
    moneda,
    setMoneda,
    monto,
    setMonto,
    categoria,
    conceptosDisponibles,
    naturalezaCosto,
    setNaturalezaCosto,
    descripcionFinanciera,
    setDescripcionFinanciera,
    fecha,
    setFecha,
    comprobanteUrl,
    setComprobanteUrl,
    comprobanteTipo,
    setComprobanteTipo,
    nroFactura,
    setNroFactura,
    handleComprobanteChange,
    cotizacion,
    prorrateo,
    handleSeleccionarCategoria,
    handleSubmit,
    // Estados de Hacienda
    sincronizarGanado,
    setSincronizarGanado,
    ganadoEspecie,
    setGanadoEspecie,
    ganadoCategoria,
    setGanadoCategoria,
    ganadoCabezas,
    handleCabezasChange,
    ganadoKilosPromedio,
    handleKilosPromedioChange,
    ganadoKilosTotales,
    handleKilosTotalesChange,
    ganadoPrecioKg,
    handlePrecioKgChange,
  };
};
