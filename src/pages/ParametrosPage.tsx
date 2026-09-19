import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { useEmpresasStore } from '../stores/useEmpresasStore';
import { supabase } from '../services/supabase';
import { Scale, RefreshCw, CheckCircle2, Loader2, ShieldCheck, HelpCircle, AlertCircle } from 'lucide-react';

export interface FilaComparativaUG {
  especie: string;
  categoria: string | null;
  descripcion: string;
  valorInia: number;
  valorEmpresa: number;
  editado: boolean;
}

export const ParametrosPage: React.FC = () => {
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
    cargarCoeficientesDesdeBD();
  }, [empresaActual?.id]);

  const cargarCoeficientesDesdeBD = async () => {
    setCargando(true);
    setMensajeExito(null);
    setErrorBD(null);

    try {
      // Consulta directa a PostgreSQL (Sin arrays harcodeados en frontend)
      const { data, error } = await supabase
        .from('configuracion_equivalencias_ug')
        .select('*');

      if (error) {
        setErrorBD(`Error al consultar Supabase: ${error.message}`);
        setCargando(false);
        return;
      }

      if (!data || data.length === 0) {
        setErrorBD('No se encontraron registros de coeficientes en la base de datos.');
        setCargando(false);
        return;
      }

      const empresaId = empresaActual?.id;

      // 1. Filtrar registros globales del INIA (empresa_id IS NULL)
      const registrosInia = data.filter((d) => !d.empresa_id);

      // 2. Filtrar registros específicos de la empresa activa
      const registrosEmpresa = empresaId
        ? data.filter((d) => d.empresa_id === empresaId)
        : [];

      // 3. Cruzar datos dinámicamente
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
      setErrorBD('Ocurrió un error inesperado al conectar con Supabase.');
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
      // Eliminar personalizaciones de la empresa en Supabase
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
      // Solo guardar en Supabase los coeficientes que difieran del valor INIA
      const personalizados = filas.filter((f) => f.editado);

      // 1. Eliminar filas previas de la empresa para evitar basura
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

      setMensajeExito('Parámetros de Carga Animal guardados con éxito para tu empresa.');
      await cargarCoeficientesDesdeBD();
    } catch (err: any) {
      setErrorBD(err?.message || 'Error guardando parámetros.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <section aria-label="Parámetros Ganaderos y Coeficientes UG" className="space-y-4">
      
      {/* Encabezado Principal */}
      <header className="app-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-950 border border-emerald-700/60 rounded-2xl text-emerald-400">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Parámetros Ganaderos y Coeficientes UG (INIA)</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Consulta de referencias oficiales de Uruguay y ajuste de equivalencias para {empresaActual?.nombre_fantasia || 'tu empresa'}.
            </p>
          </div>
        </div>

        {esAdmin && (
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleRestablecerINIA}
              disabled={guardando || cargando}
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3.5 py-2.5 rounded-xl border border-slate-300 transition-all cursor-pointer min-h-[42px] disabled:opacity-50"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
              <span>Restablecer INIA</span>
            </button>

            <button
              type="button"
              onClick={handleGuardarCambios}
              disabled={guardando || cargando}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md cursor-pointer transition-all active:scale-95 flex items-center space-x-2 disabled:opacity-50 min-h-[42px]"
            >
              {guardando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Guardar Parámetros</span>
                </>
              )}
            </button>
          </div>
        )}
      </header>

      {errorBD && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl font-bold flex items-center space-x-2 animate-fadeIn text-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorBD}</span>
        </div>
      )}

      {mensajeExito && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl font-bold flex items-center space-x-2 animate-fadeIn text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{mensajeExito}</span>
        </div>
      )}

      {/* Explicación Concisa en Fondo Claro para Agrónomos */}
      <div className="bg-emerald-50/80 text-emerald-950 px-4 py-2.5 rounded-2xl border border-emerald-200/90 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs shadow-sm">
        <div className="flex items-center space-x-2">
          <HelpCircle className="w-4 h-4 text-emerald-700 flex-shrink-0" />
          <span className="font-bold text-emerald-900">
            Referencia oficial: <strong className="text-emerald-950 font-black">1 Vaca de Cría (380 kg) = 1.00 UG</strong>.
          </span>
        </div>
        <div className="bg-white px-3 py-1 rounded-xl border border-emerald-300 font-bold text-[11px] text-emerald-800 shadow-xs">
          Valor tomado = Configuración Empresa (o INIA por defecto)
        </div>
      </div>

      {/* Tabla Comparativa de Coeficientes */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {cargando ? (
          <div className="py-12 text-center text-slate-500 space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mx-auto" />
            <p className="font-semibold text-xs">Consultando coeficientes desde PostgreSQL Supabase...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-extrabold text-[11px] uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3.5 px-4">Especie</th>
                  <th className="py-3.5 px-4">Categoría Ganadera</th>
                  <th className="py-3.5 px-4">Descripción Oficial INIA</th>
                  <th className="py-3.5 px-4 text-center bg-blue-50/60 text-blue-900 border-x border-blue-100">
                    Valor Oficial INIA (Fijo)
                  </th>
                  <th className="py-3.5 px-4 text-center bg-emerald-100/80 text-emerald-950 font-black">
                    Configurar
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filas.map((item, index) => (
                  <tr key={`${item.especie}_${item.categoria || index}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-black border ${
                        item.especie === 'VACUNO' ? 'bg-emerald-100 text-emerald-900 border-emerald-200' : 'bg-amber-100 text-amber-900 border-amber-200'
                      }`}>
                        {item.especie}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-extrabold text-slate-900">
                      {item.categoria ? item.categoria.replace(/_/g, ' ') : 'PROMEDIO GENERAL ESPECIE'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-xs">
                      {item.descripcion}
                    </td>
                    {/* Columna 1: Valor Fijo de Referencia del INIA */}
                    <td className="py-3 px-4 text-center bg-blue-50/30 font-extrabold text-blue-900 border-x border-blue-100">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-100/80 text-blue-950 font-mono text-xs border border-blue-200">
                        {item.valorInia.toFixed(2)} UG
                      </span>
                    </td>
                    {/* Columna 2: Valor Configurable de la Empresa */}
                    <td className="py-3 px-4 text-center bg-emerald-50/20">
                      {esAdmin ? (
                        <div className="inline-flex items-center space-x-2 justify-center">
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            max="5.00"
                            value={item.valorEmpresa}
                            onChange={(e) => handleCambioValorEmpresa(index, Number(e.target.value))}
                            className={`w-24 bg-white border rounded-xl px-2.5 py-1.5 text-center text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-sm ${
                              item.editado ? 'border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950' : 'border-slate-300'
                            }`}
                          />
                          {item.editado && (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300">
                              Modificado
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="font-extrabold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
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

    </section>
  );
};
