import React from 'react';
import { useTrasladoGanadoForm } from '../../hooks/ganado/useTrasladoGanadoForm';
import { CustomSelect } from '../ui/CustomSelect';
import {
  X,
  Truck,
  Check,
  MapPin,
  Calendar,
  Tag,
  Info,
  AlertTriangle
} from 'lucide-react';

interface TrasladoGanadoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TrasladoGanadoModal: React.FC<TrasladoGanadoModalProps> = ({ isOpen, onClose }) => {
  const form = useTrasladoGanadoForm(onClose);

  if (!isOpen) return null;

  return (
    <section aria-label="Modal Traslado de Ganado entre Campos" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <article className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Cabecera Modal */}
        <header className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-2xl text-white shadow-md">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Traslado de Ganado entre Campos</h3>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                Movimiento físico de stock e imputación de valor económico
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

        {/* Alerta si no existen al menos 2 estancias */}
        {form.estancias.length < 2 && (
          <div className="p-3 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex items-center gap-2 flex-shrink-0">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <div>
              <p className="font-bold">Se necesitan al menos 2 establecimientos</p>
              <p className="text-[11px] text-amber-800">Para realizar traslados de ganado entre campos debes registrar al menos 2 campos o estancias.</p>
            </div>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={form.handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          
          {/* Origen y Destino */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
            <div>
              <CustomSelect
                label="Origen (Sale):"
                value={form.ubicacion.origenId}
                options={form.ubicacion.origenOptions}
                onChange={(val) => form.ubicacion.setOrigenId(val)}
                icon={<MapPin className="w-3.5 h-3.5 text-rose-600" />}
              />
            </div>

            <div>
              <CustomSelect
                label="Destino (Entra):"
                value={form.ubicacion.destinoId}
                options={form.ubicacion.destinoOptions}
                onChange={(val) => form.ubicacion.setDestinoId(val)}
                icon={<MapPin className="w-3.5 h-3.5 text-emerald-600" />}
              />
            </div>
          </div>

          {/* Especie y Categoría */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-extrabold text-slate-700 block text-xs">Especie</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    form.hacienda.setEspecie('VACUNO');
                    form.hacienda.setCategoria('TERNEROS');
                  }}
                  className={`p-2.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer min-h-[42px] ${
                    form.hacienda.especie === 'VACUNO' ? 'bg-emerald-900 text-white border-emerald-700 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  🐮 Vacunos
                </button>
                <button
                  type="button"
                  onClick={() => {
                    form.hacienda.setEspecie('OVINO');
                    form.hacienda.setCategoria('OVEJAS_CRIA');
                  }}
                  className={`p-2.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer min-h-[42px] ${
                    form.hacienda.especie === 'OVINO' ? 'bg-amber-900 text-white border-amber-700 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  🐑 Ovinos
                </button>
              </div>
            </div>

            <div>
              <CustomSelect
                label="Categoría:"
                value={form.hacienda.categoria}
                options={form.hacienda.categoriaOptions}
                onChange={(val) => form.hacienda.setCategoria(val)}
              />
            </div>
          </div>

          {/* Cabezas y Kilos */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="cabezas-input" className="font-extrabold text-slate-700 block text-xs">Cantidad de Cabezas</label>
              <input
                id="cabezas-input"
                type="number"
                required
                min="1"
                value={form.hacienda.cabezas}
                onChange={(e) => form.hacienda.setCabezas(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs sm:text-sm font-black rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 min-h-[42px]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="kilos-promedio-input" className="font-extrabold text-slate-700 block text-xs">Kilos Promedio (kg/cab)</label>
              <input
                id="kilos-promedio-input"
                type="number"
                step="0.1"
                placeholder="ej: 160"
                value={form.hacienda.kilosPromedio}
                onChange={(e) => form.hacienda.setKilosPromedio(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs sm:text-sm font-black rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 min-h-[42px]"
              />
            </div>
          </div>

          {/* Bloque de Imputación Económica Interna */}
          <div className="space-y-2.5 bg-emerald-50/70 border border-emerald-200/90 p-3.5 rounded-2xl">
            <label className="flex items-center space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={form.imputacion.valorizar}
                onChange={(e) => form.imputacion.setValorizar(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
              />
              <span className="font-extrabold text-emerald-950 text-xs flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Imputar Valor Económico Interno (Rentabilidad por Campo)</span>
              </span>
            </label>

            {form.imputacion.valorizar && (
              <div className="space-y-2.5 pt-2 border-t border-emerald-200">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label htmlFor="precio-cabeza-input" className="font-bold text-emerald-900 block text-[11px]">Precio / Cabeza (USD)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-emerald-700 text-xs">$ US</span>
                      <input
                        id="precio-cabeza-input"
                        type="number"
                        step="0.01"
                        required={form.imputacion.valorizar}
                        value={form.imputacion.precioCabeza}
                        onChange={(e) => form.imputacion.setPrecioCabeza(e.target.value)}
                        className="w-full bg-white border border-emerald-300 text-emerald-950 font-black text-xs rounded-xl pl-12 pr-3 py-2 focus:ring-2 focus:ring-emerald-500 min-h-[40px]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-emerald-900 block text-[11px]">Monto Imputado Total</label>
                    <output className="p-2 bg-emerald-900 text-emerald-100 rounded-xl text-xs font-black flex items-center justify-between min-h-[40px] block">
                      <span>Total:</span>
                      <span className="text-xs sm:text-sm text-white">USD {form.imputacion.totalImputado.toLocaleString('es-UY')}</span>
                    </output>
                  </div>
                </div>

                <div className="flex items-start space-x-2 text-[10px] text-emerald-800 bg-white/80 p-2.5 rounded-xl border border-emerald-200">
                  <Info className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <p>
                    Se acreditará <strong>+USD {form.imputacion.totalImputado.toLocaleString()}</strong> a la estancia origen y se debitará a la destino. A nivel empresa el neto es USD 0.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Fecha y Observaciones */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="fecha-traslado-input" className="font-bold text-slate-700 flex items-center gap-1.5 text-xs">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span>Fecha del Traslado</span>
              </label>
              <input
                id="fecha-traslado-input"
                type="date"
                required
                value={form.detalle.fecha}
                onChange={(e) => form.detalle.setFecha(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 min-h-[42px]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="obs-traslado-input" className="font-bold text-slate-700 block text-xs">Observaciones / Detalle</label>
              <input
                id="obs-traslado-input"
                type="text"
                placeholder="ej: Destete de otoño, remesa 1"
                value={form.detalle.observaciones}
                onChange={(e) => form.detalle.setObservaciones(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 min-h-[42px]"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={form.estancias.length < 2}
            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-xs py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 min-h-[46px] cursor-pointer mt-2"
          >
            <Check className="w-4 h-4 text-white" />
            <span>
              {form.estancias.length < 2
                ? 'Se necesitan al menos 2 Campos para trasladar'
                : 'Guardar Traslado y Actualizar Stocks'}
            </span>
          </button>

        </form>
      </article>
    </section>
  );
};
