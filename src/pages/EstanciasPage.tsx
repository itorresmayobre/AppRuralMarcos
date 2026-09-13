import React, { useState } from 'react';
import { useEstanciasStore } from '../stores/useEstanciasStore';
import { useAuthStore } from '../stores/useAuthStore';
import type { TipoTenencia } from '../types';
import { MapPin, Plus, CheckCircle2, Building2, X } from 'lucide-react';

export const EstanciasPage: React.FC = () => {
  const { estancias, agregarEstancia, seleccionarEstancia, estanciaSeleccionadaId } = useEstanciasStore();
  const { usuario } = useAuthStore();
  const esAdmin = usuario?.rol === 'ADMIN';

  const [mostrarModal, setMostrarModal] = useState(false);
  const [nombre, setNombre] = useState('');
  const [dicose, setDicose] = useState('');
  const [hectareasTotales, setHectareasTotales] = useState(500);
  const [hectareasPastoreables, setHectareasPastoreables] = useState(450);
  const [departamento, setDepartamento] = useState('Salto');
  const [ubicacionLocalidad, setUbicacionLocalidad] = useState('');
  const [tipoTenencia, setTipoTenencia] = useState<TipoTenencia>('PROPIO');

  const totalHectareasEmpresa = estancias.reduce((acc, curr) => acc + curr.hectareas_totales, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !dicose) return;

    agregarEstancia({
      nombre,
      dicose,
      hectareas_totales: Number(hectareasTotales),
      hectareas_pastoreables: Number(hectareasPastoreables),
      departamento,
      ubicacion_localidad: ubicacionLocalidad || departamento,
      tipo_tenencia: tipoTenencia,
    });

    setMostrarModal(false);
    setNombre('');
    setDicose('');
    setUbicacionLocalidad('');
  };

  return (
    <section aria-label="Gestión de Estancias y Campos" className="space-y-6">
      
      {/* Encabezado */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
            <span>Estancias y Campos de la Empresa</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Administración de propiedades rurales, DICOSE predial y superficie pastoreable.
          </p>
        </div>

        {esAdmin && (
          <button
            onClick={() => setMostrarModal(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold text-xs px-4 py-3 rounded-xl shadow-md min-h-[44px] cursor-pointer hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Nueva Estancia</span>
          </button>
        )}
      </header>

      {/* Resumen Consolidado de Hectáreas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <article className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total de Estancias</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{estancias.length} Campos</p>
          <p className="text-xs text-slate-500 mt-1">En producción activa</p>
        </article>

        <article className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Superficie Total Empresa</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">{totalHectareasEmpresa.toLocaleString()} Ha</p>
          <p className="text-xs text-slate-500 mt-1">Sumando todos los padrones</p>
        </article>

        <article className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Filtro Global Activo</p>
          <p className="text-base font-extrabold text-slate-800 mt-1">
            {estanciaSeleccionadaId === 'TODAS'
              ? '🏢 Consolidado Empresa (Todas)'
              : estancias.find(e => e.id === estanciaSeleccionadaId)?.nombre}
          </p>
          <p className="text-xs text-slate-500 mt-1">Afecta Dashboard, Ganado y Finanzas</p>
        </article>
      </div>

      {/* Lista de Tarjetas de Estancias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {estancias.map((estancia) => {
          const esSeleccionada = estanciaSeleccionadaId === estancia.id;
          return (
            <article
              key={estancia.id}
              className={`bg-white rounded-2xl border p-5 space-y-4 transition-all duration-200 shadow-sm ${
                esSeleccionada
                  ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20'
                  : 'border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-200">
                    Tenencia: {estancia.tipo_tenencia}
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900 mt-2">{estancia.nombre}</h3>
                  <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{estancia.departamento} ({estancia.ubicacion_localidad})</span>
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-emerald-800 bg-slate-100 px-2 py-1 rounded">
                    DICOSE: {estancia.dicose}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Sup. Total</span>
                  <span className="font-extrabold text-slate-800">{estancia.hectareas_totales} Ha</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Pastoreables</span>
                  <span className="font-extrabold text-emerald-700">{estancia.hectareas_pastoreables} Ha</span>
                </div>
              </div>

              <button
                onClick={() => seleccionarEstancia(estancia.id)}
                className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all min-h-[40px] flex items-center justify-center space-x-1.5 cursor-pointer ${
                  esSeleccionada
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {esSeleccionada && <CheckCircle2 className="w-4 h-4" />}
                <span>{esSeleccionada ? 'Estancia Seleccionada' : 'Filtrar App por esta Estancia'}</span>
              </button>
            </article>
          );
        })}
      </div>

      {/* Modal para Registrar Nueva Estancia */}
      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-slate-900">Registrar Nueva Estancia / Campo</h3>
              <button onClick={() => setMostrarModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Nombre de la Estancia o Campo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Estancia La Paloma"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Código DICOSE Oficial</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. 04-123456-7"
                    value={dicose}
                    onChange={(e) => setDicose(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Departamento</label>
                  <select
                    value={departamento}
                    onChange={(e) => setDepartamento(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                  >
                    {['Salto', 'Tacuarembó', 'Paysandú', 'Artigas', 'Durazno', 'Florida', 'Río Negro', 'Cerro Largo', 'Soriano', 'Rocha'].map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Hectáreas Totales</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={hectareasTotales}
                    onChange={(e) => setHectareasTotales(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Pastoreables (Ha)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={hectareasPastoreables}
                    onChange={(e) => setHectareasPastoreables(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Tipo de Tenencia</label>
                <select
                  value={tipoTenencia}
                  onChange={(e) => setTipoTenencia(e.target.value as TipoTenencia)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                >
                  <option value="PROPIO">Propiedad (Campo Propio)</option>
                  <option value="ARRENDADO">Arrendamiento</option>
                  <option value="PASTOREO">Contrato de Pastoreo</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold py-3.5 rounded-xl shadow-md text-xs min-h-[44px] cursor-pointer active:scale-98 transition-all"
              >
                Guardar Estancia
              </button>
            </form>
          </div>
        </div>
      )}

    </section>
  );
};
