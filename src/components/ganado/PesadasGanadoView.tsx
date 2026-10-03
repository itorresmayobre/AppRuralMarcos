import React, { useState, useEffect } from 'react';
import { useEstanciasStore } from '../../stores/useEstanciasStore';
import { usePesadasStore } from '../../stores/usePesadasStore';
import { useGanadoStore } from '../../stores/useGanadoStore';
import { useToastStore } from '../../stores/useToastStore';
import { supabase } from '../../services/supabase';
import { CustomSelect } from '../ui/CustomSelect';
import { GraficoEvolucionPesadasSVG } from './GraficoEvolucionPesadasSVG';
import { formatearFechaUY } from '../../utils/fechas';
import { Scale, Save, TrendingUp, Building2, Plus } from 'lucide-react';
import type { EspecieGanado } from '../../types';

const FALLBACK_VACUNAS = [
  { value: 'TERNEROS', label: 'Terneros' },
  { value: 'TERNERAS', label: 'Terneras' },
  { value: 'NOVILLOS_1_2', label: 'Novillos 1-2 años' },
  { value: 'NOVILLOS_MAS_2', label: 'Novillos +2 años' },
  { value: 'VAQUILLONAS_1_2', label: 'Vaquillonas 1-2 años' },
  { value: 'VAQUILLONAS_MAS_2', label: 'Vaquillonas +2 años' },
  { value: 'VACAS_DE_CRIA', label: 'Vacas de Cría' },
  { value: 'TOROS', label: 'Toros' },
];

const FALLBACK_OVINAS = [
  { value: 'CORDEROS_AS', label: 'Corderos/as' },
  { value: 'OVEJAS_CRIA', label: 'Ovejas de Cría' },
  { value: 'CAPONES', label: 'Capones' },
  { value: 'CARNEROS', label: 'Carneros' },
];

export const PesadasGanadoView: React.FC = () => {
  const { estancias, estanciaSeleccionadaId, seleccionarEstancia } = useEstanciasStore();
  const { cargarPesadasDesdeSupabase, registrarPesada, obtenerPesadasEstancia } = usePesadasStore();
  const { stockList, cargarGanadoDesdeSupabase: cargarStockBD } = useGanadoStore();
  const { mostrarToast } = useToastStore();

  const [categoriasBD, setCategoriasBD] = useState<{ especie: string; categoria: string; descripcion?: string }[]>([]);

  // Estados del Formulario Inline
  const [estanciaFormId, setEstanciaFormId] = useState<string>('');
  const [especie, setEspecie] = useState<EspecieGanado>('VACUNO');
  const [categoria, setCategoria] = useState<string>('TERNEROS');
  const [cabezas, setCabezas] = useState<string>('40');
  const [kilosPromedio, setKilosPromedio] = useState<string>('');
  const [kilosTotales, setKilosTotales] = useState<string>('');
  const [fecha, setFecha] = useState<string>(new Date().toISOString().split('T')[0]);
  const [observaciones, setObservaciones] = useState<string>('');
  const [guardando, setGuardando] = useState<boolean>(false);
  const [soloConStock, setSoloConStock] = useState<boolean>(true);

  // Cargar pesadas, stock y categorías dinámicas al montar
  useEffect(() => {
    cargarPesadasDesdeSupabase();
    cargarStockBD();

    const cargarCatBD = async () => {
      try {
        const { data } = await supabase
          .from('configuracion_equivalencias_ug')
          .select('especie, categoria, descripcion');
        if (data && data.length > 0) {
          setCategoriasBD(data);
        }
      } catch (e) {
        console.warn('Error cargando categorías para pesadas:', e);
      }
    };
    cargarCatBD();
  }, [cargarPesadasDesdeSupabase, cargarStockBD]);

  // Inicializar estancia por defecto
  useEffect(() => {
    if (estancias.length > 0 && !estanciaFormId) {
      setEstanciaFormId(estancias[0].id);
    }
  }, [estancias, estanciaFormId]);

  // Obtener stock del campo seleccionado para la especie actual
  const stockCampo = stockList.filter((s) => s.estancia_id === estanciaFormId && s.especie === especie);

  // Opciones de categorías dinámicas con stock
  const catsEspecie = categoriasBD.filter((c) => c.especie === especie);
  const baseCategorias = catsEspecie.length > 0
    ? catsEspecie.map((c) => ({
        value: c.categoria,
        label: c.descripcion || c.categoria.replace(/_/g, ' '),
      }))
    : especie === 'VACUNO' ? FALLBACK_VACUNAS : FALLBACK_OVINAS;

  const opcionesConStock = baseCategorias.map((c) => {
    const itemStock = stockCampo.find((s) => s.categoria === c.value);
    const cabezasStock = itemStock ? itemStock.cabezas : 0;
    return {
      ...c,
      cabezasStock,
      badge: `${cabezasStock} cab.`,
      badgeColor: cabezasStock > 0 ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold' : 'bg-slate-100 text-slate-500 border border-slate-200',
    };
  });

  // Filtrar categorías con stock > 0 si el toggle está activo
  const opcionesFiltradas = soloConStock
    ? opcionesConStock.filter((c) => c.cabezasStock > 0)
    : opcionesConStock;

  const opcionesCategorias = opcionesFiltradas.length > 0 ? opcionesFiltradas : opcionesConStock;

  // Auto-seleccionar categoría válida con stock si la seleccionada ya no aplica
  useEffect(() => {
    if (opcionesCategorias.length > 0) {
      const existe = opcionesCategorias.some((o) => o.value === categoria);
      if (!existe) {
        const primera = opcionesCategorias.find((o) => o.cabezasStock > 0) || opcionesCategorias[0];
        setCategoria(primera.value);
        if (primera.cabezasStock > 0) {
          setCabezas(primera.cabezasStock.toString());
        }
      }
    }
  }, [estanciaFormId, especie, soloConStock, opcionesCategorias, categoria]);

  // Stock disponible para la categoría actualmente seleccionada
  const stockDisponible = stockCampo.find((s) => s.categoria === categoria)?.cabezas || 0;

  // Handlers bidireccionales para kilos promedio y totales
  const handleCabezasChange = (val: string) => {
    setCabezas(val);
    const numCab = parseInt(val) || 0;
    const numProm = parseFloat(kilosPromedio) || 0;
    if (numCab > 0 && numProm > 0) {
      setKilosTotales(Math.round(numCab * numProm).toString());
    }
  };

  const handleKilosPromedioChange = (val: string) => {
    setKilosPromedio(val);
    const numCab = parseInt(cabezas) || 0;
    const numProm = parseFloat(val) || 0;
    if (numCab > 0 && numProm > 0) {
      setKilosTotales(Math.round(numCab * numProm).toString());
    }
  };

  const handleKilosTotalesChange = (val: string) => {
    setKilosTotales(val);
    const numCab = parseInt(cabezas) || 0;
    const numTot = parseFloat(val) || 0;
    if (numCab > 0 && numTot > 0) {
      setKilosPromedio((numTot / numCab).toFixed(1));
    }
  };

  const handleGuardarPesada = async (e: React.FormEvent) => {
    e.preventDefault();
    const numCab = parseInt(cabezas) || 0;
    const numKgProm = parseFloat(kilosPromedio) || 0;

    if (!estanciaFormId || numCab <= 0 || numKgProm <= 0) {
      mostrarToast('Ingresa datos válidos', 'Ingresa una estancia, cabezas y kilos válidos.', 'ADVERTENCIA');
      return;
    }

    setGuardando(true);
    try {
      const numKgTot = parseFloat(kilosTotales) || (numCab * numKgProm);

      await registrarPesada({
        estancia_id: estanciaFormId,
        especie,
        categoria,
        cabezas: numCab,
        kilos_promedio: numKgProm,
        kilos_totales: numKgTot,
        fecha,
        observaciones,
      });

      if (stockDisponible > 0 && numCab > stockDisponible) {
        mostrarToast(
          'Pesada Registrada con Observación',
          `Se registraron ${numCab} cab. (${numKgProm} kg/cab). Nota: La cantidad ingresada supera las ${stockDisponible} cab. registradas en stock.`,
          'ADVERTENCIA'
        );
      } else {
        mostrarToast('Pesada Registrada', `Se registraron ${numKgProm} kg/cab para ${numCab} cabezas de ${categoria.replace(/_/g, ' ')}.`, 'EXITO');
      }

      // Limpiar campos para la siguiente pesada rápida
      setKilosPromedio('');
      setKilosTotales('');
      setObservaciones('');
    } catch (err: any) {
      console.error('Error guardando pesada:', err);
      const msg = err?.message || 'No se pudo guardar la pesada por un error de permisos o base de datos.';
      mostrarToast('Error al Guardar', msg, 'ERROR');
    } finally {
      setGuardando(false);
    }
  };

  // Filtrar pesadas de la estancia seleccionada
  const pesadasActuales = obtenerPesadasEstancia(estanciaSeleccionadaId);

  const estanciaOptions = estancias.map((e) => ({ value: e.id, label: e.nombre }));
  const especieOptions = [
    { value: 'VACUNO', label: 'Vacunos' },
    { value: 'OVINO', label: 'Ovinos' },
  ];

  // Calcular la comparativa de peso y GDP (g/día) en la tabla
  const pesadasProcesadas = pesadasActuales.map((p, idx) => {
    // Buscar la pesada anterior de esta misma estancia + especie + categoría
    const pesadaAnterior = pesadasActuales.slice(idx + 1).find(
      (prev) => prev.estancia_id === p.estancia_id && prev.especie === p.especie && prev.categoria === p.categoria
    );

    let difKilos = 0;
    let gdpGramos = 0;
    let diasTranscurridos = 0;

    if (pesadaAnterior) {
      difKilos = p.kilos_promedio - pesadaAnterior.kilos_promedio;
      const dateActual = new Date(p.fecha).getTime();
      const datePrev = new Date(pesadaAnterior.fecha).getTime();
      diasTranscurridos = Math.max(1, Math.round((dateActual - datePrev) / (1000 * 60 * 60 * 24)));

      if (diasTranscurridos > 0) {
        gdpGramos = Math.round((difKilos * 1000) / diasTranscurridos);
      }
    }

    return {
      ...p,
      pesadaAnterior,
      difKilos,
      gdpGramos,
      diasTranscurridos,
    };
  });

  return (
    <section aria-label="Módulo de Pesadas de Ganado y Evolución de Kilos" className="space-y-4">
      
      {/* Cabecera del Módulo */}
      <header className="app-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Scale className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>Módulo de Pesadas de Ganado</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Registro histórico de peso promedio y ganancia diaria de peso (GDP en g/día)
          </p>
        </div>
      </header>

      {/* Formulario Rápido Inline */}
      <article className="app-card bg-white border border-slate-200 p-4 rounded-xl shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-2 gap-2">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-emerald-600" />
            <span>Registrar Pesada Rápida</span>
          </h3>

          <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={soloConStock}
              onChange={(e) => setSoloConStock(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <span>Mostrar sólo categorías con stock en este campo</span>
          </label>
        </div>

        <form onSubmit={handleGuardarPesada} className="space-y-3 text-xs">
          
          {/* Fila 1: Campo, Especie, Categoría */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <CustomSelect
                label="Campo / Establecimiento"
                value={estanciaFormId}
                options={estanciaOptions}
                onChange={(val) => setEstanciaFormId(val)}
                variant="light"
              />
            </div>

            <div>
              <CustomSelect
                label="Especie"
                value={especie}
                options={especieOptions}
                onChange={(val) => {
                  const nEsp = val as EspecieGanado;
                  setEspecie(nEsp);
                  setCategoria(nEsp === 'VACUNO' ? 'TERNEROS' : 'CORDEROS_AS');
                }}
                variant="light"
              />
            </div>

            <div>
              <CustomSelect
                label="Categoría"
                value={categoria}
                options={opcionesCategorias}
                onChange={(val) => setCategoria(val)}
                variant="light"
              />
            </div>
          </div>

          {/* Fila 2: Cabezas, Kg Promedio, Kg Totales, Fecha, Observaciones, Botón */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 items-end">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="pesada-cabezas" className="font-extrabold text-slate-600 block text-[11px]">Cabezas *</label>
                {stockDisponible > 0 && (
                  <span className="text-[10px] font-mono font-bold text-emerald-700">
                    Stock: {stockDisponible} cab.
                  </span>
                )}
              </div>
              <input
                id="pesada-cabezas"
                type="number"
                min="1"
                value={cabezas}
                onChange={(e) => handleCabezasChange(e.target.value)}
                className={`w-full bg-slate-50 border rounded-xl px-2.5 py-2 font-bold outline-none focus:ring-2 focus:bg-white ${
                  parseInt(cabezas) > stockDisponible && stockDisponible > 0
                    ? 'border-amber-500 text-amber-900 focus:ring-amber-500'
                    : 'border-slate-300 text-slate-900 focus:ring-emerald-500'
                }`}
                required
              />
              {parseInt(cabezas) > stockDisponible && stockDisponible > 0 && (
                <span className="text-[9px] font-bold text-amber-700 block mt-0.5">
                  ⚠️ Supera stock actual ({stockDisponible})
                </span>
              )}
            </div>

            <div>
              <label htmlFor="pesada-kg-prom" className="font-extrabold text-slate-600 block text-[11px] mb-1">Kg/Cab Promedio *</label>
              <input
                id="pesada-kg-prom"
                type="number"
                step="0.1"
                min="1"
                placeholder="ej: 180"
                value={kilosPromedio}
                onChange={(e) => handleKilosPromedioChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-emerald-800 font-extrabold rounded-xl px-2.5 py-2 outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                required
              />
            </div>

            <div>
              <label htmlFor="pesada-kg-tot" className="font-extrabold text-slate-600 block text-[11px] mb-1">Kg Totales</label>
              <input
                id="pesada-kg-tot"
                type="number"
                step="1"
                min="1"
                placeholder="ej: 7200"
                value={kilosTotales}
                onChange={(e) => handleKilosTotalesChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-bold rounded-xl px-2.5 py-2 outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            <div>
              <label htmlFor="pesada-fecha" className="font-extrabold text-slate-600 block text-[11px] mb-1">Fecha</label>
              <input
                id="pesada-fecha"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-2.5 py-2 font-bold outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            <div>
              <label htmlFor="pesada-obs" className="font-extrabold text-slate-600 block text-[11px] mb-1">Notas / Potrero</label>
              <input
                id="pesada-obs"
                type="text"
                placeholder="Opcional..."
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-2.5 py-2 outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={guardando || !estanciaFormId || !kilosPromedio}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold py-2 px-3 rounded-xl shadow-sm transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50 min-h-[38px] active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>{guardando ? 'Guardando...' : 'Guardar Pesada'}</span>
              </button>
            </div>
          </div>

        </form>
      </article>

      {/* Filtro por Establecimiento/Campo para Gráfica e Histórico */}
      <div className="app-card !p-3 space-y-2">
        <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
          Filtrar Gráfica e Histórico de Pesadas por Campo:
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
            <span>Todos los Campos</span>
          </button>

          {estancias.map((est) => (
            <button
              key={est.id}
              type="button"
              onClick={() => seleccionarEstancia(est.id)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[36px] cursor-pointer flex items-center gap-1.5 ${
                estanciaSeleccionadaId === est.id
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              <span>{est.nombre}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Gráfica de Evolución de Peso y GDP por Mes / Categoría */}
      <GraficoEvolucionPesadasSVG pesadas={pesadasActuales} />

      {/* Tabla de Histórico de Pesadas */}
      <div className="app-card !p-0 overflow-hidden">
        <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="app-section-title">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Histórico de Pesadas y Ganancia Diaria de Peso (GDP)</span>
            </h3>
            <p className="text-[11px] text-slate-500">Comparativa automática entre pesadas consecutivas por categoría</p>
          </div>
        </div>

        <div className="app-table-container !border-0 !rounded-none">
          <table className="app-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Campo</th>
                <th>Categoría Pesada</th>
                <th>Cabezas</th>
                <th>Kilos Promedio</th>
                <th>Kilos Totales</th>
                <th>Diferencia (Kg)</th>
                <th>Ganancia Diaria (GDP)</th>
                <th>Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {pesadasProcesadas.length > 0 ? (
                pesadasProcesadas.map((p) => {
                  const nombreCampo = estancias.find((e) => e.id === p.estancia_id)?.nombre || 'Campo';
                  return (
                    <tr key={p.id}>
                      <td className="text-slate-700 font-mono font-medium">
                        <time dateTime={p.fecha}>{formatearFechaUY(p.fecha)}</time>
                      </td>
                      <td className="font-bold text-slate-800">{nombreCampo}</td>
                      <td className="font-bold text-slate-900">
                        {p.categoria.replace(/_/g, ' ')} <span className="text-slate-500 font-normal">({p.especie})</span>
                      </td>
                      <td className="font-bold text-slate-800">{p.cabezas} cab.</td>
                      <td className="font-extrabold text-slate-950 text-sm">{p.kilos_promedio} kg/cab</td>
                      <td className="text-slate-600 font-medium">
                        {p.kilos_totales ? `${p.kilos_totales.toLocaleString('es-UY')} kg` : '-'}
                      </td>
                      <td>
                        {p.pesadaAnterior ? (
                          <span className={`inline-flex items-center gap-1 font-extrabold text-xs px-2 py-0.5 rounded-md ${
                            p.difKilos >= 0 
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
                              : 'bg-rose-100 text-rose-900 border border-rose-300'
                          }`}>
                            {p.difKilos >= 0 ? `+${p.difKilos.toFixed(1)} kg` : `${p.difKilos.toFixed(1)} kg`}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium text-xs">Pesada Inicial</span>
                        )}
                      </td>
                      <td>
                        {p.pesadaAnterior ? (
                          <span className={`inline-flex items-center gap-1 font-black text-xs px-2.5 py-0.5 rounded-md ${
                            p.gdpGramos >= 0
                              ? 'bg-slate-900 text-emerald-300'
                              : 'bg-rose-900 text-rose-200'
                          }`}>
                            {p.gdpGramos >= 0 ? `+${p.gdpGramos} g/día` : `${p.gdpGramos} g/día`}
                            <span className="text-[10px] text-slate-400 font-normal">({p.diasTranscurridos} días)</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium text-xs">-</span>
                        )}
                      </td>
                      <td className="text-slate-600 font-medium">{p.observaciones || '-'}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-slate-500">
                    No hay pesadas registradas. Utiliza el formulario superior para agregar la primera pesada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </section>
  );
};
