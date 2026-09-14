import React, { useState } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useEstanciasStore } from '../../stores/useEstanciasStore';
import { useCampoNotasStore } from '../../stores/useCampoNotasStore';
import { useToastStore } from '../../stores/useToastStore';
import { X, CloudDrizzle, Check, MapPin, Calendar, Droplets } from 'lucide-react';

interface PluviometroModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PluviometroModal: React.FC<PluviometroModalProps> = ({ isOpen, onClose }) => {
  const { usuario } = useAuthStore();
  const { estancias, obtenerEstanciaActual } = useEstanciasStore();
  const { agregarPluviometro } = useCampoNotasStore();
  const { mostrarToast } = useToastStore();

  const estanciaActual = obtenerEstanciaActual();
  const [estanciaFormId, setEstanciaFormId] = useState<string>(
    estanciaActual?.id || (estancias[0]?.id ?? 'est-1')
  );

  const [milimetros, setMilimetros] = useState<string>('');
  const [fecha, setFecha] = useState<string>(new Date().toISOString().split('T')[0]);
  const [observacion, setObservacion] = useState<string>('');

  if (!isOpen) return null;

  const handlePresetMm = (val: number) => {
    setMilimetros(val.toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const valMm = parseFloat(milimetros);

    if (isNaN(valMm) || valMm < 0) {
      mostrarToast('Error de Pluviómetro', 'Por favor ingresa una cantidad válida de milímetros', 'ERROR');
      return;
    }

    agregarPluviometro({
      estancia_id: estanciaFormId,
      fecha,
      milimetros: valMm,
      observacion,
      registrado_por: usuario?.username || usuario?.nombre || 'operario',
    });

    const nombreEstablecimiento = estancias.find(e => e.id === estanciaFormId)?.nombre || 'Establecimiento';
    mostrarToast(
      'Pluviómetro Registrado',
      `🌧️ ${valMm} mm guardados en ${nombreEstablecimiento}`,
      'EXITO'
    );

    // Resetear form y cerrar
    setMilimetros('');
    setObservacion('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Cabecera Exclusiva Pluviómetro */}
        <header className="bg-gradient-to-r from-blue-950 via-slate-900 to-blue-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-blue-800/50 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-600/90 text-white rounded-2xl shadow-md border border-blue-400/30 flex-shrink-0">
              <CloudDrizzle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-1.5">
                <span>Registrar Lluvia (Pluviómetro)</span>
              </h3>
              <p className="text-xs text-blue-200 mt-0.5 font-medium">
                Medición diaria de precipitaciones caídas (mm)
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
                      ? 'bg-blue-700 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{est.nombre}</span>
                  {esSeleccionado && <Check className="w-3.5 h-3.5 ml-1 text-blue-200 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Formulario Exclusivo de Pluviómetro */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          
          {/* Milímetros Caídos */}
          <div className="space-y-1.5">
            <label className="font-extrabold text-slate-700 block flex items-center gap-1.5">
              <Droplets className="w-4 h-4 text-blue-600" />
              <span>Milímetros Caídos (mm)</span>
            </label>
            
            <div className="relative">
              <input
                type="number"
                step="0.5"
                min="0"
                required
                placeholder="ej: 25"
                value={milimetros}
                onChange={(e) => setMilimetros(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-base font-black rounded-xl p-3 pr-14 focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[46px]"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-500 bg-slate-200 px-2 py-0.5 rounded-md">mm</span>
            </div>

            {/* Presets de Milímetros Rápido en Móvil */}
            <div className="flex items-center space-x-1.5 pt-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Atajos:</span>
              {[5, 10, 20, 35, 50].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handlePresetMm(val)}
                  className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 text-[11px] font-bold transition-all cursor-pointer"
                >
                  +{val} mm
                </button>
              ))}
            </div>
          </div>

          {/* Fecha de la Medición */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 block flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span>Fecha de la Lluvia</span>
            </label>
            <input
              type="date"
              required
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 min-h-[42px]"
            />
          </div>

          {/* Observaciones del Terreno */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 block">Observaciones del Terreno / Tajamares</label>
            <textarea
              rows={3}
              placeholder="ej: Lluvia mansa y pareja. Recargó tajamares del potrero 4 y sin correntadas fuertes."
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Botón de Enviar */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 min-h-[46px] cursor-pointer mt-2"
          >
            <Check className="w-4 h-4 text-white" />
            <span>Guardar Registro de Lluvia (mm)</span>
          </button>

        </form>
      </div>
    </div>
  );
};
