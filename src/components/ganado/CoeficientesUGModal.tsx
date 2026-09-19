import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Scale, RefreshCw, CheckCircle2, Loader2, Info, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useEmpresasStore } from '../../stores/useEmpresasStore';
import { supabase } from '../../services/supabase';
import type { FilaComparativaUG } from '../../pages/ParametrosPage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const CoeficientesUGModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { usuario } = useAuthStore();
  const { obtenerEmpresaActual } = useEmpresasStore();
  const empresaActual = obtenerEmpresaActual();
  const esAdmin = usuario?.rol === 'ADMIN' || usuario?.rol === 'PROPIETARIO' || usuario?.rol === 'SUPERADMIN';

  const [filas, setFilas] = useState<FilaComparativaUG[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [errorBD, setErrorBD] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      cargarCoeficientesDesdeBD();
    }
  }, [isOpen, empresaActual?.id]);

  const cargarCoeficientesDesdeBD = async () => {
    setCargando(true);
    setMensajeExito(null);
    setErrorBD(null);

    try {
      const { data, error } = await supabase
        .from('configuracion_equivalencias_ug')
        .select('*');

      if (error) {
        setErrorBD(`Error al consultar Supabase: ${error.message}`);
        setCargando(false);
        return;
      }

      if (!data || data.length === 0) {
        setErrorBD('No se encontraron registros de coeficientes en Supabase.');
        setCargando(false);
        return;
      }

      const empresaId = empresaActual?.id;
      const registrosInia = data.filter((d) => !d.empresa_id);
      const registrosEmpresa = empresaId
        ? data.filter((d) => d.empresa_id === empresaId)
        : [];

      const filasProcesadas: FilaComparativaUG[] = registrosInia.map((iniaItem) => {
        const customEmpresa = registrosEmpresa.find(
          (e) => e.especie === iniaItem.especie && e.categoria === iniaItem.categoria
        );

        const valInia = Number(iniaItem.coeficiente_ug);
        const valEmp = customEmpresa ? Number(customEmpresa.coeficiente_ug) : valInia;
        const estaEditado = customEmpresa !== undefined && customEmpresa.coeficiente_ug !== iniaItem.coeficiente_ug;

        return {
          especie: iniaItem.especie,
          categoria: iniaItem.categoria,
          descripcion: iniaItem.descripcion || 'Referencia estándar INIA / Plan Agropecuario',
          valorInia: valInia,
          valorEmpresa: valEmp,
          editado: estaEditado,
        };
      });

      setFilas(filasProcesadas);
    } catch (err: any) {
      console.error('Error cargando coeficientes de PostgreSQL:', err);
      setErrorBD('Error inesperado al conectar con Supabase.');
    } finally {
      setCargando(false);
    }
  };

  const handleCambioValorEmpresa = (index: number, nuevoValor: number) => {
    const val = Math.max(0.01, Number(nuevoValor));
    setFilas((prev) => {
      const copia = [...prev];
      const item = copia[index];
      copia[index] = {
        ...item,
        valorEmpresa: val,
        editado: val !== item.valorInia,
      };
      return copia;
    });
  };

  const handleRestablecerINIA = async () => {
    if (!esAdmin || !empresaActual?.id) return;
    setGuardando(true);
    setMensajeExito(null);

    try {
      const { error } = await supabase
        .from('configuracion_equivalencias_ug')
        .delete()
        .eq('empresa_id', empresaActual.id);

      if (error) {
        setErrorBD(`Error al restablecer en Supabase: ${error.message}`);
      } else {
        setMensajeExito('Valores restablecidos a las constantes oficiales del INIA / Plan Agropecuario.');
        await cargarCoeficientesDesdeBD();
      }
    } catch (err: any) {
      setErrorBD(err?.message || 'Error al restablecer valores.');
    } finally {
      setGuardando(false);
    }
  };

  const handleGuardarCambios = async () => {
    if (!esAdmin || !empresaActual?.id) return;
    setGuardando(true);
    setMensajeExito(null);
    setErrorBD(null);

    try {
      const personalizados = filas.filter((f) => f.editado);

      await supabase
        .from('configuracion_equivalencias_ug')
        .delete()
        .eq('empresa_id', empresaActual.id);

      if (personalizados.length > 0) {
        const payload = personalizados.map((f) => ({
          empresa_id: empresaActual.id,
          especie: f.especie,
          categoria: f.categoria,
          coeficiente_ug: f.valorEmpresa,
          descripcion: `Personalizado ${empresaActual.razon_social}`,
        }));

        const { error } = await supabase
          .from('configuracion_equivalencias_ug')
          .insert(payload);

        if (error) {
          setErrorBD(`Error al guardar en Supabase: ${error.message}`);
          setGuardando(false);
          return;
        }
      }

      setMensajeExito('Parámetros de Carga Animal guardados con éxito.');
      await cargarCoeficientesDesdeBD();
    } catch (err: any) {
      setErrorBD(err?.message || 'Error guardando parámetros.');
    } finally {
      setGuardando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-950 border border-emerald-700/60 rounded-2xl text-emerald-400">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                <span>Parámetros Ganaderos y Coeficientes UG (INIA)</span>
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Tabla de equivalencias de Unidad Ganadera (UG) según estándares oficiales de Uruguay.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
          
          {/* Explicación Técnica */}
          <div className="p-4 bg-amber-50/90 border border-amber-200/80 rounded-2xl text-amber-950 space-y-1.5 font-medium">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <Info className="w-4 h-4 text-amber-700 flex-shrink-0" />
              <span>¿Cómo se calcula la Carga Animal en AgroUY?</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              La Carga Animal mide la concentración de ganado por hectárea. Cada categoría equivale a un valor en 
              <strong> Unidades Ganaderas (UG)</strong>, tomando como base 
              <strong className="text-amber-900"> 1 Vaca de Cría de 380 kg = 1.00 UG</strong> (INIA / Plan Agropecuario).
            </p>
            <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200 font-mono text-[11px] text-center font-bold text-amber-900">
              Carga Animal (UG/ha) = Total de UG en Campo ÷ Hectáreas Totales
            </div>
          </div>

          {errorBD && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl font-bold flex items-center space-x-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{errorBD}</span>
            </div>
          )}

          {mensajeExito && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-bold flex items-center space-x-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{mensajeExito}</span>
            </div>
          )}

          {cargando ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mx-auto" />
              <p className="font-semibold">Consultando coeficientes desde PostgreSQL Supabase...</p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-extrabold text-[11px] uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3 px-4">Especie</th>
                    <th className="py-3 px-4">Categoría</th>
                    <th className="py-3 px-4 text-center bg-blue-50/60 text-blue-900 border-x border-blue-100">
                      1. Valor Oficial INIA
                    </th>
                    <th className="py-3 px-4 text-center bg-emerald-50/60 text-emerald-900">
                      2. Coeficiente Empresa
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {filas.map((item, index) => (
                    <tr key={`${item.especie}_${item.categoria || index}`} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-4 font-bold text-slate-900">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                          item.especie === 'VACUNO' ? 'bg-emerald-100 text-emerald-900 border-emerald-200' : 'bg-amber-100 text-amber-900 border-amber-200'
                        }`}>
                          {item.especie}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-bold">
                        {item.categoria ? item.categoria.replace(/_/g, ' ') : 'PROMEDIO GENERAL'}
                      </td>
                      <td className="py-2.5 px-4 text-center bg-blue-50/30 font-extrabold text-blue-900 border-x border-blue-100">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-blue-100 text-blue-950 font-mono text-xs border border-blue-200">
                          {item.valorInia.toFixed(2)} UG
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-center bg-emerald-50/20">
                        {esAdmin ? (
                          <div className="inline-flex items-center space-x-1.5 justify-center">
                            <input
                              type="number"
                              step="0.01"
                              min="0.01"
                              max="5.00"
                              value={item.valorEmpresa}
                              onChange={(e) => handleCambioValorEmpresa(index, Number(e.target.value))}
                              className={`w-20 bg-white border rounded-lg px-2 py-1 text-center text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none ${
                                item.editado ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-300'
                              }`}
                            />
                          </div>
                        ) : (
                          <span className="font-extrabold text-slate-900 bg-slate-100 px-2 py-1 rounded">
                            {item.valorEmpresa.toFixed(2)} UG
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleRestablecerINIA}
            disabled={guardando || cargando}
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-200 hover:bg-slate-300 px-3.5 py-2 rounded-xl transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
            <span>Restablecer INIA</span>
          </button>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer"
            >
              Cerrar
            </button>

            {esAdmin && (
              <button
                type="button"
                onClick={handleGuardarCambios}
                disabled={guardando || cargando}
                className="w-full sm:w-auto bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md cursor-pointer transition-all active:scale-95 flex items-center justify-center space-x-2 disabled:opacity-50 min-h-[40px]"
              >
                {guardando ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Guardar Coeficientes</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
