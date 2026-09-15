import React from 'react';
import { useReciboSueldoForm } from '../../hooks/useReciboSueldoForm';
import { CustomSelect } from '../ui/CustomSelect';
import { X, FileText, Check, Calendar, DollarSign, Upload, User } from 'lucide-react';

interface ReciboSueldoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReciboSueldoModal: React.FC<ReciboSueldoModalProps> = ({ isOpen, onClose }) => {
  const form = useReciboSueldoForm(onClose);

  if (!isOpen) return null;

  const usuarioOptions = form.usuarios.map((u) => ({
    value: u.id,
    label: `${u.nombre} ${u.apellido} (${u.rol})`,
  }));

  return (
    <section aria-label="Modal Registrar Recibo de Sueldo" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <article className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Cabecera */}
        <header className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-600 rounded-2xl text-white shadow-md flex-shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Registrar Recibo de Sueldo</h3>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                Emisión de haberes y adjunto de comprobante firmado
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

        {/* Formulario */}
        <form onSubmit={form.handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          
          {/* Seleccionar Empleado */}
          <fieldset className="space-y-1.5 border-0 p-0 m-0">
            <CustomSelect
              label="Empleado Destinatario:"
              value={form.usuarioId}
              options={usuarioOptions}
              onChange={(val) => form.setUsuarioId(val)}
              icon={<User className="w-3.5 h-3.5 text-emerald-600" />}
            />
          </fieldset>

          {/* Período de Liquidación */}
          <fieldset className="grid grid-cols-2 gap-3 border-0 p-0 m-0">
            <div className="space-y-1">
              <label htmlFor="periodo-mes" className="font-bold text-slate-700 block">Período / Mes</label>
              <input
                id="periodo-mes"
                type="text"
                required
                placeholder="ej: Setiembre 2026"
                value={form.periodoMes}
                onChange={(e) => form.setPeriodoMes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 min-h-[42px]"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="fecha-pago" className="font-bold text-slate-700 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Fecha de Pago</span>
              </label>
              <input
                id="fecha-pago"
                type="date"
                required
                value={form.fechaPago}
                onChange={(e) => form.setFechaPago(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 min-h-[42px]"
              />
            </div>
          </fieldset>

          {/* Monto Líquido */}
          <fieldset className="space-y-1 border-0 p-0 m-0">
            <label htmlFor="monto-liquido" className="font-bold text-slate-700 block flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span>Monto Líquido a Cobrar ({form.moneda})</span>
            </label>
            <input
              id="monto-liquido"
              type="number"
              step="0.01"
              required
              placeholder="ej: 38000"
              value={form.montoLiquido}
              onChange={(e) => form.setMontoLiquido(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm font-black rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
            />
          </fieldset>

          {/* Adjuntar Archivo / Foto del Recibo */}
          <fieldset className="space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-200/80 m-0">
            <label htmlFor="recibo-url" className="font-bold text-slate-700 block flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-emerald-600" />
              <span>URL / Archivo de Recibo Firmado</span>
            </label>
            <input
              id="recibo-url"
              type="text"
              required
              placeholder="URL del PDF o Foto en Storage"
              value={form.reciboUrl}
              onChange={(e) => form.setReciboUrl(e.target.value)}
              className="w-full bg-white border border-slate-300 text-slate-900 text-xs font-mono rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 min-h-[40px]"
            />
          </fieldset>

          {/* Observaciones */}
          <fieldset className="space-y-1 border-0 p-0 m-0">
            <label htmlFor="obs-recibo" className="font-bold text-slate-700 block">Observaciones / Detalle</label>
            <input
              id="obs-recibo"
              type="text"
              placeholder="ej: Pago realizado vía transferencia BROU"
              value={form.observaciones}
              onChange={(e) => form.setObservaciones(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 min-h-[40px]"
            />
          </fieldset>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 min-h-[46px] cursor-pointer mt-2"
          >
            <Check className="w-4 h-4 text-white" />
            <span>Guardar Recibo de Sueldo</span>
          </button>

        </form>
      </article>
    </section>
  );
};
