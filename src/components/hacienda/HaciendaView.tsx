import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useEstanciasStore } from '../../stores/useEstanciasStore';
import { useGanadoStore } from '../../stores/useGanadoStore';
import { useToastStore } from '../../stores/useToastStore';
import { supabase } from '../../services/supabase';
import { TrasladoGanadoModal } from '../modals/TrasladoGanadoModal';
import { formatearFechaUY } from '../../utils/fechas';
import { Plus, Beef, Truck, SlidersHorizontal, Check, X, Save, Building2, MapPin } from 'lucide-react';
import type { StockGanadero, EspecieGanado, CategoriaVacuno, CategoriaOvino } from '../../types';

export const HaciendaView: React.FC = () => {
  const { usuario } = useAuthStore();
  const { estanciaSeleccionadaId, estancias, seleccionarEstancia } = useEstanciasStore();
  const { stockList, movimientos, obtenerStockEstancia, actualizarStock } = useGanadoStore();
  const { mostrarToast } = useToastStore();

  const [categoriasBD, setCategoriasBD] = useState<{ especie: EspecieGanado; categoria: string; descripcion?: string }[]>([]);

  useEffect(() => {
    useGanadoStore.getState().cargarGanadoDesdeSupabase();

    const cargarCategoriasBD = async () => {
      try {
        const { data, error } = await supabase
          .from('configuracion_equivalencias_ug')
          .select('especie, categoria, descripcion');

        if (!error && data && data.length > 0) {
          const mapaUnicos = new Map<string, { especie: EspecieGanado; categoria: string; descripcion?: string }>();
          data.forEach((item) => {
            const key = `${item.especie}_${item.categoria}`;
            if (!mapaUnicos.has(key)) {
              mapaUnicos.set(key, {
                especie: item.especie as EspecieGanado,
                categoria: item.categoria,
                descripcion: item.descripcion || item.categoria.replace(/_/g, ' '),
              });
            }
          });
          setCategoriasBD(Array.from(mapaUnicos.values()));
        }
      } catch (err) {
        console.warn('No se pudieron cargar categorías dinámicas de Supabase:', err);
      }
    };

    cargarCategoriasBD();
  }, []);

  const currentRole = usuario?.rol || 'OPERARIO';
  const canEdit = currentRole === 'ADMIN' || currentRole === 'CAPATAZ' || currentRole === 'PROPIETARIO' || currentRole === 'SUPERADMIN';

  const [modalTrasladoAbierto, setModalTrasladoAbierto] = useState(false);
  const [filtroEspecie, setFiltroEspecie] = useState<'TODOS' | 'VACUNO' | 'OVINO'>('TODOS');

  // Estado para Edición Inline por Fila
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCabezas, setEditCabezas] = useState<number>(0);
  const [editKilos, setEditKilos] = useState<number>(0);
  const [guardandoInline, setGuardandoInline] = useState<boolean>(false);

  // Estado para Alta Inline de Nueva Categoría
  const [mostrarAltaInline, setMostrarAltaInline] = useState<boolean>(false);
  const [altaEspecie, setAltaEspecie] = useState<EspecieGanado>('VACUNO');
  const [altaCategoria, setAltaCategoria] = useState<string>('VACAS_DE_CRIA');
  const [altaCabezas, setAltaCabezas] = useState<number>(0);
  const [altaKilos, setAltaKilos] = useState<number>(0);

  const stockActual = obtenerStockEstancia(estanciaSeleccionadaId);
  let stockFiltrado = stockActual.filter((s) => filtroEspecie === 'TODOS' || s.especie === filtroEspecie);

  if (estanciaSeleccionadaId === 'TODAS') {
    stockFiltrado = [...stockFiltrado].sort((a, b) => {
      const campoA = estancias.find((e) => e.id === a.estancia_id)?.nombre || '';
      const campoB = estancias.find((e) => e.id === b.estancia_id)?.nombre || '';
      const compCampo = campoA.localeCompare(campoB, undefined, { numeric: true, sensitivity: 'base' });
      if (compCampo !== 0) return compCampo;
      const dateA = new Date(a.ultima_actualizacion || 0).getTime();
      const dateB = new Date(b.ultima_actualizacion || 0).getTime();
      return dateB - dateA;
    });
  }

  const totalCabezasVacunos = stockActual.filter((s) => s.especie === 'VACUNO').reduce((acc, curr) => acc + curr.cabezas, 0);
  const totalCabezasOvinos = stockActual.filter((s) => s.especie === 'OVINO').reduce((acc, curr) => acc + curr.cabezas, 0);

  const IniciarEdicionInline = (item: StockGanadero) => {
    setEditingId(item.id);
    setEditCabezas(item.cabezas);
    setEditKilos(item.kilos_promedio || 0);
  };

  const CancelarEdicionInline = () => {
    setEditingId(null);
  };

  const GuardarEdicionInline = async (item: StockGanadero) => {
    try {
      setGuardandoInline(true);
      await actualizarStock({
        id: item.id,
        estancia_id: item.estancia_id,
        especie: item.especie,
        categoria: item.categoria,
        cabezas: editCabezas,
        kilos_promedio: editKilos,
      });
      mostrarToast('Stock Actualizado', `Existencias de ${item.categoria.replace(/_/g, ' ')} actualizadas correctamente.`, 'EXITO');
      setEditingId(null);
    } catch (e) {
      mostrarToast('Error al Ajustar', 'No se pudieron guardar las existencias.', 'ERROR');
    } finally {
      setGuardandoInline(false);
    }
  };

  const GuardarAltaInline = async () => {
    if (!estanciaSeleccionadaId || estanciaSeleccionadaId === 'TODAS') {
      mostrarToast('Selecciona un Campo', 'Debes seleccionar un establecimiento específico para registrar ganado.', 'ADVERTENCIA');
      return;
    }
    if (altaCabezas < 0) {
      mostrarToast('Cabezas Inválidas', 'Ingresa una cantidad de cabezas válida.', 'ERROR');
      return;
    }

    try {
      setGuardandoInline(true);
      await actualizarStock({
        estancia_id: estanciaSeleccionadaId,
        especie: altaEspecie,
        categoria: altaCategoria as CategoriaVacuno | CategoriaOvino,
        cabezas: altaCabezas,
        kilos_promedio: altaKilos,
      });
      mostrarToast('Ganado Registrado', `Se registraron ${altaCabezas} cabezas en ${altaCategoria.replace(/_/g, ' ')}.`, 'EXITO');
      setMostrarAltaInline(false);
      setAltaCabezas(0);
      setAltaKilos(0);
    } catch (e) {
      mostrarToast('Error al Registrar', 'No se pudo guardar la categoría de ganado.', 'ERROR');
    } finally {
      setGuardandoInline(false);
    }
  };

  const opcionesCategoriaAlta = categoriasBD
    .filter((c) => c.especie === altaEspecie)
    .map((c) => ({
      value: c.categoria,
      label: c.descripcion || c.categoria.replace(/_/g, ' '),
    }));

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
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setMostrarAltaInline(!mostrarAltaInline);
                if (!mostrarAltaInline) {
                  setAltaEspecie(filtroEspecie === 'OVINO' ? 'OVINO' : 'VACUNO');
                  setAltaCategoria(filtroEspecie === 'OVINO' ? 'OVEJAS_CRIA' : 'VACAS_DE_CRIA');
                }
              }}
              className="inline-flex items-center justify-center space-x-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-3.5 py-2 rounded-lg shadow-sm active:scale-95 transition-all min-h-[36px] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{mostrarAltaInline ? 'Cerrar Alta' : '+ Alta de Ganado'}</span>
            </button>

            <button 
              type="button"
              onClick={() => setModalTrasladoAbierto(true)}
              className="inline-flex items-center justify-center space-x-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-3.5 py-2 rounded-lg shadow-sm active:scale-95 transition-all min-h-[36px] cursor-pointer"
            >
              <Truck className="w-4 h-4 text-emerald-400" />
              <span>Traslado Inter-Campo</span>
            </button>
          </div>
        )}
      </header>

      {/* Formulario Rápido Inline para Alta de Nuevas Categorías */}
      {mostrarAltaInline && canEdit && (
        <div className="app-card bg-emerald-50/70 border border-emerald-300 p-3.5 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-emerald-700" />
              <span>Registrar / Inicializar Categoría de Ganado</span>
            </h3>
            <button
              onClick={() => setMostrarAltaInline(false)}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Especie</label>
              <select
                value={altaEspecie}
                onChange={(e) => {
                  const nEsp = e.target.value as EspecieGanado;
                  setAltaEspecie(nEsp);
                  setAltaCategoria(nEsp === 'VACUNO' ? 'VACAS_DE_CRIA' : 'OVEJAS_CRIA');
                }}
                className="w-full px-2.5 py-1.5 bg-white text-slate-900 border border-emerald-300 rounded-lg font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="VACUNO">Vacuno</option>
                <option value="OVINO">Ovino</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Categoría DICOSE</label>
              <select
                value={altaCategoria}
                onChange={(e) => setAltaCategoria(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white text-slate-900 border border-emerald-300 rounded-lg font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {opcionesCategoriaAlta.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Cabezas</label>
              <input
                type="number"
                min="0"
                placeholder="Ej. 50"
                value={altaCabezas || ''}
                onChange={(e) => setAltaCabezas(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-2.5 py-1.5 bg-white text-slate-900 border border-emerald-300 rounded-lg font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Peso Prom. (Kg)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                placeholder="Ej. 380"
                value={altaKilos || ''}
                onChange={(e) => setAltaKilos(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full px-2.5 py-1.5 bg-white text-slate-900 border border-emerald-300 rounded-lg font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                disabled={guardandoInline}
                onClick={GuardarAltaInline}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-1.5 px-3 rounded-lg shadow-sm flex items-center justify-center space-x-1 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{guardandoInline ? 'Guardando...' : 'Guardar Stock'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filtro Rápido por Establecimiento / Campo */}
      <div className="app-card !p-3 space-y-2">
        <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
          Seleccionar Campo / Establecimiento:
        </label>
        <div className="flex space-x-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => seleccionarEstancia('TODAS')}
            className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[36px] cursor-pointer flex items-center gap-1.5 ${
              estanciaSeleccionadaId === 'TODAS'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Todas las Estancias</span>
            <span className="ml-1 text-[10px] bg-slate-800 text-emerald-300 px-1.5 py-0.5 rounded-md font-mono font-bold">
              {stockList.reduce((acc, curr) => acc + curr.cabezas, 0)} cab.
            </span>
          </button>

          {estancias.map((est) => {
            const cabezasEst = stockList
              .filter((s) => s.estancia_id === est.id)
              .reduce((acc, curr) => acc + curr.cabezas, 0);
            const esSel = estanciaSeleccionadaId === est.id;

            return (
              <button
                key={est.id}
                type="button"
                onClick={() => seleccionarEstancia(est.id)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[36px] cursor-pointer flex items-center gap-1.5 ${
                  esSel
                    ? 'bg-emerald-800 text-white shadow-sm ring-2 ring-emerald-600/30'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
                }`}
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>{est.nombre}</span>
                <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold ${
                  esSel ? 'bg-emerald-950 text-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}>
                  {cabezasEst} cab.
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <nav aria-label="Filtrar por especie" className="flex space-x-2 overflow-x-auto pb-1">
        {(['TODOS', 'VACUNO', 'OVINO'] as const).map((esp) => (
          <button
            key={esp}
            onClick={() => setFiltroEspecie(esp)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[34px] cursor-pointer ${
              filtroEspecie === esp
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-300'
            }`}
          >
            {esp === 'TODOS' ? 'Todos los Animales' : esp === 'VACUNO' ? `Vacunos (${totalCabezasVacunos})` : `Ovinos (${totalCabezasOvinos})`}
          </button>
        ))}
      </nav>

      {/* Vista de Tabla Existencias Actuales de Ganado */}
      <div className="app-card !p-0 overflow-hidden">
        <div className="p-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="app-section-title">
            <Beef className="w-4 h-4 text-emerald-600" />
            <span>Existencias Actuales de Ganado</span>
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-extrabold">{stockFiltrado.length} Categorías</span>
          </div>
        </div>

        <div className="app-table-container !border-0 !rounded-none">
          <table className="app-table">
            <thead>
              <tr>
                {estanciaSeleccionadaId === 'TODAS' && <th>Establecimiento / Campo</th>}
                <th>Especie</th>
                <th>Categoría DICOSE</th>
                <th>Cabezas</th>
                <th>Peso Prom. (Kg)</th>
                <th>Última Actualización</th>
                {canEdit && <th className="text-center w-28">Ajustar</th>}
              </tr>
            </thead>
            <tbody>
              {stockFiltrado.length > 0 ? (
                stockFiltrado.map((item) => {
                  const isEditing = editingId === item.id;
                  const nombreEstancia = estancias.find((e) => e.id === item.estancia_id)?.nombre || 'Sin Campo';
                  return (
                    <tr key={item.id} className={isEditing ? 'bg-amber-50/60 transition-colors' : ''}>
                      {estanciaSeleccionadaId === 'TODAS' && (
                        <td className="font-bold text-slate-800">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {nombreEstancia}
                          </span>
                        </td>
                      )}
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
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              value={editCabezas}
                              onChange={(e) => setEditCabezas(Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-20 px-2 py-1 bg-white text-slate-900 border-2 border-emerald-500 rounded text-xs font-bold focus:outline-none focus:ring-1 focus:ring-emerald-600"
                            />
                            <span className="text-[11px] text-slate-500">cab.</span>
                          </div>
                        ) : (
                          `${item.cabezas} cabezas`
                        )}
                      </td>
                      <td className="text-slate-600 font-medium">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              value={editKilos}
                              onChange={(e) => setEditKilos(Math.max(0, parseFloat(e.target.value) || 0))}
                              className="w-20 px-2 py-1 bg-white text-slate-900 border-2 border-emerald-500 rounded text-xs font-bold focus:outline-none focus:ring-1 focus:ring-emerald-600"
                            />
                            <span className="text-[11px] text-slate-500">kg</span>
                          </div>
                        ) : (
                          item.kilos_promedio ? `${item.kilos_promedio} kg` : '-'
                        )}
                      </td>
                      <td className="text-slate-600 font-mono font-medium">
                        <time dateTime={item.ultima_actualizacion}>{formatearFechaUY(item.ultima_actualizacion)}</time>
                      </td>
                      {canEdit && (
                        <td className="text-center">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                title="Guardar Ajuste"
                                disabled={guardandoInline}
                                onClick={() => GuardarEdicionInline(item)}
                                className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md shadow-sm transition-all cursor-pointer active:scale-95"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                title="Cancelar"
                                onClick={CancelarEdicionInline}
                                className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md transition-all cursor-pointer"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              title="Ajustar Stock"
                              onClick={() => IniciarEdicionInline(item)}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded border border-emerald-200 transition-all cursor-pointer active:scale-95"
                            >
                              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Ajustar</span>
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={(estanciaSeleccionadaId === 'TODAS' ? 1 : 0) + (canEdit ? 6 : 5)} className="py-6 text-center text-slate-500">
                    <p className="text-sm font-bold text-slate-700">No hay hacienda registrada en esta estancia.</p>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => {
                          setMostrarAltaInline(true);
                          setAltaEspecie(filtroEspecie === 'OVINO' ? 'OVINO' : 'VACUNO');
                          setAltaCategoria(filtroEspecie === 'OVINO' ? 'OVEJAS_CRIA' : 'VACAS_DE_CRIA');
                        }}
                        className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Haz clic aquí para ingresar las primeras existencias</span>
                      </button>
                    )}
                  </td>
                </tr>
              )}
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
