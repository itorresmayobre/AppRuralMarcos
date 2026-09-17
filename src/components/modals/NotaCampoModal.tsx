import React, { useState } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useEstanciasStore } from '../../stores/useEstanciasStore';
import { useCampoNotasStore } from '../../stores/useCampoNotasStore';
import { useToastStore } from '../../stores/useToastStore';
import { hoyISO } from '../../utils/fechas';
import { X, FileText, Check, MapPin, Calendar, AlertTriangle } from 'lucide-react';

interface NotaCampoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotaCampoModal: React.FC<NotaCampoModalProps> = ({ isOpen, onClose }) => {
  const { usuario } = useAuthStore();
  const { estancias, obtenerEstanciaActual } = useEstanciasStore();
  const { agregarNotaCampo } = useCampoNotasStore();
  const { mostrarToast } = useToastStore();

  const estanciaActual = obtenerEstanciaActual();
  const [estanciaFormId, setEstanciaFormId] = useState<string>(
    estanciaActual?.id || (estancias[0]?.id ?? '')
  );
  const targetEstanciaId = estanciaFormId || estanciaActual?.id || estancias[0]?.id || '';

  const [tituloNota, setTituloNota] = useState<string>('');
  const [descripcionNota, setDescripcionNota] = useState<string>('');
  const [prioridadNota, setPrioridadNota] = useState<'ALTA' | 'MEDIA' | 'BAJA'>('MEDIA');
  const [fecha, setFecha] = useState<string>(hoyISO());

  const [guardando, setGuardando] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!estancias || estancias.length === 0 || !targetEstanciaId) {
      mostrarToast('Sin Campo Seleccionado', 'Debes crear primero al menos un establecimiento antes de registrar notas de campo.', 'ADVERTENCIA');
      return;
    }

    if (!tituloNota.trim()) {
      mostrarToast('Error de Nota', 'El título de la nota no puede estar vacío', 'ERROR');
      return;
    }

    setGuardando(true);

    const res = await agregarNotaCampo({
      estancia_id: targetEstanciaId,
      fecha,
      titulo: tituloNota.trim(),
      descripcion: descripcionNota.trim(),
      prioridad: prioridadNota,
      creado_por: usuario?.username || usuario?.nombre || 'operario',
    });

    setGuardando(false);

    if (!res.success) {
      mostrarToast('Error al Guardar Nota', res.error || 'No se pudo guardar la nota en la base de datos.', 'ERROR');
      return;
    }

    const nombreEstablecimiento = estancias.find(e => e.id === targetEstanciaId)?.nombre || 'Establecimiento';
    mostrarToast(
      'Nota de Campo Guardada',
      `📋 "${tituloNota}" registrada en ${nombreEstablecimiento}`,
      'EXITO'
    );

    setTituloNota('');
    setDescripcionNota('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Cabecera Exclusiva Nota de Campo */}
        <header className="bg-gradient-to-r from-purple-950 via-slate-900 to-purple-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-purple-800/50 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-purple-600/90 text-white rounded-2xl shadow-md border border-purple-400/30 flex-shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-1.5">
                <span>Registrar Nota de Campo</span>
              </h3>
              <p className="text-xs text-purple-200 mt-0.5 font-medium">
                Bitácora de observaciones, sanidad y mantenimientos
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Custom Selector de Establecimiento Destino */}
        {estancias.length === 0 ? (
          <div className="p-3 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <div>
              <p className="font-bold">No tienes establecimientos creados aún</p>
              <p className="text-[11px] text-amber-800">Primero debes agregar un campo o estancia en la sección <strong>Establecimientos</strong>.</p>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-slate-50 border-b border-slate-200/80 space-y-1.5 flex-shrink-0">
            <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">Establecimiento Destino:</label>
            <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
              {estancias.map((est) => {
                const esSeleccionado = targetEstanciaId === est.id;
                return (
                  <button
                    key={est.id}
                    type="button"
                    onClick={() => setEstanciaFormId(est.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition-all cursor-pointer flex-shrink-0 border ${
                      esSeleccionado
                        ? 'bg-purple-700 text-white border-purple-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{est.nombre}</span>
                    {esSeleccionado && <Check className="w-3.5 h-3.5 ml-1 text-purple-200 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Formulario Exclusivo de Nota de Campo */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          
          {/* Título de la Nota */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 block">Título del Registro / Alerta</label>
            <input
              type="text"
              required
              placeholder="ej: Reparación de alambrado potrero 3 o Vacunación aftosa"
              value={tituloNota}
              onChange={(e) => setTituloNota(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold rounded-xl p-3 focus:ring-2 focus:ring-purple-500 min-h-[44px]"
            />
          </div>

          {/* Nivel de Prioridad */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 block flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-purple-600" />
              <span>Nivel de Prioridad</span>
            </label>
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

          {/* Fecha */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 block flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span>Fecha del Registro</span>
            </label>
            <input
              type="date"
              required
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-purple-500 min-h-[42px]"
            />
          </div>

          {/* Detalle */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 block">Detalle de la Observación</label>
            <textarea
              rows={3}
              placeholder="Escribe aquí los detalles necesarios para el capataz o equipo de campo..."
              value={descripcionNota}
              onChange={(e) => setDescripcionNota(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-xl p-3 focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Botón de Enviar */}
          <button
            type="submit"
            disabled={estancias.length === 0 || guardando}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-xs py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 min-h-[46px] cursor-pointer mt-2"
          >
            <Check className="w-4 h-4 text-white" />
            <span>{guardando ? 'Guardando en Supabase...' : estancias.length === 0 ? 'Debes agregar un Campo primero' : 'Guardar Nota de Campo'}</span>
          </button>

        </form>
      </div>
    </div>
  );
};
