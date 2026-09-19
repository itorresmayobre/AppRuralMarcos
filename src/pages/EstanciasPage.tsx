import React, { useState } from 'react';
import { useEstanciasStore } from '../stores/useEstanciasStore';
import { useAuthStore } from '../stores/useAuthStore';
import { useToastStore } from '../stores/useToastStore';
import { CustomSelect } from '../components/ui/CustomSelect';
import { CoeficientesUGModal } from '../components/ganado/CoeficientesUGModal';
import type { TipoTenencia, Estancia } from '../types';
import { MapPin, Plus, CheckCircle2, Building2, X, Scale, Pencil, ToggleLeft, ToggleRight } from 'lucide-react';

export const EstanciasPage: React.FC = () => {
  const { estancias, agregarEstancia, editarEstancia, seleccionarEstancia, estanciaSeleccionadaId } = useEstanciasStore();
  const { usuario } = useAuthStore();
  const { mostrarToast } = useToastStore();
  const esAdmin = usuario?.rol === 'ADMIN' || usuario?.rol === 'PROPIETARIO' || usuario?.rol === 'SUPERADMIN';

  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarModalUG, setMostrarModalUG] = useState(false);
  const [nombre, setNombre] = useState('');
  const [dicose, setDicose] = useState('');
  const [hectareasTotales, setHectareasTotales] = useState(500);
  const [hectareasPastoreables, setHectareasPastoreables] = useState(450);
  const [departamento, setDepartamento] = useState('Salto');
  const [ubicacionLocalidad, setUbicacionLocalidad] = useState('');
  const [tipoTenencia, setTipoTenencia] = useState<TipoTenencia>('PROPIO');

  // Estado para Modal de Edición de Campo / Establecimiento
  const [estanciaEditando, setEstanciaEditando] = useState<Estancia | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editDicose, setEditDicose] = useState('');
  const [editHectareasTotales, setEditHectareasTotales] = useState(500);
  const [editHectareasPastoreables, setEditHectareasPastoreables] = useState(450);
  const [editDepartamento, setEditDepartamento] = useState('Salto');
  const [editUbicacionLocalidad, setEditUbicacionLocalidad] = useState('');
  const [editTipoTenencia, setEditTipoTenencia] = useState<TipoTenencia>('PROPIO');
  const [editActiva, setEditActiva] = useState(true);

  const totalHectareasEmpresa = estancias.reduce((acc, curr) => acc + curr.hectareas_totales, 0);

  const abrirModalEditar = (estancia: Estancia) => {
    setEstanciaEditando(estancia);
    setEditNombre(estancia.nombre);
    setEditDicose(estancia.dicose);
    setEditHectareasTotales(estancia.hectareas_totales);
    setEditHectareasPastoreables(estancia.hectareas_pastoreables);
    setEditDepartamento(estancia.departamento);
    setEditUbicacionLocalidad(estancia.ubicacion_localidad || '');
    setEditTipoTenencia(estancia.tipo_tenencia);
    setEditActiva(estancia.activa ?? true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!estanciaEditando || !editNombre || !editDicose) return;

    await editarEstancia(estanciaEditando.id, {
      nombre: editNombre,
      dicose: editDicose,
      hectareas_totales: Number(editHectareasTotales),
      hectareas_pastoreables: Number(editHectareasPastoreables),
      departamento: editDepartamento,
      ubicacion_localidad: editUbicacionLocalidad || editDepartamento,
      tipo_tenencia: editTipoTenencia,
      activa: editActiva,
    });

    mostrarToast(
      'Establecimiento Actualizado',
      `Se actualizaron los datos de ${editNombre}.`,
      'EXITO'
    );
    setEstanciaEditando(null);
  };

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
    <section aria-label="Gestión de Establecimientos y Campos" className="space-y-3">
      
      {/* Encabezado */}
      <header className="app-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>Establecimientos y Campos de la Empresa</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Administración de propiedades rurales, DICOSE predial y superficie pastoreable.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2">
          <button
            onClick={() => setMostrarModalUG(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-3.5 py-3 rounded-xl border border-slate-300 min-h-[44px] cursor-pointer transition-all"
            title="Ver / Configurar coeficientes de Carga Animal (INIA)"
          >
            <Scale className="w-4 h-4 text-emerald-700" />
            <span>Coeficientes UG (INIA)</span>
          </button>

          {esAdmin && (
            <button
              onClick={() => setMostrarModal(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold text-xs px-4 py-3 rounded-xl shadow-md min-h-[44px] cursor-pointer hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Nuevo Establecimiento</span>
            </button>
          )}
        </div>
      </header>

      {/* Resumen Consolidado de Hectáreas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <article className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total de Establecimientos</p>
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
              className={`bg-white rounded-2xl border p-5 space-y-4 transition-all duration-200 shadow-sm relative ${
                esSeleccionada
                  ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20'
                  : 'border-slate-200/80 hover:border-slate-300'
              } ${estancia.activa === false ? 'opacity-80 bg-slate-50/60' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-200">
                      Tenencia: {estancia.tipo_tenencia}
                    </span>
                    {estancia.activa === false && (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                        Inactivo
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 mt-2 flex items-center gap-2">
                    <span>{estancia.nombre}</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{estancia.departamento} ({estancia.ubicacion_localidad})</span>
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className="text-xs font-mono font-bold text-emerald-800 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                    DICOSE: {estancia.dicose}
                  </span>

                  {esAdmin && (
                    <button
                      onClick={() => abrirModalEditar(estancia)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 px-2.5 py-1 rounded-lg transition-all cursor-pointer active:scale-95"
                      title="Editar datos del campo o cambiar estado"
                    >
                      <Pencil className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Editar</span>
                    </button>
                  )}
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
                <span>{esSeleccionada ? 'Establecimiento Seleccionado' : 'Filtrar App por este Establecimiento'}</span>
              </button>
            </article>
          );
        })}
      </div>

      {/* Modal para Registrar Nuevo Establecimiento */}
      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-slate-900">Registrar Nuevo Establecimiento / Campo</h3>
              <button onClick={() => setMostrarModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Nombre del Establecimiento o Campo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Establecimiento La Paloma"
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

                <div>
                  <CustomSelect
                    label="Departamento"
                    value={departamento}
                    options={['Salto', 'Tacuarembó', 'Paysandú', 'Artigas', 'Durazno', 'Florida', 'Río Negro', 'Cerro Largo', 'Soriano', 'Rocha'].map((d) => ({
                      value: d,
                      label: d,
                    }))}
                    onChange={(val) => setDepartamento(val)}
                  />
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

              <div>
                <CustomSelect<TipoTenencia>
                  label="Tipo de Tenencia"
                  value={tipoTenencia}
                  options={[
                    { value: 'PROPIO', label: 'Propiedad (Campo Propio)' },
                    { value: 'ARRENDADO', label: 'Arrendamiento' },
                    { value: 'PASTOREO', label: 'Contrato de Pastoreo' },
                  ]}
                  onChange={(val) => setTipoTenencia(val)}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold py-3.5 rounded-xl shadow-md text-xs min-h-[44px] cursor-pointer active:scale-98 transition-all"
              >
                Guardar Establecimiento
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Editar Establecimiento / Campo */}
      {estanciaEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Pencil className="w-5 h-5 text-emerald-600" />
                <span>Editar Establecimiento / Campo</span>
              </h3>
              <button onClick={() => setEstanciaEditando(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Nombre del Establecimiento o Campo</label>
                <input
                  type="text"
                  required
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Código DICOSE Oficial</label>
                  <input
                    type="text"
                    required
                    value={editDicose}
                    onChange={(e) => setEditDicose(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <CustomSelect
                    label="Departamento"
                    value={editDepartamento}
                    options={['Salto', 'Tacuarembó', 'Paysandú', 'Artigas', 'Durazno', 'Florida', 'Río Negro', 'Cerro Largo', 'Soriano', 'Rocha'].map((d) => ({
                      value: d,
                      label: d,
                    }))}
                    onChange={(val) => setEditDepartamento(val)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Hectáreas Totales</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editHectareasTotales}
                    onChange={(e) => setEditHectareasTotales(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Pastoreables (Ha)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editHectareasPastoreables}
                    onChange={(e) => setEditHectareasPastoreables(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <CustomSelect<TipoTenencia>
                  label="Tipo de Tenencia"
                  value={editTipoTenencia}
                  options={[
                    { value: 'PROPIO', label: 'Propiedad (Campo Propio)' },
                    { value: 'ARRENDADO', label: 'Arrendamiento' },
                    { value: 'PASTOREO', label: 'Contrato de Pastoreo' },
                  ]}
                  onChange={(val) => setEditTipoTenencia(val)}
                />
              </div>

              {/* Interruptor de Estado Activo / Inactivo */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <label className="font-bold text-slate-800 text-xs block">Estado Operativo del Campo</label>
                  <p className="text-[11px] text-slate-500">
                    Deshabilitar en caso de fin de arrendamiento o venta de la propiedad.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditActiva(!editActiva)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    editActiva
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}
                >
                  {editActiva ? (
                    <>
                      <ToggleRight className="w-4 h-4 text-emerald-600" />
                      <span>Activo</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4 text-amber-600" />
                      <span>Inactivo</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEstanciaEditando(null)}
                  className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-xl text-xs min-h-[44px] cursor-pointer transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-2/3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold py-3.5 rounded-xl shadow-md text-xs min-h-[44px] cursor-pointer active:scale-98 transition-all"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Consulta y Edición de Coeficientes UG (INIA) */}
      <CoeficientesUGModal
        isOpen={mostrarModalUG}
        onClose={() => setMostrarModalUG(false)}
      />

    </section>
  );
};
