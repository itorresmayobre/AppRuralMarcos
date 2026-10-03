import React, { useState, useEffect } from 'react';
import { useGanadoStore } from '../../stores/useGanadoStore';
import { useEstanciasStore } from '../../stores/useEstanciasStore';
import { supabase } from '../../services/supabase';
import { CustomSelect } from '../ui/CustomSelect';
import { useCotizacionDolar } from '../../hooks/finanzas/useCotizacionDolar';
import type { EspecieGanado, Moneda } from '../../types';

interface MortandadGanadoModalProps {
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

const CAUSAS_COMUNES = [
  { value: 'Enfermedad / Bicho / Tristeza', label: 'Enfermedad / Bicho / Tristeza' },
  { value: 'Complicación en Parto', label: 'Complicación en Parto' },
  { value: 'Clima / Temporal / Frío', label: 'Clima / Temporal / Frío' },
  { value: 'Accidente / Depredador', label: 'Accidente / Depredador' },
  { value: 'Causas Naturales / Vejez', label: 'Causas Naturales / Vejez' },
  { value: 'Otra Causa / Sin especificar', label: 'Otra Causa / Sin especificar' },
];

export const MortandadGanadoModal: React.FC<MortandadGanadoModalProps> = ({ isOpen, onClose }) => {
  const { estancias } = useEstanciasStore();
  const { stockList, registrarMovimiento } = useGanadoStore();

  const [categoriasBD, setCategoriasBD] = useState<{ especie: string; categoria: string; descripcion?: string }[]>([]);
  const [estanciaId, setEstanciaId] = useState<string>('');
  const [especie, setEspecie] = useState<EspecieGanado>('VACUNO');
  const [categoria, setCategoria] = useState<string>('TERNEROS');
  const [cabezas, setCabezas] = useState<string>('1');
  const [kilosPromedio, setKilosPromedio] = useState<string>('0');
  const [kilosTotales, setKilosTotales] = useState<string>('0');
  
  // Cotización y Moneda
  const [fecha, setFecha] = useState<string>(new Date().toISOString().split('T')[0]);
  const { tipoCambio } = useCotizacionDolar(fecha);
  const [tcInput, setTcInput] = useState<string>('');
  const [moneda, setMoneda] = useState<Moneda>('USD');
  const [montoIngresado, setMontoIngresado] = useState<string>('');

  const [causaBaja, setCausaBaja] = useState<string>(CAUSAS_COMUNES[0].value);
  const [observaciones, setObservaciones] = useState<string>('');
  const [guardando, setGuardando] = useState<boolean>(false);

  // Actualizar cotización por defecto cuando cambia la fecha o la API responde
  useEffect(() => {
    if (tipoCambio > 0) {
      setTcInput(tipoCambio.toString());
    }
  }, [tipoCambio]);

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
        console.warn('No se pudieron cargar categorías dinámicas para mortandad:', e);
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

  // Buscar stock actual para autocompletar kilos promedio
  const stockActual = stockList.find(
    (s) => s.estancia_id === estanciaId && s.especie === especie && s.categoria === categoria
  );

  useEffect(() => {
    if (stockActual) {
      const kgProm = stockActual.kilos_promedio || 0;
      setKilosPromedio(kgProm > 0 ? kgProm.toString() : '0');
      const numCab = parseInt(cabezas) || 0;
      setKilosTotales((kgProm * numCab).toString());
    }
  }, [stockActual, especie, categoria]);

  // Recalcular kilos totales cuando cambia cabezas o kilos promedio
  const handleCabezasChange = (val: string) => {
    setCabezas(val);
    const numCab = parseInt(val) || 0;
    const numProm = parseFloat(kilosPromedio) || 0;
    setKilosTotales((numCab * numProm).toString());
  };

  const handleKilosPromedioChange = (val: string) => {
    setKilosPromedio(val);
    const numCab = parseInt(cabezas) || 0;
    const numProm = parseFloat(val) || 0;
    setKilosTotales((numCab * numProm).toString());
  };

  const handleKilosTotalesChange = (val: string) => {
    setKilosTotales(val);
    const numCab = parseInt(cabezas) || 0;
    const numTot = parseFloat(val) || 0;
    if (numCab > 0) {
      setKilosPromedio((numTot / numCab).toFixed(1));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numCabezas = parseInt(cabezas) || 0;
    if (!estanciaId || numCabezas <= 0) return;

    setGuardando(true);
    try {
      const numKgProm = parseFloat(kilosPromedio) || 0;
      const numKgTot = parseFloat(kilosTotales) || 0;
      const numMonto = parseFloat(montoIngresado) || 0;
      const numTC = parseFloat(tcInput) || tipoCambio || 40;

      const montoUsd = moneda === 'USD' ? numMonto : (numTC > 0 ? numMonto / numTC : 0);
      const montoUyu = moneda === 'UYU' ? numMonto : (numMonto * numTC);

      await registrarMovimiento({
        tipo_movimiento: 'MUERTE',
        estancia_origen_id: estanciaId,
        estancia_destino_id: null,
        especie,
        categoria: categoria as any,
        cabezas: numCabezas,
        kilos_promedio: numKgProm > 0 ? numKgProm : undefined,
        kilos_totales: numKgTot > 0 ? numKgTot : undefined,
        causa_baja: causaBaja,
        fecha,
        observaciones,
        moneda,
        monto_usd: montoUsd,
        monto_uyu: montoUyu,
        tipo_cambio: numTC,
        monto_total_imputado: montoUsd,
      });

      onClose();
    } catch (err) {
      console.error('Error registrando muerte:', err);
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
  const categoriaOptions = catsEspecie.length > 0
    ? catsEspecie.map((c) => ({
        value: c.categoria,
        label: c.descripcion || c.categoria.replace(/_/g, ' '),
      }))
    : especie === 'VACUNO' ? FALLBACK_VACUNAS : FALLBACK_OVINAS;

  const tcEfectivo = parseFloat(tcInput) || tipoCambio || 40;
  const numMontoVal = parseFloat(montoIngresado) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-300 shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        
        {/* Cabecera Sobria y Clara */}
        <header className="bg-slate-800 text-white px-5 py-4 flex items-center justify-between border-b border-slate-700">
          <div>
            <h3 className="text-sm font-bold text-white">Registrar Muertes de Ganado</h3>
            <p className="text-xs text-slate-300">Descuenta animales del stock y registra la pérdida en kilos y valor</p>
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
        <form onSubmit={handleSubmit} className="p-5 space-y-3 text-xs text-slate-800">
          
          {/* Estancia */}
          <div>
            <CustomSelect
              label="Campo / Establecimiento"
              value={estanciaId}
              options={estanciaOptions}
              onChange={(val) => setEstanciaId(val)}
            />
          </div>

          {/* Especie y Categoría */}
          <div className="grid grid-cols-2 gap-3">
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
              />
            </div>

            <div>
              <CustomSelect
                label="Categoría"
                value={categoria}
                options={categoriaOptions}
                onChange={(val) => setCategoria(val)}
              />
            </div>
          </div>

          {/* Banner de Stock Actual Disponible */}
          <div className="bg-slate-100 p-2.5 rounded-lg flex items-center justify-between text-[11px]">
            <span className="text-slate-600">Stock registrado en esta categoría:</span>
            <span className="font-bold text-slate-900">
              {stockActual ? `${stockActual.cabezas} cab. ${stockActual.kilos_promedio ? `(${stockActual.kilos_promedio} kg/cab)` : ''}` : '0 cabezas'}
            </span>
          </div>

          {/* Cabezas Muertas y Pesos */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label htmlFor="mort-cabezas" className="font-bold block mb-1">Cabezas *</label>
              <input
                id="mort-cabezas"
                type="number"
                min="1"
                max={stockActual?.cabezas || 9999}
                value={cabezas}
                onChange={(e) => handleCabezasChange(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-900 outline-none focus:border-slate-500"
                required
              />
            </div>

            <div>
              <label htmlFor="mort-kg-prom" className="font-bold block mb-1">Kg/Cab Prom.</label>
              <input
                id="mort-kg-prom"
                type="number"
                step="0.1"
                min="0"
                value={kilosPromedio}
                onChange={(e) => handleKilosPromedioChange(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium text-slate-900 outline-none focus:border-slate-500"
              />
            </div>

            <div>
              <label htmlFor="mort-kg-tot" className="font-bold block mb-1">Kg Totales</label>
              <input
                id="mort-kg-tot"
                type="number"
                step="1"
                min="0"
                value={kilosTotales}
                onChange={(e) => handleKilosTotalesChange(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium text-slate-900 outline-none focus:border-slate-500"
              />
            </div>
          </div>

          {/* Causa Principal */}
          <div>
            <CustomSelect
              label="Causa Principal de Muerte"
              value={causaBaja}
              options={CAUSAS_COMUNES}
              onChange={(val) => setCausaBaja(val)}
            />
          </div>

          {/* Valorización Económica (Multi-moneda USD / UYU) */}
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 text-xs">Valor Pérdida Estimada (Opcional)</label>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
                <span>TC USD/UYU:</span>
                <input
                  type="number"
                  step="0.05"
                  value={tcInput}
                  onChange={(e) => setTcInput(e.target.value)}
                  className="w-16 bg-white border border-slate-300 rounded px-1.5 py-0.5 font-bold text-slate-800 outline-none text-right focus:border-slate-500"
                />
              </div>
            </div>

            {/* Selector de Moneda */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMoneda('USD')}
                className={`py-1.5 px-3 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                  moneda === 'USD'
                    ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                💵 Dólares (USD)
              </button>
              <button
                type="button"
                onClick={() => setMoneda('UYU')}
                className={`py-1.5 px-3 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                  moneda === 'UYU'
                    ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                🇺🇾 Pesos (UYU)
              </button>
            </div>

            {/* Input de Monto */}
            <div className="relative">
              <span className="absolute left-2.5 top-2 text-slate-400 font-bold text-xs">
                {moneda === 'USD' ? '$' : '$U'}
              </span>
              <input
                id="mort-monto"
                type="number"
                step="0.01"
                min="0"
                placeholder="Ej: 450"
                value={montoIngresado}
                onChange={(e) => setMontoIngresado(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 pl-8 font-extrabold text-slate-900 outline-none focus:border-rose-500 text-xs"
              />
            </div>

            {/* Vista Previa de Conversión Automática */}
            {numMontoVal > 0 && (
              <div className="text-[11px] text-slate-600 font-medium flex justify-between bg-white px-2.5 py-1 rounded-md border border-slate-200">
                <span>Equivalente:</span>
                <span className="font-bold text-slate-900">
                  {moneda === 'USD'
                    ? `$U ${(numMontoVal * tcEfectivo).toLocaleString('es-UY', { maximumFractionDigits: 2 })} UYU`
                    : `USD $ ${(numMontoVal / (tcEfectivo || 1)).toLocaleString('es-UY', { maximumFractionDigits: 2 })}`}
                </span>
              </div>
            )}
          </div>

          {/* Fecha */}
          <div>
            <label htmlFor="mort-fecha" className="font-bold block mb-1">Fecha de la Muerte</label>
            <input
              id="mort-fecha"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium outline-none focus:border-slate-500"
            />
          </div>

          {/* Observaciones */}
          <div>
            <label htmlFor="mort-obs" className="font-bold block mb-1">Observaciones (Opcional)</label>
            <input
              id="mort-obs"
              type="text"
              placeholder="Detalles de potrero, síntomas..."
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
              disabled={guardando || !estanciaId || parseInt(cabezas) <= 0}
              className="px-4 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-bold cursor-pointer disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : 'Confirmar Registro de Muertes'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

