import React, { useState } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useEstanciasStore } from '../../stores/useEstanciasStore';
import { useFinanzasStore } from '../../stores/useFinanzasStore';
import { useCampoNotasStore } from '../../stores/useCampoNotasStore';
import { useToastStore } from '../../stores/useToastStore';
import type { CategoriaFinanciera, Moneda, TipoTransaccion } from '../../types';
import {
  X,
  DollarSign,
  CloudDrizzle,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Check,
} from 'lucide-react';

interface AccionesRapidasModalProps {
  isOpen: boolean;
  onClose: () => void;
  tabInicial?: 'FINANZAS' | 'PLUVIOMETRO' | 'NOTA';
}

export const AccionesRapidasModal: React.FC<AccionesRapidasModalProps> = ({
  isOpen,
  onClose,
  tabInicial = 'FINANZAS',
}) => {
  const { usuario } = useAuthStore();
  const { estancias, estanciaSeleccionadaId, obtenerEstanciaActual } = useEstanciasStore();
  const { agregarTransaccion } = useFinanzasStore();
  const { agregarPluviometro, agregarNotaCampo } = useCampoNotasStore();
  const { mostrarToast } = useToastStore();

  const currentRole = usuario?.rol || 'OPERARIO';
  const puedeVerFinanzas = currentRole === 'ADMIN' || currentRole === 'CONTADOR';

  const [tabActiva, setTabActiva] = useState<'FINANZAS' | 'PLUVIOMETRO' | 'NOTA'>(
    !puedeVerFinanzas && tabInicial === 'FINANZAS' ? 'PLUVIOMETRO' : tabInicial
  );

  // Estancia objetivo (si está en TODAS, tomamos la primera disponible o pedimos elegir)
  const estanciaActual = obtenerEstanciaActual();
  const [estanciaFormId, setEstanciaFormId] = useState<string>(
    estanciaActual?.id || (estancias[0]?.id ?? 'est-1')
  );

  // 1. Formulario Finanzas
  const [tipoFinanciero, setTipoFinanciero] = useState<TipoTransaccion>('INGRESO');
  const [moneda, setMoneda] = useState<Moneda>('USD');
  const [monto, setMonto] = useState<string>('');
  const [categoria, setCategoria] = useState<CategoriaFinanciera>('VENTA_HACIENDA');
  const [descripcionFinanciera, setDescripcionFinanciera] = useState<string>('');

  // 2. Formulario Pluviómetro
  const [milimetros, setMilimetros] = useState<string>('');
  const [observacionPluviometro, setObservacionPluviometro] = useState<string>('');

  // 3. Formulario Nota de Campo
  const [tituloNota, setTituloNota] = useState<string>('');
  const [descripcionNota, setDescripcionNota] = useState<string>('');
  const [prioridadNota, setPrioridadNota] = useState<'ALTA' | 'MEDIA' | 'BAJA'>('MEDIA');

  if (!isOpen) return null;

  const handleSubmitFinanzas = (e: React.FormEvent) => {
    e.preventDefault();
    const valMonto = parseFloat(monto);
    if (isNaN(valMonto) || valMonto <= 0) {
      mostrarToast('Error de Validación', 'Por favor ingresa un monto válido mayor a 0', 'ERROR');
      return;
    }

    agregarTransaccion({
      estancia_id: estanciaFormId,
      tipo: tipoFinanciero,
      moneda,
      monto: valMonto,
      categoria,
      descripcion: descripcionFinanciera || `${tipoFinanciero === 'INGRESO' ? 'Ingreso' : 'Egreso'} rápido`,
      fecha: new Date().toISOString().split('T')[0],
    });

    mostrarToast('Transacción Registrada', `${tipoFinanciero} por ${moneda} ${valMonto.toLocaleString()}`, 'EXITO');
    onClose();
  };

  const handleSubmitPluviometro = (e: React.FormEvent) => {
    e.preventDefault();
    const valMm = parseFloat(milimetros);
    if (isNaN(valMm) || valMm < 0) {
      mostrarToast('Error de Pluviómetro', 'Por favor ingresa una cantidad válida de milímetros', 'ERROR');
      return;
    }

    agregarPluviometro({
      estancia_id: estanciaFormId,
      fecha: new Date().toISOString().split('T')[0],
      milimetros: valMm,
      observacion: observacionPluviometro,
      registrado_por: usuario?.username || 'usuario',
    });

    mostrarToast('Pluviómetro Guardado', `🌧️ ${valMm} mm guardados con éxito`, 'EXITO');
    onClose();
  };

  const handleSubmitNota = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tituloNota.trim()) {
      mostrarToast('Error de Nota', 'El título de la nota no puede estar vacío', 'ERROR');
      return;
    }

    agregarNotaCampo({
      estancia_id: estanciaFormId,
      fecha: new Date().toISOString().split('T')[0],
      titulo: tituloNota.trim(),
      descripcion: descripcionNota.trim(),
      prioridad: prioridadNota,
      creado_por: usuario?.username || 'usuario',
    });

    mostrarToast('Nota de Campo Guardada', `📋 "${tituloNota}" guardada correctamente`, 'EXITO');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">

        {/* Cabecera del Modal */}
        <header className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div>
            <h3 className="text-base font-extrabold flex items-center gap-2">
              <span>Acción Rápida de Campo</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Establecimiento: <strong className="text-emerald-400">{estancias.find(e => e.id === estanciaFormId)?.nombre || 'General'}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Selector de Estancia Objetivo */}
        <div className="px-5 pt-4 pb-2 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700">Establecimiento:</label>
          <select
            value={estanciaFormId}
            onChange={(e) => setEstanciaFormId(e.target.value)}
            className="bg-white border border-slate-300 text-slate-800 text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[36px]"
          >
            {estancias.map((est) => (
              <option key={est.id} value={est.id}>
                {est.nombre} ({est.departamento})
              </option>
            ))}
          </select>
        </div>

        {/* Pestañas de Navegación del Modal */}
        <div className="flex border-b border-slate-200 bg-white">
          {puedeVerFinanzas && (
            <button
              onClick={() => setTabActiva('FINANZAS')}
              className={`flex-1 py-3 px-3 text-xs font-extrabold flex items-center justify-center space-x-1.5 border-b-2 transition-all cursor-pointer ${tabActiva === 'FINANZAS'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Transacción</span>
            </button>
          )}

          <button
            onClick={() => setTabActiva('PLUVIOMETRO')}
            className={`flex-1 py-3 px-3 text-xs font-extrabold flex items-center justify-center space-x-1.5 border-b-2 transition-all cursor-pointer ${tabActiva === 'PLUVIOMETRO'
              ? 'border-blue-600 text-blue-700 bg-blue-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
          >
            <CloudDrizzle className="w-4 h-4" />
            <span>Pluviómetro</span>
          </button>

          <button
            onClick={() => setTabActiva('NOTA')}
            className={`flex-1 py-3 px-3 text-xs font-extrabold flex items-center justify-center space-x-1.5 border-b-2 transition-all cursor-pointer ${tabActiva === 'NOTA'
              ? 'border-purple-600 text-purple-700 bg-purple-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
          >
            <FileText className="w-4 h-4" />
            <span>Nota / Alerta</span>
          </button>
        </div>

        {/* Cuerpo del Modal según Pestaña */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">

          {/* TAB 1: FINANZAS */}
          {tabActiva === 'FINANZAS' && puedeVerFinanzas && (
            <form onSubmit={handleSubmitFinanzas} className="space-y-4">

              {/* Tipo: Ingreso / Egreso */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => { setTipoFinanciero('INGRESO'); setCategoria('VENTA_HACIENDA'); }}
                  className={`p-3 rounded-xl border font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${tipoFinanciero === 'INGRESO'
                    ? 'bg-emerald-100 border-emerald-500 text-emerald-900 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                >
                  <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                  <span>INGRESO</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setTipoFinanciero('EGRESO'); setCategoria('INSUMOS_VETERINARIOS'); }}
                  className={`p-3 rounded-xl border font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${tipoFinanciero === 'EGRESO'
                    ? 'bg-rose-100 border-rose-500 text-rose-900 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                >
                  <ArrowDownRight className="w-4 h-4 text-rose-600" />
                  <span>EGRESO</span>
                </button>
              </div>

              {/* Moneda y Monto */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Moneda</label>
                  <select
                    value={moneda}
                    onChange={(e) => setMoneda(e.target.value as Moneda)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs font-extrabold rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
                  >
                    <option value="USD">USD ($ US)</option>
                    <option value="UYU">UYU ($ UYU)</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Monto Total</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="ej: 14500"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
                  />
                </div>
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Categoría Rubro</label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value as CategoriaFinanciera)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
                >
                  {tipoFinanciero === 'INGRESO' ? (
                    <>
                      <option value="VENTA_HACIENDA">Venta de Hacienda (Ganado)</option>
                      <option value="HONORARIOS_SERVICIOS">Servicios / Pastoreo</option>
                      <option value="GASTOS_GENERALES">Otros Ingresos</option>
                    </>
                  ) : (
                    <>
                      <option value="INSUMOS_VETERINARIOS">Insumos Veterinarios & Sanidad</option>
                      <option value="RACION_SUPLEMENTOS">Ración & Suplementación</option>
                      <option value="COMBUSTIBLE">Combustible & Gasoil</option>
                      <option value="COMPRA_HACIENDA">Compra de Hacienda</option>
                      <option value="PASTURAS_AGRO">Agroquímicos & Semillas Pastura</option>
                      <option value="MANTENIMIENTO_ALAMBRES">Mantenimiento de Alambres & Agua</option>
                      <option value="ARRENDAMIENTO_CAMPO">Arrendamiento de Campo</option>
                    </>
                  )}
                </select>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descripción / Detalle</label>
                <input
                  type="text"
                  placeholder="ej: Compra 20 bolsas ración destete"
                  value={descripcionFinanciera}
                  onChange={(e) => setDescripcionFinanciera(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 min-h-[44px] cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Guardar Transacción Financiera</span>
              </button>

            </form>
          )}

          {/* TAB 2: PLUVIÓMETRO */}
          {tabActiva === 'PLUVIOMETRO' && (
            <form onSubmit={handleSubmitPluviometro} className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 flex items-center space-x-3">
                <CloudDrizzle className="w-6 h-6 text-blue-600 flex-shrink-0" />
                <p>
                  Registro diario de precipitaciones en el pluviómetro del establecimiento.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Milímetros Caídos (mm)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    required
                    placeholder="ej: 24"
                    value={milimetros}
                    onChange={(e) => setMilimetros(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm font-extrabold rounded-xl p-3 pr-12 focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-500">mm</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Observación del Terreno / Pastura</label>
                <textarea
                  rows={3}
                  placeholder="ej: Lluvia mansa y pareja, recargó tajamares del potrero 2."
                  value={observacionPluviometro}
                  onChange={(e) => setObservacionPluviometro(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-xl p-3 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 min-h-[44px] cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Registrar Pluviómetro (mm)</span>
              </button>
            </form>
          )}

          {/* TAB 3: NOTA DE CAMPO */}
          {tabActiva === 'NOTA' && (
            <form onSubmit={handleSubmitNota} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Título del Registro / Alerta</label>
                <input
                  type="text"
                  required
                  placeholder="ej: Reparación de alambrado o Vacunación"
                  value={tituloNota}
                  onChange={(e) => setTituloNota(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold rounded-xl p-3 focus:ring-2 focus:ring-purple-500 min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Prioridad</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['BAJA', 'MEDIA', 'ALTA'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPrioridadNota(p)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${prioridadNota === p
                        ? p === 'ALTA'
                          ? 'bg-rose-100 border-rose-500 text-rose-900'
                          : p === 'MEDIA'
                            ? 'bg-amber-100 border-amber-500 text-amber-900'
                            : 'bg-slate-200 border-slate-400 text-slate-900'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Detalle de la Observación</label>
                <textarea
                  rows={3}
                  placeholder="Escribe aquí los detalles para el capataz o equipo..."
                  value={descripcionNota}
                  onChange={(e) => setDescripcionNota(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-xl p-3 focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 min-h-[44px] cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Guardar Nota de Campo</span>
              </button>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
