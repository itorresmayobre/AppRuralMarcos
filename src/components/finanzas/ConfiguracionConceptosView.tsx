import React, { useState, useEffect } from 'react';
import { useConceptosFinancierosStore } from '../../stores/useConceptosFinancierosStore';
import { useEstanciasStore } from '../../stores/useEstanciasStore';
import { useToastStore } from '../../stores/useToastStore';
import { conceptosService } from '../../services/api/conceptosService';
import type { TipoTransaccion } from '../../types';
import {
  Settings,
  CheckCircle2,
  XCircle,
  Sparkles,
  Loader2,
  Check,
  TrendingUp,
  TrendingDown,
  Plus,
  X,
  Search,
  Layers,
  SlidersHorizontal,
  PieChart,
  Wand2,
  Building2,
  Percent,
  MapPin
} from 'lucide-react';

export const ConfiguracionConceptosView: React.FC = () => {
  const {
    catalog,
    conceptosActivosIds,
    inicializado,
    cargarConceptosDesdeSupabase,
    toggleConcepto,
    activarTodosGrupo,
    agregarConceptoPersonalizado
  } = useConceptosFinancierosStore();

  useEffect(() => {
    if (!inicializado || catalog.length === 0) {
      cargarConceptosDesdeSupabase();
    }
  }, [inicializado, catalog.length, cargarConceptosDesdeSupabase]);

  const { estancias, reglasProrrateo, actualizarReglasProrrateo, calcularProrrateoPorHectareas } = useEstanciasStore();
  const { mostrarToast } = useToastStore();

  const [seccionActiva, setSeccionActiva] = useState<'RUBROS' | 'PRORRATEO'>('RUBROS');
  const [tipoFiltro, setTipoFiltro] = useState<'TODOS' | TipoTransaccion>('TODOS');
  const [busqueda, setBusqueda] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Estado local editable para las reglas de prorrateo
  const [localReglas, setLocalReglas] = useState<Record<string, number>>(reglasProrrateo);

  // Estado para el modal de Crear Rubro Personalizado
  const [modalNuevoAbierto, setModalNuevoAbierto] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoTipo, setNuevoTipo] = useState<TipoTransaccion>('EGRESO');
  const [nuevoGrupo, setNuevoGrupo] = useState('Otros Gastos');
  const [nuevoIcono, setNuevoIcono] = useState('📋');
  const [nuevaNaturaleza, setNuevaNaturaleza] = useState<'FIJO' | 'VARIABLE'>('VARIABLE');
  const [nuevoRecurrente, setNuevoRecurrente] = useState(false);

  const totalActivosIngresos = catalog.filter(c => c.tipo === 'INGRESO' && conceptosActivosIds.includes(c.id)).length;
  const totalActivosEgresos = catalog.filter(c => c.tipo === 'EGRESO' && conceptosActivosIds.includes(c.id)).length;

  const handleGuardarEnSupabase = async () => {
    setGuardando(true);
    try {
      await conceptosService.guardarConfiguracionConceptos(conceptosActivosIds);
      setGuardando(false);
      mostrarToast(
        '¡Rubros Sincronizados!',
        `Se han actualizado los conceptos activos en Supabase (${conceptosActivosIds.length} habilitados).`,
        'EXITO'
      );
    } catch (err: unknown) {
      setGuardando(false);
      const msg = err instanceof Error ? err.message : 'Error al guardar la configuración';
      mostrarToast('Error al Guardar', msg, 'ERROR');
    }
  };

  const handleCrearRubroPersonalizado = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim()) {
      mostrarToast('Error', 'Por favor ingresa un nombre para el rubro', 'ERROR');
      return;
    }

    const nuevoConcepto = await agregarConceptoPersonalizado({
      nombre: nuevoNombre.trim(),
      tipo: nuevoTipo,
      grupo: nuevoGrupo.trim() || 'Otros Gastos',
      icono: nuevoIcono,
      naturaleza_costo: nuevoTipo === 'EGRESO' ? nuevaNaturaleza : undefined,
      es_recurrente_mensual: nuevoRecurrente,
    });

    mostrarToast(
      'Rubro Creado',
      `Se agregó el rubro "${nuevoConcepto.nombre}" como ${nuevoConcepto.naturaleza_costo === 'FIJO' ? 'Costo Fijo' : 'Costo Variable'}`,
      'EXITO'
    );

    setNuevoNombre('');
    setModalNuevoAbierto(false);
  };

  // Filtrar catálogo por búsqueda y tipo
  const conceptosFiltrados = catalog.filter((c) => {
    const coincideTipo = tipoFiltro === 'TODOS' || c.tipo === tipoFiltro;
    const coincideBusqueda = !busqueda.trim() || 
      c.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
      c.grupo.toLowerCase().includes(busqueda.toLowerCase());
    return coincideTipo && coincideBusqueda;
  });

  // Obtener lista de grupos únicos presentes en los conceptos filtrados
  const gruposRepresentados = Array.from(new Set(conceptosFiltrados.map((c) => c.grupo)));

  const handleAutoCalcularHectareas = () => {
    const porHectareas = calcularProrrateoPorHectareas();
    setLocalReglas(porHectareas);
    actualizarReglasProrrateo(porHectareas);
    mostrarToast(
      'Prorrateo Calculado',
      'Porcentajes repartidos automáticamente según las Hectáreas Totales de cada campo.',
      'EXITO'
    );
  };

  const handleGuardarProrrateo = () => {
    actualizarReglasProrrateo(localReglas);
    mostrarToast(
      'Prorrateo Guardado',
      'Se han actualizado los porcentajes predeterminados de repartición corporativa.',
      'EXITO'
    );
  };

  const sumaPorcentajes = Object.values(localReglas).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      
      {/* Navegación por Pestañas Principales (Rubros vs Prorrateo) */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setSeccionActiva('RUBROS')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center space-x-2 cursor-pointer ${
            seccionActiva === 'RUBROS'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Settings className="w-4 h-4 text-emerald-400" />
          <span>Catálogo de Rubros Financieros</span>
        </button>

        <button
          type="button"
          onClick={() => setSeccionActiva('PRORRATEO')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center space-x-2 cursor-pointer ${
            seccionActiva === 'PRORRATEO'
              ? 'bg-emerald-800 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <PieChart className="w-4 h-4 text-emerald-300" />
          <span>⚙️ Reglas de Prorrateo Corporativo ({estancias.length} Campos)</span>
        </button>
      </div>

      {seccionActiva === 'PRORRATEO' ? (
        <section aria-label="Reglas de Prorrateo Corporativo" className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <PieChart className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                <span>Prorrateo Predeterminado de Costos Generales</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Define cómo se reparten automáticamente los sueldos y costos fijos corporativos entre tus campos.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAutoCalcularHectareas}
              className="inline-flex items-center space-x-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-950 font-black text-xs px-4 py-2.5 rounded-xl border border-emerald-300 shadow-sm cursor-pointer transition-all active:scale-95 min-h-[42px]"
            >
              <Wand2 className="w-4 h-4 text-emerald-700" />
              <span>🪄 Autocalcular por Hectáreas Totales</span>
            </button>
          </div>

          {/* Grilla de Campos y Sliders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {estancias.map((est) => {
              const pctActual = localReglas[est.id] || 0;
              return (
                <div key={est.id} className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-black text-slate-900">{est.nombre}</p>
                        <p className="text-[10px] text-slate-500 font-bold">{est.hectareas_totales} Hectáreas Totales</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 bg-white px-3 py-1.5 rounded-xl border border-slate-300">
                      <Percent className="w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={pctActual}
                        onChange={(e) => {
                          const val = Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0));
                          setLocalReglas({ ...localReglas, [est.id]: val });
                        }}
                        className="w-12 text-center text-xs font-black text-slate-900 focus:outline-none"
                      />
                      <span className="text-xs font-extrabold text-slate-500">%</span>
                    </div>
                  </div>

                  {/* Slider de Porcentaje Táctil */}
                  <div className="space-y-1">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={pctActual}
                      onChange={(e) => {
                        setLocalReglas({ ...localReglas, [est.id]: parseInt(e.target.value, 10) });
                      }}
                      className="w-full accent-emerald-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Suma Total y Guardado */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3 text-xs">
              <Building2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div>
                <p className="font-extrabold">Distribución Total Asignada: <span className={sumaPorcentajes === 100 ? 'text-emerald-400 font-black' : 'text-amber-400 font-black'}>{sumaPorcentajes}%</span></p>
                <p className="text-[11px] text-slate-300">
                  {sumaPorcentajes === 100 ? '✓ Suma 100% correcta entre los campos' : '⚠️ La suma de porcentajes debe dar 100%'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGuardarProrrateo}
              className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-extrabold text-xs px-6 py-3.5 rounded-xl shadow-lg cursor-pointer transition-all active:scale-95 flex items-center justify-center space-x-2 min-h-[44px]"
            >
              <Check className="w-4 h-4 text-white" />
              <span>Guardar Reglas de Prorrateo</span>
            </button>
          </div>
        </section>
      ) : (
        <>
          {/* Banner Principal de Configuración de Rubros */}
          <section aria-label="Encabezado del Configurado de Rubros" className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                  <Settings className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                  <span>Configurador de Rubros Financieros</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Administra qué rubros (Plan Agropecuario o Personalizados) están activos y sus clasificaciones.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
                <span className="text-xs font-extrabold text-emerald-900 bg-emerald-100 px-3 py-2 rounded-xl border border-emerald-200">
                  {conceptosActivosIds.length} Rubros Habilitados
                </span>

                <button
                  type="button"
                  onClick={() => setModalNuevoAbierto(true)}
                  className="inline-flex items-center space-x-1.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-extrabold text-xs px-3.5 py-2.5 rounded-xl shadow-md cursor-pointer transition-all active:scale-95 min-h-[38px]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Crear Rubro Personalizado</span>
                </button>
              </div>
            </div>

        {/* Filtros por Tipo y Barra de Búsqueda */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-1">
          
          {/* Selector de Tipo (TODOS | INGRESOS | EGRESOS) */}
          <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto">
            <button
              type="button"
              onClick={() => setTipoFiltro('TODOS')}
              className={`flex-1 md:flex-initial px-3.5 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                tipoFiltro === 'TODOS'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Todos ({catalog.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setTipoFiltro('INGRESO')}
              className={`flex-1 md:flex-initial px-3.5 py-2 rounded-lg text-xs font-black flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                tipoFiltro === 'INGRESO'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Ingresos ({totalActivosIngresos})</span>
            </button>

            <button
              type="button"
              onClick={() => setTipoFiltro('EGRESO')}
              className={`flex-1 md:flex-initial px-3.5 py-2 rounded-lg text-xs font-black flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                tipoFiltro === 'EGRESO'
                  ? 'bg-rose-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Egresos ({totalActivosEgresos})</span>
            </button>
          </div>

          {/* Buscador por Nombre de Rubro */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar rubro (ej: vacunos, lana, fletes...)"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[40px]"
            />
          </div>

        </div>
      </section>

      {/* Grid Completo de Grupos de Rubros */}
      <div className="space-y-6">
        {gruposRepresentados.length > 0 ? (
          gruposRepresentados.map((grupoNombre) => {
            const conceptosDelGrupo = conceptosFiltrados.filter((c) => c.grupo === grupoNombre);
            const activosEnGrupo = conceptosDelGrupo.filter((c) => conceptosActivosIds.includes(c.id)).length;
            const todosActivos = activosEnGrupo === conceptosDelGrupo.length;
            const esIngreso = conceptosDelGrupo[0]?.tipo === 'INGRESO';

            return (
              <section key={grupoNombre} className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-4">
                
                {/* Header del Grupo */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2.5">
                    <div className={`p-1.5 rounded-lg ${esIngreso ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                        <span>{grupoNombre}</span>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                          esIngreso ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}>
                          {esIngreso ? 'ENTRADAS' : 'SALIDAS'}
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {activosEnGrupo} de {conceptosDelGrupo.length} rubros habilitados en este grupo
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => activarTodosGrupo(grupoNombre, !todosActivos)}
                    className="text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl border border-slate-200 transition-all cursor-pointer active:scale-95"
                  >
                    {todosActivos ? 'Desactivar Todos' : 'Activar Todos'}
                  </button>
                </div>

                {/* Cards de Rubros dentro del Grupo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {conceptosDelGrupo.map((concepto) => {
                    const esActivo = conceptosActivosIds.includes(concepto.id);
                    return (
                      <div
                        key={concepto.id}
                        onClick={() => toggleConcepto(concepto.id)}
                        className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all duration-200 cursor-pointer active:scale-98 select-none ${
                          esActivo
                            ? concepto.tipo === 'INGRESO'
                              ? 'bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 text-white border-emerald-600 shadow-md ring-1 ring-emerald-500/40'
                              : 'bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950 text-white border-rose-600 shadow-md ring-1 ring-rose-500/40'
                            : 'bg-slate-50/80 hover:bg-slate-100 border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center space-x-3 truncate">
                          <span className="text-xl flex-shrink-0">{concepto.icono}</span>
                          <div className="truncate">
                            <span className={`block text-xs font-black truncate ${esActivo ? 'text-white' : 'text-slate-900'}`}>
                              {concepto.nombre}
                            </span>
                            <div className="flex items-center gap-1 mt-1 flex-wrap">
                              {concepto.naturaleza_costo && (
                                <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${
                                  concepto.naturaleza_costo === 'FIJO'
                                    ? esActivo ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40' : 'bg-amber-100 text-amber-900'
                                    : esActivo ? 'bg-blue-400/20 text-blue-300 border border-blue-400/40' : 'bg-blue-100 text-blue-900'
                                }`}>
                                  {concepto.naturaleza_costo === 'FIJO' ? 'Costo Fijo' : 'Costo Var.'}
                                </span>
                              )}
                              {concepto.es_recurrente_mensual && (
                                <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${
                                  esActivo ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/40' : 'bg-emerald-100 text-emerald-900'
                                }`}>
                                  Recurrente
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex-shrink-0 ml-2">
                          {esActivo ? (
                            <CheckCircle2 className={`w-5 h-5 ${concepto.tipo === 'INGRESO' ? 'text-emerald-400' : 'text-rose-400'}`} />
                          ) : (
                            <XCircle className="w-5 h-5 text-slate-300" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

              </section>
            );
          })
        ) : (
          <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm text-center space-y-2">
            <SlidersHorizontal className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs font-bold text-slate-700">No se encontraron rubros con esa búsqueda</p>
            <p className="text-xs text-slate-500">Prueba ajustando los filtros o borrando el texto del buscador.</p>
          </div>
        )}
      </div>

      {/* Barra de Guardado Sincronizado Inferior */}
      <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3 text-xs">
          <Sparkles className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div>
            <p className="font-extrabold text-white">Configuración del Sistema de Caja</p>
            <p className="text-slate-300 text-[11px] mt-0.5">
              Los rubros seleccionados se actualizarán automáticamente en los formularios de registro de caja de toda la empresa.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGuardarEnSupabase}
          disabled={guardando}
          className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-extrabold text-xs px-6 py-3.5 rounded-xl shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center space-x-2 cursor-pointer min-h-[44px]"
        >
          {guardando ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Sincronizando con Supabase...</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4 text-white" />
              <span>Guardar Selección de Rubros en Supabase</span>
            </>
          )}
        </button>
      </div>
      </>
      )}

      {/* Modal Dialog para Crear Rubro Personalizado */}
      {modalNuevoAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            
            <header className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-emerald-600 rounded-xl text-white">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Crear Rubro Personalizado</h3>
                  <p className="text-xs text-slate-300">Nuevo concepto financiero para la empresa</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalNuevoAbierto(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            <form onSubmit={handleCrearRubroPersonalizado} className="p-4 sm:p-5 space-y-4 text-xs">
              
              {/* Tipo: INGRESO / EGRESO */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Tipo de Rubro</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNuevoTipo('INGRESO')}
                    className={`p-2.5 rounded-xl border text-xs font-black flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                      nuevoTipo === 'INGRESO'
                        ? 'bg-emerald-100 text-emerald-950 border-emerald-500 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span>INGRESO</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNuevoTipo('EGRESO')}
                    className={`p-2.5 rounded-xl border text-xs font-black flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                      nuevoTipo === 'EGRESO'
                        ? 'bg-rose-100 text-rose-950 border-rose-500 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    <TrendingDown className="w-4 h-4 text-rose-600" />
                    <span>EGRESO</span>
                  </button>
                </div>
              </div>

              {/* Nombre del Rubro */}
              <div className="space-y-1">
                <label className="font-extrabold text-slate-700 block">Nombre del Rubro</label>
                <input
                  type="text"
                  required
                  placeholder="ej: Alquiler Galpón Salto, Honorarios Genética..."
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
                />
              </div>

              {/* Grupo / Categoría */}
              <div className="space-y-1">
                <label className="font-extrabold text-slate-700 block">Grupo de Pertenencia</label>
                <input
                  type="text"
                  placeholder="ej: Gastos de Administración, Servicios Contratados, Inversiones..."
                  value={nuevoGrupo}
                  onChange={(e) => setNuevoGrupo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
                />
              </div>

              {/* Naturaleza del Costo (Solo si es EGRESO) */}
              {nuevoTipo === 'EGRESO' && (
                <>
                  <div className="space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                    <label className="font-extrabold text-slate-700 block text-[11px]">
                      Naturaleza Predeterminada del Costo:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setNuevaNaturaleza('FIJO')}
                        className={`p-2.5 rounded-xl border text-xs font-black flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                          nuevaNaturaleza === 'FIJO'
                            ? 'bg-amber-950 text-amber-300 border-amber-600 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200'
                        }`}
                      >
                        <span>📌 Costo Fijo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setNuevaNaturaleza('VARIABLE')}
                        className={`p-2.5 rounded-xl border text-xs font-black flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                          nuevaNaturaleza === 'VARIABLE'
                            ? 'bg-blue-950 text-blue-300 border-blue-600 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200'
                        }`}
                      >
                        <span>📈 Costo Variable</span>
                      </button>
                    </div>
                  </div>

                  {/* Checkbox Recurrente Mensual */}
                  <label className="flex items-center space-x-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={nuevoRecurrente}
                      onChange={(e) => setNuevoRecurrente(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="font-extrabold text-slate-700 text-xs">Es un costo recurrente todos los meses</span>
                  </label>
                </>
              )}

              {/* Selector de Ícono Rápido */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Ícono Distintivo</label>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {['📋', '🩺', '🚜', '🏡', '💵', '🛡️', '💧', '🌾', '🤝', '⚡', '📦', '👤'].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setNuevoIcono(emoji)}
                      className={`text-lg p-2 rounded-xl border transition-all cursor-pointer ${
                        nuevoIcono === emoji ? 'bg-emerald-100 border-emerald-500 scale-110' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 min-h-[46px] cursor-pointer mt-3"
              >
                <Check className="w-4 h-4 text-white" />
                <span>Guardar Nuevo Rubro</span>
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
