import { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useEstanciasStore } from '../../stores/useEstanciasStore';
import { useFinanzasStore } from '../../stores/useFinanzasStore';
import { useConceptosFinancierosStore } from '../../stores/useConceptosFinancierosStore';
import { useToastStore } from '../../stores/useToastStore';
import { useCotizacionDolar } from './useCotizacionDolar';
import { useProrrateoCampos } from './useProrrateoCampos';
import { calcularEjercicioYMesAgricola } from '../../utils/periodoAgricola';
import { hoyISO } from '../../utils/fechas';
import type { Moneda, TipoTransaccion, TransaccionFinanciera } from '../../types';

export const useTransaccionForm = (
  onClose: () => void,
  transaccionAEditar?: TransaccionFinanciera | null
) => {
  const { usuario } = useAuthStore();
  const { estancias, obtenerEstanciaActual } = useEstanciasStore();
  const { agregarTransaccion, actualizarTransaccion } = useFinanzasStore();
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

  // Consumir Sub-Hooks
  const cotizacion = useCotizacionDolar(fecha);
  const prorrateo = useProrrateoCampos();

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

  const handleSubmit = (e: React.FormEvent) => {
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

    const payload = {
      estancia_id: prorrateo.esProrrateado ? 'TODAS' : estanciaFormId,
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

    if (transaccionAEditar?.id) {
      actualizarTransaccion(transaccionAEditar.id, payload);
      mostrarToast(
        'Transacción Actualizada',
        `Se modificó la transacción por ${moneda} ${valMonto.toLocaleString('es-UY')}`,
        'EXITO'
      );
    } else {
      agregarTransaccion(payload);
      mostrarToast(
        'Transacción Guardada',
        `Se registró el ${tipoFinanciero.toLowerCase()} por ${moneda} ${valMonto.toLocaleString('es-UY')}`,
        'EXITO'
      );
    }

    // Limpiar formulario y cerrar
    setMonto('');
    setDescripcionFinanciera('');
    setComprobanteUrl('');
    setComprobanteTipo(undefined);
    setNroFactura('');
    onClose();
  };

  // Retorno estructurado por submódulos legibles
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
  };
};
