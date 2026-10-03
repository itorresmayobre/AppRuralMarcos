import React, { useState, useEffect } from 'react';
import { useGanadoStore } from '../../stores/useGanadoStore';
import { useEstanciasStore } from '../../stores/useEstanciasStore';
import { supabase } from '../../services/supabase';
import { CustomSelect } from '../ui/CustomSelect';
import type { EspecieGanado } from '../../types';

interface RecategorizarGanadoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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

export const RecategorizarGanadoModal: React.FC<RecategorizarGanadoModalProps> = ({ isOpen, onClose }) => {
  const { estancias } = useEstanciasStore();
  const { stockList, registrarMovimiento } = useGanadoStore();

  const [categoriasBD, setCategoriasBD] = useState<{ especie: string; categoria: string; descripcion?: string }[]>([]);
  const [estanciaId, setEstanciaId] = useState<string>('');
  const [especie, setEspecie] = useState<EspecieGanado>('VACUNO');
  const [categoriaOrigen, setCategoriaOrigen] = useState<string>('TERNEROS');
  const [categoriaDestino, setCategoriaDestino] = useState<string>('NOVILLOS_1_2');
  const [cabezas, setCabezas] = useState<string>('1');
  const [kilosPromedio, setKilosPromedio] = useState<string>('');
  const [fecha, setFecha] = useState<string>(new Date().toISOString().split('T')[0]);
  const [observaciones, setObservaciones] = useState<string>('');
  const [guardando, setGuardando] = useState<boolean>(false);

  // Cargar categorías dinámicas desde Supabase
  useEffect(() => {
    const cargarCatBD = async () => {
      try {
        const { data } = await supabase
          .from('configuracion_equivalencias_ug')
          .select('especie, categoria, descripcion');
        if (data && data.length > 0) {
          setCategoriasBD(data);
        }
      } catch (e) {
        console.warn('Error al cargar categorías para recategorización:', e);
      }
    };
    cargarCatBD();
  }, []);

  // Inicializar estancia por defecto
  useEffect(() => {
    if (estancias.length > 0 && !estanciaId) {
      setEstanciaId(estancias[0].id);
    }
  }, [estancias, estanciaId]);

  // Stock disponible en la categoría de origen
  const stockOrigenActual = stockList.find(
    (s) => s.estancia_id === estanciaId && s.especie === especie && s.categoria === categoriaOrigen
  );

  // Pre-llenar kilos promedio según el stock de origen
  useEffect(() => {
    if (stockOrigenActual?.kilos_promedio) {
      setKilosPromedio(stockOrigenActual.kilos_promedio.toString());
    }
  }, [stockOrigenActual]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numCab = parseInt(cabezas) || 0;
    if (!estanciaId || numCab <= 0 || categoriaOrigen === categoriaDestino) return;

    setGuardando(true);
    try {
      const numKgProm = parseFloat(kilosPromedio) || undefined;
      const numKgTot = numKgProm ? numKgProm * numCab : undefined;

      await registrarMovimiento({
        tipo_movimiento: 'CAMBIO_CATEGORIA',
        estancia_origen_id: estanciaId,
        estancia_destino_id: estanciaId,
        especie,
        categoria: categoriaOrigen as any,
        categoria_destino: categoriaDestino as any,
        cabezas: numCab,
        kilos_promedio: numKgProm,
        kilos_totales: numKgTot,
        fecha,
        observaciones: observaciones || `Recategorización de ${categoriaOrigen.replace(/_/g, ' ')} a ${categoriaDestino.replace(/_/g, ' ')}`,
        monto_total_imputado: 0,
      });

      onClose();
    } catch (err) {
      console.error('Error registrando recategorización:', err);
    } finally {
      setGuardando(false);
    }
  };

  if (!isOpen) return null;

  const estanciaOptions = estancias.map((e) => ({ value: e.id, label: e.nombre }));
  const especieOptions = [
    { value: 'VACUNO', label: 'Vacunos' },
    { value: 'OVINO', label: 'Ovinos' },
  ];

  const catsEspecie = categoriasBD.filter((c) => c.especie === especie);
  const opcionesCategorias = catsEspecie.length > 0
    ? catsEspecie.map((c) => ({
        value: c.categoria,
        label: c.descripcion || c.categoria.replace(/_/g, ' '),
      }))
    : especie === 'VACUNO' ? FALLBACK_VACUNAS : FALLBACK_OVINAS;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-300 shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        
        {/* Cabecera Sobria y Clara */}
        <header className="bg-slate-800 text-white px-5 py-4 flex items-center justify-between border-b border-slate-700">
          <div>
            <h3 className="text-sm font-bold text-white">Recategorizar Ganado</h3>
            <p className="text-xs text-slate-300">Cambio de categoría por crecimiento o función</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white text-base px-2 py-1 rounded cursor-pointer"
          >
            ✕
          </button>
        </header>

        {/* Formulario Práctico y Limpio */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs text-slate-800">
          
          {/* Estancia */}
          <div>
            <CustomSelect
              label="Campo / Establecimiento"
              value={estanciaId}
              options={estanciaOptions}
              onChange={(val) => setEstanciaId(val)}
            />
          </div>

          {/* Especie */}
          <div>
            <CustomSelect
              label="Especie"
              value={especie}
              options={especieOptions}
              onChange={(val) => {
                const nEsp = val as EspecieGanado;
                setEspecie(nEsp);
                setCategoriaOrigen(nEsp === 'VACUNO' ? 'TERNEROS' : 'CORDEROS_AS');
                setCategoriaDestino(nEsp === 'VACUNO' ? 'NOVILLOS_1_2' : 'OVEJAS_CRIA');
              }}
            />
          </div>

          {/* Categoría Origen y Destino */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <CustomSelect
                label="Categoría Actual (Sale)"
                value={categoriaOrigen}
                options={opcionesCategorias}
                onChange={(val) => setCategoriaOrigen(val)}
              />
            </div>

            <div>
              <CustomSelect
                label="Categoría Nueva (Entra)"
                value={categoriaDestino}
                options={opcionesCategorias}
                onChange={(val) => setCategoriaDestino(val)}
              />
            </div>
          </div>

          {/* Indicador de Stock Origen Disponible */}
          <div className="bg-slate-100 p-2.5 rounded-lg flex items-center justify-between text-[11px]">
            <span className="text-slate-600">Stock disponible en la categoría actual:</span>
            <span className="font-bold text-slate-900">
              {stockOrigenActual ? `${stockOrigenActual.cabezas} cabezas` : '0 cabezas'}
            </span>
          </div>

          {/* Cabezas y Kilos */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="recat-cabezas" className="font-bold block mb-1">Cabezas a Recategorizar *</label>
              <input
                id="recat-cabezas"
                type="number"
                min="1"
                max={stockOrigenActual?.cabezas || 9999}
                value={cabezas}
                onChange={(e) => setCabezas(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-900 outline-none focus:border-slate-500"
                required
              />
            </div>

            <div>
              <label htmlFor="recat-kg" className="font-bold block mb-1">Peso Promedio (kg/cab)</label>
              <input
                id="recat-kg"
                type="number"
                step="0.5"
                placeholder="Opcional"
                value={kilosPromedio}
                onChange={(e) => setKilosPromedio(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium text-slate-900 outline-none focus:border-slate-500"
              />
            </div>
          </div>

          {/* Fecha */}
          <div>
            <label htmlFor="recat-fecha" className="font-bold block mb-1">Fecha</label>
            <input
              id="recat-fecha"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium outline-none focus:border-slate-500"
            />
          </div>

          {/* Observaciones */}
          <div>
            <label htmlFor="recat-obs" className="font-bold block mb-1">Observaciones (Opcional)</label>
            <input
              id="recat-obs"
              type="text"
              placeholder="Ej. Cambio de ejercicio agrícola, entore, etc."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 outline-none focus:border-slate-500"
            />
          </div>

          {/* Acciones */}
          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-100 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando || !estanciaId || parseInt(cabezas) <= 0 || categoriaOrigen === categoriaDestino}
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold cursor-pointer disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : 'Confirmar Recategorización'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
