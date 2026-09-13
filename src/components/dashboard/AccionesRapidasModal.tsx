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
  MapPin
} from 'lucide-react';

interface AccionesRapidasModalProps {
  isOpen: boolean;
  onClose: () => void;
  tabInicial?: 'FINANZAS' | 'PLUVIOMETRO' | 'NOTA';
}

const CATEGORIAS_INFO: Record<CategoriaFinanciera, { label: string; icono: string }> = {
  VENTA_HACIENDA: { label: 'Venta Hacienda', icono: '🐮' },
  COMPRA_HACIENDA: { label: 'Compra Hacienda', icono: '🐂' },
  INSUMOS_VETERINARIOS: { label: 'Sanidad & Veterinaria', icono: '💊' },
  RACION_SUPLEMENTOS: { label: 'Ración & Suplemento', icono: '🌾' },
  COMBUSTIBLE: { label: 'Gasoil & Combustible', icono: '🚜' },
  PASTURAS_AGRO: { label: 'Semillas & Agroquímicos', icono: '🌱' },
  MANTENIMIENTO_ALAMBRES: { label: 'Alambres & Agua', icono: '🛠️' },
  ARRENDAMIENTO_CAMPO: { label: 'Arrendamiento Campo', icono: '🏡' },
  HONORARIOS_SERVICIOS: { label: 'Servicios / Pastoreo', icono: '🤝' },
  GASTOS_GENERALES: { label: 'Gastos Generales', icono: '📋' },
};

export const AccionesRapidasModal: React.FC<AccionesRapidasModalProps> = ({
  isOpen,
  onClose,
  tabInicial = 'FINANZAS',
}) => {
  const { usuario } = useAuthStore();
  const { estancias, obtenerEstanciaActual } = useEstanciasStore();
  const { agregarTransaccion } = useFinanzasStore();
  const { agregarPluviometro, agregarNotaCampo } = useCampoNotasStore();
  const { mostrarToast } = useToastStore();

  const currentRole = usuario?.rol || 'OPERARIO';
  const puedeVerFinanzas = currentRole === 'ADMIN' || currentRole === 'CONTADOR';

  const [tabActiva, setTabActiva] = useState<'FINANZAS' | 'PLUVIOMETRO' | 'NOTA'>(
    !puedeVerFinanzas && tabInicial === 'FINANZAS' ? 'PLUVIOMETRO' : tabInicial
  );

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

  const categoriasDisponibles: CategoriaFinanciera[] = tipoFinanciero === 'INGRESO' 
    ? ['VENTA_HACIENDA', 'HONORARIOS_SERVICIOS', 'GASTOS_GENERALES']
    : ['INSUMOS_VETERINARIOS', 'RACION_SUPLEMENTOS', 'COMBUSTIBLE', 'COMPRA_HACIENDA', 'PASTURAS_AGRO', 'MANTENIMIENTO_ALAMBRES', 'ARRENDAMIENTO_CAMPO'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">

        {/* Cabecera del Modal */}
        <header className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800 flex-shrink-0">
          <div>
            <h3 className="text-base font-extrabold flex items-center gap-2">
              <span>Acción Rápida de Campo</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Predio: <strong className="text-emerald-400">{estancias.find(e => e.id === estanciaFormId)?.nombre || 'General'}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Custom Selector de Estancia Objetivo (Pills en lugar de select nativo) */}
        <div className="p-3 bg-slate-50 border-b border-slate-200/80 space-y-1.5 flex-shrink-0">
          <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">Establecimiento Destino:</label>
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
            {estancias.map((est) => {
              const esSeleccionado = estanciaFormId === est.id;
              return (
                <button
                  key={est.id}
                  type="button"
                  onClick={() => setEstanciaFormId(est.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition-all cursor-pointer flex-shrink-0 border ${
                    esSeleccionado
                      ? 'bg-emerald-700 text-white border-emerald-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{est.nombre}</span>
                  {esSeleccionado && <Check className="w-3.5 h-3.5 ml-1 text-emerald-200 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Pestañas de Navegación del Modal */}
        <div className="flex border-b border-slate-200 bg-white flex-shrink-0">
          {puedeVerFinanzas && (
            <button
              onClick={() => setTabActiva('FINANZAS')}
              className={`flex-1 py-3 px-3 text-xs font-extrabold flex items-center justify-center space-x-1.5 border-b-2 transition-all cursor-pointer ${
                tabActiva === 'FINANZAS'
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
            className={`flex-1 py-3 px-3 text-xs font-extrabold flex items-center justify-center space-x-1.5 border-b-2 transition-all cursor-pointer ${
              tabActiva === 'PLUVIOMETRO'
                ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CloudDrizzle className="w-4 h-4" />
            <span>Pluviómetro</span>
          </button>

          <button
            onClick={() => setTabActiva('NOTA')}
            className={`flex-1 py-3 px-3 text-xs font-extrabold flex items-center justify-center space-x-1.5 border-b-2 transition-all cursor-pointer ${
              tabActiva === 'NOTA'
                ? 'border-purple-600 text-purple-700 bg-purple-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Nota / Alerta</span>
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">

          {/* TAB 1: FINANZAS */}
          {tabActiva === 'FINANZAS' && puedeVerFinanzas && (
            <form onSubmit={handleSubmitFinanzas} className="space-y-4">

              {/* Tipo: Ingreso / Egreso */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => { setTipoFinanciero('INGRESO'); setCategoria('VENTA_HACIENDA'); }}
                  className={`p-3 rounded-2xl border font-extrabold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                    tipoFinanciero === 'INGRESO'
                      ? 'bg-emerald-100 border-emerald-500 text-emerald-950 shadow-sm ring-1 ring-emerald-500/50'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                  <span>INGRESO</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setTipoFinanciero('EGRESO'); setCategoria('INSUMOS_VETERINARIOS'); }}
                  className={`p-3 rounded-2xl border font-extrabold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                    tipoFinanciero === 'EGRESO'
                      ? 'bg-rose-100 border-rose-500 text-rose-950 shadow-sm ring-1 ring-rose-500/50'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <ArrowDownRight className="w-4 h-4 text-rose-600" />
                  <span>EGRESO</span>
                </button>
              </div>

              {/* Custom Moneda Selector (Chips táctiles en vez de select nativo) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Moneda de la Operación</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMoneda('USD')}
                    className={`p-2.5 rounded-xl border text-xs font-black flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                      moneda === 'USD'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-700 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>💵 Dólares (USD)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMoneda('UYU')}
                    className={`p-2.5 rounded-xl border text-xs font-black flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                      moneda === 'UYU'
                        ? 'bg-blue-950 text-blue-300 border-blue-700 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>🇺🇾 Pesos (UYU)</span>
                  </button>
                </div>
              </div>

              {/* Monto Total */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Monto Total ({moneda})</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-500">
                    {moneda === 'USD' ? '$ US' : '$ UYU'}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="ej: 14500"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm font-black rounded-xl pl-16 pr-4 py-3 focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
                  />
                </div>
              </div>

              {/* Custom Selector de Categoría Rubro (Chips interactivos sin select nativo) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Rubro / Categoría Financiera</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto custom-scrollbar p-1 border border-slate-200 rounded-2xl bg-slate-50/50">
                  {categoriasDisponibles.map((catKey) => {
                    const info = CATEGORIAS_INFO[catKey];
                    const esSeleccionada = categoria === catKey;
                    return (
                      <button
                        key={catKey}
                        type="button"
                        onClick={() => setCategoria(catKey)}
                        className={`p-2 rounded-xl text-left text-[11px] font-bold border transition-all flex items-center space-x-1.5 cursor-pointer ${
                          esSeleccionada
                            ? 'bg-emerald-800 text-white border-emerald-600 shadow-sm ring-1 ring-emerald-500/50'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span className="text-sm">{info.icono}</span>
                        <span className="truncate">{info.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descripción / Detalle de la Operación</label>
                <input
                  type="text"
                  placeholder="ej: Venta novillos remate o compra ración destete"
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

              {/* Custom Selector de Prioridad (Chips táctiles en vez de select) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nivel de Nivel / Prioridad</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['BAJA', 'MEDIA', 'ALTA'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPrioridadNota(p)}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                        prioridadNota === p
                          ? p === 'ALTA'
                            ? 'bg-rose-950 text-rose-200 border-rose-700 shadow-sm ring-1 ring-rose-500'
                            : p === 'MEDIA'
                            ? 'bg-amber-950 text-amber-200 border-amber-700 shadow-sm ring-1 ring-amber-500'
                            : 'bg-slate-900 text-slate-200 border-slate-700 shadow-sm ring-1 ring-slate-400'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {p === 'ALTA' ? '🔴 ALTA' : p === 'MEDIA' ? '🟡 MEDIA' : '🟢 BAJA'}
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
