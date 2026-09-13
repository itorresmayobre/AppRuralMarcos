import React from 'react';
import { useToastStore } from '../../stores/useToastStore';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export const ToastNotification: React.FC = () => {
  const { toasts, eliminarToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const esExito = toast.tipo === 'EXITO';
        const esError = toast.tipo === 'ERROR';
        const esAdvertencia = toast.tipo === 'ADVERTENCIA';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-2xl border shadow-2xl flex items-start space-x-3 transition-all duration-200 animate-in slide-in-from-bottom-5 ${
              esExito
                ? 'bg-slate-900/95 border-emerald-500/80 text-white shadow-emerald-950/40'
                : esError
                ? 'bg-slate-900/95 border-rose-500/80 text-white shadow-rose-950/40'
                : esAdvertencia
                ? 'bg-slate-900/95 border-amber-500/80 text-white shadow-amber-950/40'
                : 'bg-slate-900/95 border-blue-500/80 text-white shadow-blue-950/40'
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {esExito && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {esError && <XCircle className="w-5 h-5 text-rose-400" />}
              {esAdvertencia && <AlertTriangle className="w-5 h-5 text-amber-400" />}
              {!esExito && !esError && !esAdvertencia && <Info className="w-5 h-5 text-blue-400" />}
            </div>

            <div className="flex-1 text-xs space-y-0.5">
              <h4 className="font-extrabold text-white text-xs">{toast.titulo}</h4>
              {toast.descripcion && (
                <p className="text-[11px] text-slate-300 leading-normal">{toast.descripcion}</p>
              )}
            </div>

            <button
              onClick={() => eliminarToast(toast.id)}
              className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors flex-shrink-0"
              aria-label="Cerrar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
