import React, { useState } from 'react';
import type { StockGanadero } from '../../types';
import { useAuthStore } from '../../stores/useAuthStore';
import { Plus, Beef, RefreshCw } from 'lucide-react';

const mockStock: StockGanadero[] = [
  { id: '1', estancia_id: 'est-1', especie: 'VACUNO', categoria: 'VACAS_DE_CRIA', cabezas: 320, kilos_promedio: 420, ultima_actualizacion: '2026-09-10' },
  { id: '2', estancia_id: 'est-1', especie: 'VACUNO', categoria: 'NOVILLOS_MAS_2', cabezas: 210, kilos_promedio: 480, ultima_actualizacion: '2026-09-12' },
  { id: '3', estancia_id: 'est-1', especie: 'VACUNO', categoria: 'TERNEROS', cabezas: 195, kilos_promedio: 180, ultima_actualizacion: '2026-09-08' },
  { id: '4', estancia_id: 'est-1', especie: 'VACUNO', categoria: 'TOROS', cabezas: 14, kilos_promedio: 650, ultima_actualizacion: '2026-09-01' },
  { id: '5', estancia_id: 'est-1', especie: 'OVINO', categoria: 'OVEJAS_CRIA', cabezas: 450, kilos_promedio: 55, ultima_actualizacion: '2026-09-11' },
  { id: '6', estancia_id: 'est-1', especie: 'OVINO', categoria: 'CAPONES', cabezas: 180, kilos_promedio: 62, ultima_actualizacion: '2026-09-05' },
];

export const HaciendaView: React.FC = () => {
  const { usuario } = useAuthStore();
  const currentRole = usuario?.rol || 'OPERARIO';

  const [stockList] = useState<StockGanadero[]>(mockStock);
  const [filtroEspecie, setFiltroEspecie] = useState<'TODOS' | 'VACUNO' | 'OVINO'>('TODOS');

  const canEdit = currentRole === 'ADMIN' || currentRole === 'CAPATAZ';

  const stockFiltrado = stockList.filter(s => filtroEspecie === 'TODOS' || s.especie === filtroEspecie);

  const totalCabezasVacunos = stockList.filter(s => s.especie === 'VACUNO').reduce((acc, curr) => acc + curr.cabezas, 0);
  const totalCabezasOvinos = stockList.filter(s => s.especie === 'OVINO').reduce((acc, curr) => acc + curr.cabezas, 0);

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
          <button className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-extrabold text-xs px-4 py-3 rounded-xl shadow-md shadow-emerald-950/20 active:scale-95 transition-all min-h-[44px]">
            <Plus className="w-4 h-4" />
            <span>Registrar Movimiento de Ganado</span>
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

      {/* Vista Móvil de Tarjetas */}
      <div className="grid grid-cols-1 gap-3 sm:hidden">
        {stockFiltrado.map((item) => (
          <article key={item.id} className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase ${
                item.especie === 'VACUNO' ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'
              }`}>
                {item.especie}
              </span>
              <time className="text-[11px] text-slate-400 font-mono" dateTime={item.ultima_actualizacion}>
                {item.ultima_actualizacion}
              </time>
            </div>
            
            <div className="flex items-baseline justify-between pt-1">
              <h3 className="font-extrabold text-sm text-slate-800">{item.categoria.replace(/_/g, ' ')}</h3>
              <span className="text-lg font-black text-emerald-700">{item.cabezas} <span className="text-xs font-semibold text-slate-500">cabezas</span></span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span>Peso Promedio: <strong>{item.kilos_promedio ? `${item.kilos_promedio} kg` : '-'}</strong></span>
              {canEdit && (
                <button className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs px-3 py-1.5 rounded-lg border border-emerald-200/80 inline-flex items-center space-x-1 transition-all">
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Ajustar</span>
                </button>
              )}
            </div>
          </article>
        ))}
      </div>

      {/* Vista de Tabla Escritorio */}
      <div className="hidden sm:block bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider font-extrabold border-b border-slate-200">
                <th className="py-3.5 px-4">Especie</th>
                <th className="py-3.5 px-4">Categoría DICOSE</th>
                <th className="py-3.5 px-4">Cabezas</th>
                <th className="py-3.5 px-4">Peso Prom. (Kg)</th>
                <th className="py-3.5 px-4">Última Actualización</th>
                {canEdit && <th className="py-3.5 px-4 text-right">Acciones</th>}
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
                    {item.cabezas}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium">
                    {item.kilos_promedio ? `${item.kilos_promedio} kg` : '-'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 font-mono">
                    <time dateTime={item.ultima_actualizacion}>{item.ultima_actualizacion}</time>
                  </td>
                  {canEdit && (
                    <td className="py-3.5 px-4 text-right">
                      <button className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs px-3 py-1.5 rounded-lg border border-emerald-200/80 inline-flex items-center space-x-1 shadow-sm transition-all active:scale-95">
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Ajustar</span>
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
