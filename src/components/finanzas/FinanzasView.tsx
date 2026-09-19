import React, { useState, useEffect } from 'react';
import { useFinanzasState } from '../../hooks/useFinanzasState';
import { useFinanzasStore } from '../../stores/useFinanzasStore';
import { useConceptosFinancierosStore } from '../../stores/useConceptosFinancierosStore';
import { useRecibosSueldoStore } from '../../stores/useRecibosSueldoStore';
import { useToastStore } from '../../stores/useToastStore';
import { TransaccionModal } from '../modals/TransaccionModal';
import { ReciboSueldoModal } from '../modals/ReciboSueldoModal';
import { VisorComprobanteModal } from '../modals/VisorComprobanteModal';
import { ConfiguracionConceptosView } from './ConfiguracionConceptosView';
import { calcularEjercicioYMesAgricola } from '../../utils/periodoAgricola';
import { formatearFechaUY } from '../../utils/fechas';
import { DollarSign, Plus, ArrowUpRight, ArrowDownRight, ShieldAlert, Settings, TableProperties, Trash2, FileText, Eye, Pencil } from 'lucide-react';
import type { TransaccionFinanciera } from '../../types';

export const FinanzasView: React.FC = () => {
  const finanzas = useFinanzasState();
  const { eliminarTransaccion } = useFinanzasStore();
  const { mostrarToast } = useToastStore();

  const [modalReciboAbierto, setModalReciboAbierto] = useState(false);
  const [transaccionAEditar, setTransaccionAEditar] = useState<TransaccionFinanciera | null>(null);
  const [comprobanteAVisitar, setComprobanteAVisitar] = useState<{ url: string; titulo?: string } | null>(null);

  useEffect(() => {
    if (!useFinanzasStore.getState().inicializado) {
      useFinanzasStore.getState().cargarTransaccionesDesdeSupabase();
    }
    if (!useConceptosFinancierosStore.getState().inicializado) {
      useConceptosFinancierosStore.getState().cargarConceptosDesdeSupabase();
    }
    if (!useRecibosSueldoStore.getState().inicializado) {
      useRecibosSueldoStore.getState().cargarRecibosDesdeSupabase();
    }
  }, []);

  const handleEliminarTransaccion = (id: string, desc: string) => {
    eliminarTransaccion(id);
    mostrarToast('Transacción Eliminada', `Se eliminó "${desc}" correctamente.`, 'INFO');
  };

  const handleEditarTransaccion = (t: TransaccionFinanciera) => {
    setTransaccionAEditar(t);
    finanzas.setModalAbierto(true);
  };

  const handleNuevaTransaccion = () => {
    setTransaccionAEditar(null);
    finanzas.setModalAbierto(true);
  };

  if (!finanzas.canAccess) {
    return (
      <main className="p-4 sm:p-6 max-w-lg mx-auto mt-6">
        <section aria-label="Acceso denegado a finanzas" className="bg-amber-50 border border-amber-200/90 rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-sm">
          <ShieldAlert className="w-12 h-12 text-amber-600 mx-auto" />
          <h2 className="text-lg font-extrabold text-amber-950">Acceso Restringido a Finanzas</h2>
          <p className="text-xs text-amber-800 leading-relaxed">
            Las transacciones financieras, precios de hacienda y liquidaciones están reservadas para roles de <strong>Administrador / Propietario</strong> y <strong>Contador</strong>.
          </p>
          <p className="text-xs text-slate-500">
            Usa el selector de rol en la barra superior para probar la vista con rol ADMIN, PROPIETARIO o CONTADOR.
          </p>
        </section>
      </main>
    );
  }

  return (
    <section aria-label="Gestión Financiera Bimoneda" className="space-y-3">
      {/* Header con Pestañas de Navegación Inline */}
      <header className="app-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>Gestión Financiera Bimoneda</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Control de caja, liquidaciones de consignatario y recibos de sueldo del personal.
          </p>
        </div>

        {/* Tab Switcher */}
        <nav aria-label="Secciones de Finanzas" className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => finanzas.setTabActiva('TRANSACCIONES')}
            className={`inline-flex items-center space-x-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              finanzas.tabActiva === 'TRANSACCIONES'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <TableProperties className="w-3.5 h-3.5 text-emerald-400" />
            <span>Transacciones</span>
          </button>

          {(finanzas.currentRole === 'ADMIN' || finanzas.currentRole === 'PROPIETARIO' || finanzas.currentRole === 'SUPERADMIN') && (
            <button
              type="button"
              onClick={() => finanzas.setTabActiva('CONFIGURACION')}
              className={`inline-flex items-center space-x-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                finanzas.tabActiva === 'CONFIGURACION'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Settings className="w-3.5 h-3.5 text-emerald-400" />
              <span>Configuración de Rubros</span>
            </button>
          )}
        </nav>
      </header>

      {/* Vista Inline según Pestaña Seleccionada */}
      {finanzas.tabActiva === 'TRANSACCIONES' ? (
        <article className="space-y-3">
          <header className="app-card flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Historial de Movimientos de Caja</h3>
              <p className="text-xs text-slate-500">Listado de ingresos y egresos registrados en USD y UYU</p>
            </div>
            {(finanzas.currentRole === 'ADMIN' || finanzas.currentRole === 'PROPIETARIO' || finanzas.currentRole === 'SUPERADMIN') && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalReciboAbierto(true)}
                  className="inline-flex items-center justify-center space-x-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 transition-all cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Subir Recibo Sueldo</span>
                </button>
                <button 
                  type="button"
                  onClick={handleNuevaTransaccion}
                  className="inline-flex items-center justify-center space-x-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-sm cursor-pointer transition-all active:scale-95 min-h-[34px]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nueva Transacción</span>
                </button>
              </div>
            )}
          </header>

          {/* Tabla Transacciones Responsiva */}
          <div className="app-card !p-0 overflow-hidden">
            <div className="app-table-container !border-0 !rounded-none">
              <table className="app-table">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Fecha / Período</th>
                    <th>Categoría / Rubro</th>
                    <th>Clasificación</th>
                    <th>Descripción</th>
                    <th className="text-right">Monto</th>
                    <th className="text-center">Comprobante</th>
                    <th className="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {finanzas.transacciones.length > 0 ? (
                    finanzas.transacciones.map((t) => {
                      const { ejercicio, mes } = calcularEjercicioYMesAgricola(t.fecha);
                      const tieneFoto = Boolean(t.comprobante_url && t.comprobante_url.trim().length > 5);

                      return (
                        <tr key={t.id}>
                          <td>
                            <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                              t.tipo === 'INGRESO' ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'
                            }`}>
                              {t.tipo === 'INGRESO' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                              <span>{t.tipo}</span>
                            </span>
                          </td>
                          <td>
                            <time dateTime={t.fecha} className="font-mono text-slate-700 block font-bold">{formatearFechaUY(t.fecha)}</time>
                            <span className="text-[10px] text-emerald-800 font-extrabold block">
                              {t.periodo_mes || mes} (Ej. {t.ejercicio_agricola || ejercicio})
                            </span>
                          </td>
                          <td className="font-bold text-slate-800">{t.categoria.replace(/_/g, ' ')}</td>
                          <td>
                            {t.tipo === 'EGRESO' ? (
                              <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                t.naturaleza_costo === 'FIJO'
                                  ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                  : 'bg-blue-100 text-blue-900 border border-blue-200'
                              }`}>
                                {t.naturaleza_costo === 'FIJO' ? 'Costo Fijo' : 'Costo Var.'}
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium text-slate-400">—</span>
                            )}
                          </td>
                          <td className="text-slate-600 font-medium">{t.descripcion}</td>
                          <td className={`text-right font-bold text-xs ${
                            t.tipo === 'INGRESO' ? 'text-emerald-700' : 'text-slate-900'
                          }`}>
                            {t.moneda === 'USD' ? 'USD ' : '$ '}
                            {t.monto.toLocaleString('es-UY')}
                          </td>
                          <td className="text-center">
                            {tieneFoto ? (
                              <button
                                type="button"
                                onClick={() => setComprobanteAVisitar({ url: t.comprobante_url!, titulo: `Comprobante: ${t.descripcion}` })}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2 py-1 rounded-lg transition-all cursor-pointer active:scale-95"
                                title="Ver comprobante en pantalla"
                              >
                                <Eye className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Ver</span>
                              </button>
                            ) : (
                              <span className="text-[10px] font-medium text-slate-400 opacity-60">
                                —
                              </span>
                            )}
                          </td>
                          <td className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleEditarTransaccion(t)}
                                className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                                title="Editar Transacción"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleEliminarTransaccion(t.id, t.descripcion)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                title="Eliminar Transacción"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-slate-500 text-xs font-medium">
                        No hay transacciones registradas para esta estancia.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </article>
      ) : (
        <ConfiguracionConceptosView />
      )}

      <TransaccionModal
        isOpen={finanzas.modalAbierto}
        onClose={() => {
          finanzas.setModalAbierto(false);
          setTransaccionAEditar(null);
        }}
        transaccionAEditar={transaccionAEditar}
      />

      <ReciboSueldoModal
        isOpen={modalReciboAbierto}
        onClose={() => setModalReciboAbierto(false)}
      />

      <VisorComprobanteModal
        isOpen={Boolean(comprobanteAVisitar)}
        url={comprobanteAVisitar?.url || null}
        titulo={comprobanteAVisitar?.titulo}
        onClose={() => setComprobanteAVisitar(null)}
      />
    </section>
  );
};

