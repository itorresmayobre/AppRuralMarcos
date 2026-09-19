import { useState } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { useUsuariosStore } from '../stores/useUsuariosStore';
import { useRecibosSueldoStore } from '../stores/useRecibosSueldoStore';
import { useEmpresasStore } from '../stores/useEmpresasStore';
import { useToastStore } from '../stores/useToastStore';
import { hoyISO } from '../utils/fechas';
import { calcularEjercicioYMesAgricola } from '../utils/periodoAgricola';

export const useReciboSueldoForm = (onClose: () => void) => {
  const { usuario } = useAuthStore();
  const { usuarios } = useUsuariosStore();
  const { agregarRecibo } = useRecibosSueldoStore();
  const { mostrarToast } = useToastStore();

  const [usuarioId, setUsuarioId] = useState<string>(usuarios[1]?.id || usuarios[0]?.id || '');
  const [periodoMes, setPeriodoMes] = useState<string>('Setiembre 2026');
  const [montoLiquido, setMontoLiquido] = useState<string>('38000');
  const [moneda, setMoneda] = useState<'UYU' | 'USD'>('UYU');
  const [fechaPago, setFechaPago] = useState<string>(hoyISO());
  const [reciboUrl, setReciboUrl] = useState<string>('');
  const [observaciones, setObservaciones] = useState<string>('');

  const { ejercicio: ejercicioAgricola } = calcularEjercicioYMesAgricola(fechaPago);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const valMonto = parseFloat(montoLiquido);

    if (isNaN(valMonto) || valMonto <= 0) {
      mostrarToast('Error de Validación', 'Ingresa un monto líquido de sueldo válido.', 'ERROR');
      return;
    }

    const empleadoObj = usuarios.find((u) => u.id === usuarioId);
    const nombreEmpleado = empleadoObj ? `${empleadoObj.nombre} ${empleadoObj.apellido}` : 'Empleado';

    agregarRecibo({
      empresa_id: usuario?.empresa_ids?.[0] || useEmpresasStore.getState().empresaSeleccionadaId,
      usuario_id: usuarioId,
      usuario_nombre: nombreEmpleado,
      periodo_mes: periodoMes,
      ejercicio_agricola: ejercicioAgricola,
      monto_liquido: valMonto,
      moneda,
      fecha_pago: fechaPago,
      recibo_url: reciboUrl,
      estado_firma: 'PENDIENTE',
      observaciones,
    });

    mostrarToast(
      'Recibo Registrado',
      `📄 Recibo de sueldo cargado para ${nombreEmpleado} (${moneda} ${valMonto.toLocaleString('es-UY')})`,
      'EXITO'
    );

    onClose();
  };

  return {
    usuarios,
    usuarioId,
    setUsuarioId,
    periodoMes,
    setPeriodoMes,
    montoLiquido,
    setMontoLiquido,
    moneda,
    setMoneda,
    fechaPago,
    setFechaPago,
    reciboUrl,
    setReciboUrl,
    observaciones,
    setObservaciones,
    handleSubmit,
  };
};
