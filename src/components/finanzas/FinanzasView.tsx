import React, { useState } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useEstanciasStore } from '../../stores/useEstanciasStore';
import { useFinanzasStore } from '../../stores/useFinanzasStore';
import { TransaccionModal } from '../modals/TransaccionModal';
import { ConfiguracionConceptosView } from './ConfiguracionConceptosView';
import { calcularEjercicioYMesAgricola } from '../../utils/periodoAgricola';
import { DollarSign, Plus, ArrowUpRight, ArrowDownRight, ShieldAlert, Settings, TableProperties } from 'lucide-react';

export const FinanzasView: React.FC = () => {
  const { usuario } = useAuthStore();
  const { estanciaSeleccionadaId } = useEstanciasStore();
  const { obtenerTransaccionesEstancia } = useFinanzasStore();

  const currentRole = usuario?.rol || 'OPERARIO';
  const canAccess = currentRole === 'ADMIN' || currentRole === 'CONTADOR';

  const [tabActiva, setTabActiva] = useState<'TRANSACCIONES' | 'CONFIGURACION'>('TRANSACCIONES');
  const [modalAbierto, setModalAbierto] = useState(false);

  const transacciones = obtenerTransaccionesEstancia(estanciaSeleccionadaId);

  if (!canAccess) {
    return (
      <main className="p-4 sm:p-6 max-w-lg mx-auto mt-6">
        <section aria-label="Acceso denegado a finanzas" className="bg-amber-50 border border-amber-200/90 rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-sm">
          <ShieldAlert className="w-12 h-12 text-amber-600 mx-auto" />
          <h2 className="text-lg font-extrabold text-amber-950">Acceso Restringido a Finanzas</h2>
          <p className="text-xs text-amber-800 leading-relaxed">
            Las transacciones financieras, precios de hacienda y liquidaciones están reservadas para roles de <strong>Administrador / Propietario</strong> y <strong>Contador</strong>.
          </p>
          <p className="text-xs text-slate-500">
            Usa el selector de rol en la barra superior para probar la vista con rol ADMIN o CONTADOR.
          </p>
        </section>
      </main>
    );
  }

  return (
    <section aria-label="Registro Financiero Bimoneda" className="space-y-4 sm:space-y-6">
      {/* Header con Pestañas de Navegación Inline */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 flex-shrink-0" />
            <span>Gestión Financiera Bimoneda</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Control de caja, liquidaciones de consignatario y configuración de rubros del Plan Agropecuario.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setTabActiva('TRANSACCIONES')}
            className={`inline-flex items-center space-x-2 text-xs font-black px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
              tabActiva === 'TRANSACCIONES'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <TableProperties className="w-4 h-4 text-emerald-400" />
            <span>Transacciones</span>
          </button>

          {currentRole === 'ADMIN' && (
            <button
              type="button"
              onClick={() => setTabActiva('CONFIGURACION')}
              className={`inline-flex items-center space-x-2 text-xs font-black px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
                tabActiva === 'CONFIGURACION'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Settings className="w-4 h-4 text-emerald-400" />
              <span>Configuración de Rubros</span>
            </button>
          )}
        </div>
      </header>

      {/* Vista Inline según Pestaña Seleccionada */}
      {tabActiva === 'TRANSACCIONES' ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Historial de Movimientos de Caja</h3>
              <p className="text-xs text-slate-500">Listado de ingresos y egresos registrados en USD y UYU</p>
            </div>
            {currentRole === 'ADMIN' && (
              <button 
                type="button"
                onClick={() => setModalAbierto(true)}
                className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-extrabold text-xs px-4 py-3 rounded-xl shadow-md cursor-pointer transition-all active:scale-95 min-h-[44px]"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva Transacción</span>
              </button>
            )}
          </div>

          {/* Tabla Transacciones Responsiva */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider font-extrabold border-b border-slate-200">
                    <th className="py-3.5 px-4">Tipo</th>
                    <th className="py-3.5 px-4">Fecha / Período</th>
                    <th className="py-3.5 px-4">Categoría / Rubro</th>
                    <th className="py-3.5 px-4">Clasificación</th>
                    <th className="py-3.5 px-4">Descripción</th>
                    <th className="py-3.5 px-4 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {transacciones.length > 0 ? (
                    transacciones.map((t) => {
                      const { ejercicio, mes } = calcularEjercicioYMesAgricola(t.fecha);
                      return (
                        <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-[10px] font-black ${
                              t.tipo === 'INGRESO' ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'
                            }`}>
                              {t.tipo === 'INGRESO' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                              <span>{t.tipo}</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <time dateTime={t.fecha} className="font-mono text-slate-700 block font-bold">{t.fecha}</time>
                            <span className="text-[10px] text-emerald-800 font-extrabold block mt-0.5">
                              {t.periodo_mes || mes} (Ej. {t.ejercicio_agricola || ejercicio})
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-800">{t.categoria.replace(/_/g, ' ')}</td>
                          <td className="py-3.5 px-4">
                            {t.tipo === 'EGRESO' ? (
                              <span className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-md ${
                                t.naturaleza_costo === 'FIJO'
                                  ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                  : 'bg-blue-100 text-blue-900 border border-blue-200'
                              }`}>
                                {t.naturaleza_costo === 'FIJO' ? 'Costo Fijo' : 'Costo Var.'}
                              </span>
                            ) : (
                              <span className="text-[10px] font-extrabold text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-medium">{t.descripcion}</td>
                          <td className={`py-3.5 px-4 text-right font-black text-sm ${
                            t.tipo === 'INGRESO' ? 'text-emerald-700' : 'text-slate-900'
                          }`}>
                            {t.moneda === 'USD' ? 'USD ' : '$ '}
                            {t.monto.toLocaleString('es-UY')}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 text-xs font-medium">
                        No hay transacciones registradas para esta estancia.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <ConfiguracionConceptosView />
      )}

      <TransaccionModal
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
      />
    </section>
  );
};

