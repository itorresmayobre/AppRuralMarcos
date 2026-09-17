import React, { useState } from 'react';
import { Upload, FileText, Trash2, Eye, Loader2, Link as LinkIcon, CheckCircle2 } from 'lucide-react';
import { subirArchivoStorage } from '../../services/supabase';
import { useToastStore } from '../../stores/useToastStore';

interface FileUploadInputProps {
  label?: string;
  bucket: 'facturas-comprobantes' | 'recibos-sueldo' | 'fotos-campo';
  value: string;
  onChange: (url: string, fileType?: 'IMAGE' | 'PDF') => void;
  accept?: string;
  optional?: boolean;
}

export const FileUploadInput: React.FC<FileUploadInputProps> = ({
  label = 'Comprobante / Foto (Opcional)',
  bucket,
  value,
  onChange,
  accept = 'image/*,application/pdf',
  optional = true,
}) => {
  const [subiendo, setSubiendo] = useState(false);
  const [modoUrlManual, setModoUrlManual] = useState(false);
  const { mostrarToast } = useToastStore();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamaño máximo (10 MB)
    if (file.size > 10 * 1024 * 1024) {
      mostrarToast('Archivo muy grande', 'El archivo excede el límite máximo de 10 MB.', 'ERROR');
      return;
    }

    const esPdf = file.type.includes('pdf');
    const fileType: 'IMAGE' | 'PDF' = esPdf ? 'PDF' : 'IMAGE';
    const extension = file.name.split('.').pop() || (esPdf ? 'pdf' : 'jpg');
    const path = `${bucket}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${extension}`;

    setSubiendo(true);
    try {
      const url = await subirArchivoStorage(bucket, path, file);
      if (url) {
        onChange(url, fileType);
        mostrarToast('Comprobante Subido', 'El archivo se guardó correctamente en Supabase Storage.', 'EXITO');
      } else {
        mostrarToast('Error al Subir', 'No se pudo subir el archivo. Intenta de nuevo o ingresa una URL.', 'ERROR');
      }
    } catch (err: any) {
      console.error('Error en FileUploadInput:', err);
      mostrarToast('Error al Subir', err.message || 'Ocurrió un error inesperado al subir.', 'ERROR');
    } finally {
      setSubiendo(false);
    }
  };

  const handleLimpiar = () => {
    onChange('');
  };

  const esPdf = value.toLowerCase().includes('.pdf') || value.toLowerCase().includes('pdf');

  return (
    <div className="space-y-1.5 text-xs">
      <div className="flex items-center justify-between">
        <label className="font-extrabold text-slate-700 flex items-center gap-1.5">
          <Upload className="w-3.5 h-3.5 text-emerald-600" />
          <span>{label}</span>
          {optional && (
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
              Opcional
            </span>
          )}
        </label>

        <button
          type="button"
          onClick={() => setModoUrlManual(!modoUrlManual)}
          className="text-[10px] font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
        >
          <LinkIcon className="w-3 h-3" />
          <span>{modoUrlManual ? 'Subir archivo local' : 'Pegar URL manual'}</span>
        </button>
      </div>

      {modoUrlManual ? (
        <input
          type="url"
          placeholder="https://ejemplo.com/comprobante.pdf"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs font-mono rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 min-h-[40px]"
        />
      ) : subiendo ? (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-center space-x-2 text-emerald-800 font-bold animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
          <span>Subiendo archivo a Supabase Storage...</span>
        </div>
      ) : value ? (
        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2 overflow-hidden">
            {esPdf ? (
              <div className="p-1.5 bg-rose-100 text-rose-700 rounded-lg flex-shrink-0">
                <FileText className="w-4 h-4" />
              </div>
            ) : (
              <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0 bg-slate-200">
                <img src={value} alt="Vista previa" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="truncate">
              <p className="font-extrabold text-slate-800 text-[11px] truncate flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                <span>{esPdf ? 'Documento PDF adjunto' : 'Foto / Imagen adjunta'}</span>
              </p>
              <p className="text-[10px] text-slate-400 font-mono truncate">{value}</p>
            </div>
          </div>

          <div className="flex items-center space-x-1 flex-shrink-0">
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 transition-all"
              title="Ver archivo"
            >
              <Eye className="w-3.5 h-3.5" />
            </a>
            <button
              type="button"
              onClick={handleLimpiar}
              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
              title="Quitar archivo"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50/70 hover:bg-emerald-50/40 rounded-2xl cursor-pointer transition-all group">
          <div className="flex items-center space-x-2 text-slate-500 group-hover:text-emerald-700">
            <Upload className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
            <span className="font-bold text-xs">Seleccionar foto o PDF del dispositivo</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5">Formatos: JPG, PNG, WEBP, PDF (Máx. 10MB)</span>
          <input
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      )}
    </div>
  );
};
