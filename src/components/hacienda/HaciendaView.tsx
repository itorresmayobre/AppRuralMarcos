import React, { useState } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useEstanciasStore } from '../../stores/useEstanciasStore';
import { useGanadoStore } from '../../stores/useGanadoStore';
import { TrasladoGanadoModal } from '../modals/TrasladoGanadoModal';
import { formatearFechaUY } from '../../utils/fechas';
import { Plus, Beef, Truck } from 'lucide-react';

export const HaciendaView: React.FC = () => {
  const { usuario } = useAuthStore();
  const { estanciaSeleccionadaId, estancias } = useEstanciasStore();
  const { movimientos, obtenerStockEstancia } = useGanadoStore();

  const currentRole = usuario?.rol || 'OPERARIO';
  const canEdit = currentRole === 'ADMIN' || currentRole === 'CAPATAZ' || currentRole === 'PROPIETARIO' || currentRole === 'SUPERADMIN';

  const [modalTrasladoAbierto, setModalTrasladoAbierto] = useState(false);
  const [filtroEspecie, setFiltroEspecie] = useState<'TODOS' | 'VACUNO' | 'OVINO'>('TODOS');

  const stockActual = obtenerStockEstancia(estanciaSeleccionadaId);
  const stockFiltrado = stockActual.filter((s) => filtroEspecie === 'TODOS' || s.especie === filtroEspecie);

  const totalCabezasVacunos = stockActual.filter((s) => s.especie === 'VACUNO').reduce((acc, curr) => acc + curr.cabezas, 0);
  const totalCabezasOvinos = stockActual.filter((s) => s.especie === 'OVINO').reduce((acc, curr) => acc + curr.cabezas, 0);

  return (
    <section aria-label="Existencias de Ganado y DICOSE" className="space-y-3">
      <header className="app-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Beef className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>Stock de Ganado (Estancia / DICOSE)</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Existencias por categoría vacuna y ovina en el campo / estancia.
          </p>
        </div>

        {canEdit && (
          <button 
            type="button"
            onClick={() => setModalTrasladoAbierto(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-3.5 py-2 rounded-lg shadow-sm active:scale-95 transition-all min-h-[36px] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Traslado de Ganado</span>
          </button>
        )}
      </header>

      <nav aria-label="Filtrar por especie" className="flex space-x-2 overflow-x-auto pb-1">
        {(['TODOS', 'VACUNO', 'OVINO'] as const).map((esp) => (
          <button
            key={esp}
            onClick={() => setFiltroEspecie(esp)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[34px] ${
              filtroEspecie === esp
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-300'
            }`}
          >
            {esp === 'TODOS' ? 'Todos los Animales' : esp === 'VACUNO' ? `Vacunos (${totalCabezasVacunos})` : `Ovinos (${totalCabezasOvinos})`}
          </button>
        ))}
      </nav>

      {/* Vista de Tabla Escritorio Stock */}
      <div className="app-card !p-0 overflow-hidden">
        <div className="p-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="app-section-title">
            <Beef className="w-4 h-4 text-emerald-600" />
            <span>Existencias Actuales de Ganado</span>
          </h3>
          <span className="text-xs text-slate-500 font-extrabold">{stockFiltrado.length} Categorías</span>
        </div>

        <div className="app-table-container !border-0 !rounded-none">
          <table className="app-table">
            <thead>
              <tr>
                <th>Especie</th>
                <th>Categoría DICOSE</th>
                <th>Cabezas</th>
                <th>Peso Prom. (Kg)</th>
                <th>Última Actualización</th>
              </tr>
            </thead>
            <tbody>
              {stockFiltrado.map((item) => (
                <tr key={item.id}>
                  <td className="font-bold">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      item.especie === 'VACUNO' ? 'bg-emerald-100 text-emerald-900 border border-emerald-200' : 'bg-amber-100 text-amber-900 border border-amber-200'
                    }`}>
                      {item.especie}
                    </span>
                  </td>
                  <td className="font-bold text-slate-800">
                    {item.categoria.replace(/_/g, ' ')}
                  </td>
                  <td className="font-bold text-slate-900 text-xs">
                    {item.cabezas} cabezas
                  </td>
                  <td className="text-slate-600 font-medium">
                    {item.kilos_promedio ? `${item.kilos_promedio} kg` : '-'}
                  </td>
                  <td className="text-slate-600 font-mono font-medium">
                    <time dateTime={item.ultima_actualizacion}>{formatearFechaUY(item.ultima_actualizacion)}</time>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historial de Traslados de Hacienda e Imputaciones Económicas */}
      <div className="app-card !p-0 overflow-hidden">
        <div className="p-3 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="app-section-title">
              <Truck className="w-4 h-4 text-emerald-600" />
              <span>Historial de Traslados Inter-Establecimientos</span>
            </h3>
            <p className="text-[11px] text-slate-500">Movimientos físicos e imputación de valor para rentabilidad por campo</p>
          </div>

          <button
            type="button"
            onClick={() => setModalTrasladoAbierto(true)}
            className="inline-flex items-center space-x-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs px-2.5 py-1 rounded-lg border border-emerald-200 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-600" />
            <span>+ Nuevo Traslado</span>
          </button>
        </div>

        <div className="app-table-container !border-0 !rounded-none">
          <table className="app-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Origen ➔ Destino</th>
                <th>Ganado / Cabezas</th>
                <th>Detalle / Guía</th>
                <th className="text-right">Imputación Económica</th>
              </tr>
            </thead>
            <tbody>
              {movimientos.length > 0 ? (
                movimientos.map((m) => {
                  const origenNom = estancias.find(e => e.id === m.estancia_origen_id)?.nombre || 'Origen';
                  const destinoNom = estancias.find(e => e.id === m.estancia_destino_id)?.nombre || 'Destino';
                  return (
                    <tr key={m.id}>
                      <td className="text-slate-700 font-mono font-medium">
                        <time dateTime={m.fecha}>{formatearFechaUY(m.fecha)}</time>
                      </td>
                      <td className="font-bold text-slate-800">
                        <span className="text-rose-700">{origenNom}</span> ➔ <span className="text-emerald-700">{destinoNom}</span>
                      </td>
                      <td className="font-bold text-slate-900">
                        {m.cabezas} {m.categoria.replace(/_/g, ' ')} ({m.especie})
                      </td>
                      <td className="text-slate-600 font-medium">{m.observaciones}</td>
                      <td className="text-right">
                        {m.valorizar_transferencia ? (
                          <span className="inline-block text-xs font-bold bg-emerald-100 text-emerald-950 px-2 py-0.5 rounded border border-emerald-300">
                            USD {m.monto_total_imputado.toLocaleString('es-UY')}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">Sin valorización</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-slate-500">
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
