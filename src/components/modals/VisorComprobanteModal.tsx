import React from 'react';
import { X, ExternalLink, Download, FileText, Image as ImageIcon } from 'lucide-react';

interface VisorComprobanteModalProps {
  isOpen: boolean;
  url: string | null;
  titulo?: string;
  onClose: () => void;
}

export const VisorComprobanteModal: React.FC<VisorComprobanteModalProps> = ({
  isOpen,
  url,
  titulo = 'Comprobante / Documento Adjunto',
  onClose,
}) => {
  if (!isOpen || !url) return null;

  const esPdf = url.toLowerCase().includes('.pdf') || url.toLowerCase().includes('pdf');

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 border border-slate-800 text-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Visor */}
        <header className="p-3.5 sm:p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl flex-shrink-0">
              {esPdf ? <FileText className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
            </div>
            <div className="truncate">
              <h3 className="text-sm font-bold text-slate-100 truncate">{titulo}</h3>
              <p className="text-[11px] text-slate-400 font-mono truncate">{esPdf ? 'Documento PDF' : 'Imagen de Comprobante'}</p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 flex-shrink-0">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1 text-xs font-bold"
              title="Abrir en nueva pestaña"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Pestaña Externa</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-600/30 text-slate-300 hover:text-rose-400 transition-all cursor-pointer"
              title="Cerrar visor"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Visor de Contenido (Imagen / PDF) */}
        <main className="flex-1 p-3 sm:p-5 overflow-auto flex items-center justify-center bg-slate-950/60 min-h-[300px]">
          {esPdf ? (
            <div className="w-full h-full min-h-[60vh] flex flex-col items-center justify-center space-y-3">
              <iframe
                src={url}
                title="Vista previa del PDF"
                className="w-full flex-1 min-h-[55vh] rounded-2xl border border-slate-800 bg-white"
              />
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-400 hover:underline"
              >
                <Download className="w-4 h-4" />
                <span>Descargar / Ver PDF completo</span>
              </a>
            </div>
          ) : (
            <div className="relative flex items-center justify-center max-w-full max-h-full">
              <img
                src={url}
                alt="Comprobante adjunto"
                className="max-h-[75vh] max-w-full object-contain rounded-2xl shadow-2xl border border-slate-800/80"
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
