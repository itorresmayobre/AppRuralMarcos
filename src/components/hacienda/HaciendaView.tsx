import React, { useState } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useEstanciasStore } from '../../stores/useEstanciasStore';
import { useGanadoStore } from '../../stores/useGanadoStore';
import { TrasladoGanadoModal } from '../modals/TrasladoGanadoModal';
import { Plus, Beef, Truck } from 'lucide-react';

export const HaciendaView: React.FC = () => {
  const { usuario } = useAuthStore();
  const { estanciaSeleccionadaId, estancias } = useEstanciasStore();
  const { movimientos, obtenerStockEstancia } = useGanadoStore();

  const currentRole = usuario?.rol || 'OPERARIO';
  const canEdit = currentRole === 'ADMIN' || currentRole === 'CAPATAZ';

  const [modalTrasladoAbierto, setModalTrasladoAbierto] = useState(false);
  const [filtroEspecie, setFiltroEspecie] = useState<'TODOS' | 'VACUNO' | 'OVINO'>('TODOS');

  const stockActual = obtenerStockEstancia(estanciaSeleccionadaId);
  const stockFiltrado = stockActual.filter((s) => filtroEspecie === 'TODOS' || s.especie === filtroEspecie);

  const totalCabezasVacunos = stockActual.filter((s) => s.especie === 'VACUNO').reduce((acc, curr) => acc + curr.cabezas, 0);
  const totalCabezasOvinos = stockActual.filter((s) => s.especie === 'OVINO').reduce((acc, curr) => acc + curr.cabezas, 0);

  return (
    <section aria-label="Existencias de Ganado y DICOSE" className="space-y-4 sm:space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Beef className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 flex-shrink-0" />
            <span>Stock de Ganado (Estancia / DICOSE)</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Existencias por categoría vacuna y ovina en el campo / estancia.
          </p>
        </div>

        {canEdit && (
          <button 
            type="button"
            onClick={() => setModalTrasladoAbierto(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-extrabold text-xs px-4 py-3 rounded-xl shadow-md shadow-emerald-950/20 active:scale-95 transition-all min-h-[44px] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Traslado de Ganado</span>
          </button>
        )}
      </header>

      <nav aria-label="Filtrar por especie" className="flex space-x-2 overflow-x-auto pb-2">
        {(['TODOS', 'VACUNO', 'OVINO'] as const).map((esp) => (
          <button
            key={esp}
            onClick={() => setFiltroEspecie(esp)}
            className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-xs font-bold transition-all min-h-[40px] ${
              filtroEspecie === esp
                ? 'bg-emerald-700 text-white shadow-md shadow-emerald-950/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {esp === 'TODOS' ? 'Todos los Animales' : esp === 'VACUNO' ? `Vacunos (${totalCabezasVacunos})` : `Ovinos (${totalCabezasOvinos})`}
          </button>
        ))}
      </nav>

      {/* Vista de Tabla Escritorio Stock */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Beef className="w-4 h-4 text-emerald-600" />
            <span>Existencias Actuales de Ganado</span>
          </h3>
          <span className="text-xs text-slate-500 font-extrabold">{stockFiltrado.length} Categorías</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider font-extrabold border-b border-slate-200">
                <th className="py-3.5 px-4">Especie</th>
                <th className="py-3.5 px-4">Categoría DICOSE</th>
                <th className="py-3.5 px-4">Cabezas</th>
                <th className="py-3.5 px-4">Peso Prom. (Kg)</th>
                <th className="py-3.5 px-4">Última Actualización</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {stockFiltrado.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-bold">
                    <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-black uppercase ${
                      item.especie === 'VACUNO' ? 'bg-emerald-100 text-emerald-900 border border-emerald-200' : 'bg-amber-100 text-amber-900 border border-amber-200'
                    }`}>
                      {item.especie}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-800">
                    {item.categoria.replace(/_/g, ' ')}
                  </td>
                  <td className="py-3.5 px-4 font-black text-slate-900 text-sm">
                    {item.cabezas} cabezas
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium">
                    {item.kilos_promedio ? `${item.kilos_promedio} kg` : '-'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 font-mono">
                    <time dateTime={item.ultima_actualizacion}>{item.ultima_actualizacion}</time>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historial de Traslados de Hacienda e Imputaciones Económicas */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden space-y-3">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-600" />
              <span>Historial de Traslados Inter-Establecimientos</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Movimientos físicos e imputación de valor para rentabilidad por campo</p>
          </div>

          <button
            type="button"
            onClick={() => setModalTrasladoAbierto(true)}
            className="inline-flex items-center space-x-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-extrabold text-xs px-3 py-1.5 rounded-xl border border-emerald-200 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-600" />
            <span>+ Nuevo Traslado</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider font-extrabold border-b border-slate-200">
                <th className="py-3.5 px-4">Fecha</th>
                <th className="py-3.5 px-4">Origen ➔ Destino</th>
                <th className="py-3.5 px-4">Ganado / Cabezas</th>
                <th className="py-3.5 px-4">Detalle / Guía</th>
                <th className="py-3.5 px-4 text-right">Imputación Económica</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {movimientos.length > 0 ? (
                movimientos.map((m) => {
                  const origenNom = estancias.find(e => e.id === m.estancia_origen_id)?.nombre || 'Origen';
                  const destinoNom = estancias.find(e => e.id === m.estancia_destino_id)?.nombre || 'Destino';
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 text-slate-500 font-mono">
                        <time dateTime={m.fecha}>{m.fecha}</time>
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-slate-800">
                        <span className="text-rose-700">{origenNom}</span> ➔ <span className="text-emerald-700">{destinoNom}</span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {m.cabezas} {m.categoria.replace(/_/g, ' ')} ({m.especie})
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">{m.observaciones}</td>
                      <td className="py-3.5 px-4 text-right">
                        {m.valorizar_transferencia ? (
                          <span className="inline-block text-xs font-black bg-emerald-100 text-emerald-950 px-2.5 py-1 rounded-xl border border-emerald-300">
                            USD {m.monto_total_imputado.toLocaleString('es-UY')}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-bold">Sin valorización</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500">
                    No hay traslados de ganado registrados entre campos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TrasladoGanadoModal
        isOpen={modalTrasladoAbierto}
        onClose={() => setModalTrasladoAbierto(false)}
      />

    </section>
  );
};
