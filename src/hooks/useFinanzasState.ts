import { useState } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { useEstanciasStore } from '../stores/useEstanciasStore';
import { useFinanzasStore } from '../stores/useFinanzasStore';

export const useFinanzasState = () => {
  const { usuario } = useAuthStore();
  const { estanciaSeleccionadaId } = useEstanciasStore();
  const { obtenerTransaccionesEstancia } = useFinanzasStore();

  const currentRole = usuario?.rol || 'OPERARIO';
  const canAccess = currentRole === 'ADMIN' || currentRole === 'CONTADOR' || currentRole === 'PROPIETARIO' || currentRole === 'SUPERADMIN';

  const [tabActiva, setTabActiva] = useState<'TRANSACCIONES' | 'CONFIGURACION'>('TRANSACCIONES');
  const [modalAbierto, setModalAbierto] = useState(false);

  const transacciones = obtenerTransaccionesEstancia(estanciaSeleccionadaId);

  return {
    currentRole,
    canAccess,
    tabActiva,
    setTabActiva,
    modalAbierto,
    setModalAbierto,
    transacciones,
  };
};
