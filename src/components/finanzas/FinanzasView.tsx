import React, { useState } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useEstanciasStore } from '../../stores/useEstanciasStore';
import { useFinanzasStore } from '../../stores/useFinanzasStore';
import { AccionesRapidasModal } from '../dashboard/AccionesRapidasModal';
import { DollarSign, Plus, ArrowUpRight, ArrowDownRight, ShieldAlert } from 'lucide-react';

export const FinanzasView: React.FC = () => {
  const { usuario } = useAuthStore();
  const { estanciaSeleccionadaId } = useEstanciasStore();
  const { obtenerTransaccionesEstancia } = useFinanzasStore();

  const currentRole = usuario?.rol || 'OPERARIO';
  const canAccess = currentRole === 'ADMIN' || currentRole === 'CONTADOR';

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
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 flex-shrink-0" />
            <span>Ingresos y Egresos (USD / UYU)</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Control de caja, liquidaciones de consignatario y compras de insumos.
          </p>
        </div>

        {currentRole === 'ADMIN' && (
          <button 
            onClick={() => setModalAbierto(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold text-xs px-4 py-3 rounded-xl shadow-md min-h-[44px] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Transacción</span>
          </button>
        )}
      </header>

      {/* Tabla Transacciones Responsiva */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider font-extrabold border-b border-slate-200">
                <th className="py-3.5 px-4">Tipo</th>
                <th className="py-3.5 px-4">Fecha</th>
                <th className="py-3.5 px-4">Categoría</th>
                <th className="py-3.5 px-4">Descripción</th>
                <th className="py-3.5 px-4 text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {transacciones.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-[10px] font-black ${
                      t.tipo === 'INGRESO' ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'
                    }`}>
                      {t.tipo === 'INGRESO' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                      <span>{t.tipo}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-mono">
                    <time dateTime={t.fecha}>{t.fecha}</time>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-800">{t.categoria.replace(/_/g, ' ')}</td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium">{t.descripcion}</td>
                  <td className={`py-3.5 px-4 text-right font-black text-sm ${
                    t.tipo === 'INGRESO' ? 'text-emerald-700' : 'text-slate-900'
                  }`}>
                    {t.moneda === 'USD' ? 'USD ' : '$ '}
                    {t.monto.toLocaleString('es-UY')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AccionesRapidasModal
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        tabInicial="FINANZAS"
      />
    </section>
  );
};
