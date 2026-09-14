import React, { useState } from 'react';
import { useEstanciasStore } from '../../stores/useEstanciasStore';
import { useGanadoStore } from '../../stores/useGanadoStore';
import { useToastStore } from '../../stores/useToastStore';
import { CustomSelect, type SelectOption } from '../ui/CustomSelect';
import type { EspecieGanado, CategoriaVacuno, CategoriaOvino } from '../../types';
import {
  X,
  Truck,
  Check,
  MapPin,
  Calendar,
  Tag,
  Info
} from 'lucide-react';

interface TrasladoGanadoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIAS_VACUNAS: CategoriaVacuno[] = [
  'VACAS_DE_CRIA',
  'VAQUILLONAS_1_2',
  'VAQUILLONAS_MAS_2',
  'NOVILLOS_1_2',
  'NOVILLOS_MAS_2',
  'TERNEROS',
  'TERNERAS',
  'TOROS'
];

const CATEGORIAS_OVINAS: CategoriaOvino[] = [
  'OVEJAS_CRIA',
  'CAPONES',
  'CORDEROS_AS',
  'CARNEROS'
];

export const TrasladoGanadoModal: React.FC<TrasladoGanadoModalProps> = ({ isOpen, onClose }) => {
  const { estancias, obtenerEstanciaActual } = useEstanciasStore();
  const { registrarMovimiento } = useGanadoStore();
  const { mostrarToast } = useToastStore();

  const estanciaActual = obtenerEstanciaActual();

  const [origenId, setOrigenId] = useState<string>(
    estanciaActual?.id || (estancias[0]?.id ?? 'est-1')
  );
  const [destinoId, setDestinoId] = useState<string>(
    estancias.find((e) => e.id !== origenId)?.id || 'est-2'
  );

  const [especie, setEspecie] = useState<EspecieGanado>('VACUNO');
  const [categoria, setCategoria] = useState<string>('TERNEROS');
  const [cabezas, setCabezas] = useState<string>('20');
  const [kilosPromedio, setKilosPromedio] = useState<string>('160');
  const [fecha, setFecha] = useState<string>(new Date().toISOString().split('T')[0]);
  const [observaciones, setObservaciones] = useState<string>('');

  // Imputación económica
  const [valorizar, setValorizar] = useState<boolean>(true);
  const [precioCabeza, setPrecioCabeza] = useState<string>('350');

  if (!isOpen) return null;

  const numCabezas = parseInt(cabezas, 10) || 0;
  const numKilosProm = parseFloat(kilosPromedio) || 0;
  const numPrecioCab = parseFloat(precioCabeza) || 0;
  const totalKilos = numCabezas * numKilosProm;
  const totalImputado = valorizar ? numCabezas * numPrecioCab : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (origenId === destinoId) {
      mostrarToast('Error de Validación', 'El establecimiento de origen y destino deben ser distintos.', 'ERROR');
      return;
    }

    if (numCabezas <= 0) {
      mostrarToast('Error de Validación', 'Ingresa una cantidad de cabezas válida mayor a 0.', 'ERROR');
      return;
    }

    const estanciaOrigenNom = estancias.find((e) => e.id === origenId)?.nombre || 'Origen';
    const estanciaDestinoNom = estancias.find((e) => e.id === destinoId)?.nombre || 'Destino';

    registrarMovimiento({
      estancia_origen_id: origenId,
      estancia_destino_id: destinoId,
      especie,
      categoria: categoria as CategoriaVacuno | CategoriaOvino,
      cabezas: numCabezas,
      kilos_promedio: numKilosProm > 0 ? numKilosProm : undefined,
      kilos_totales: totalKilos > 0 ? totalKilos : undefined,
      fecha,
      observaciones: observaciones || `Traslado de ${numCabezas} ${categoria} de ${estanciaOrigenNom} a ${estanciaDestinoNom}`,
      valorizar_transferencia: valorizar,
      precio_por_cabeza: valorizar ? numPrecioCab : undefined,
      precio_por_kilo: (valorizar && numKilosProm > 0) ? numPrecioCab / numKilosProm : undefined,
      monto_total_imputado: totalImputado,
    });

    mostrarToast(
      'Traslado Registrado',
      `Se trasladaron ${numCabezas} cabezas de ${estanciaOrigenNom} a ${estanciaDestinoNom}${
        valorizar ? ` (Imputación: USD ${totalImputado.toLocaleString()})` : ''
      }`,
      'EXITO'
    );

    onClose();
  };

  const origenOptions: SelectOption[] = estancias.map((e) => ({
    value: e.id,
    label: e.nombre,
    badge: `${e.hectareas_totales} Ha`,
  }));

  const destinoOptions: SelectOption[] = estancias.map((e) => ({
    value: e.id,
    label: `${e.nombre}${e.id === origenId ? ' (Origen)' : ''}`,
    badge: `${e.hectareas_totales} Ha`,
    disabled: e.id === origenId,
  }));

  const categoriaOptions: SelectOption[] = (
    especie === 'VACUNO' ? CATEGORIAS_VACUNAS : CATEGORIAS_OVINAS
  ).map((c) => ({
    value: c,
    label: c.replace(/_/g, ' '),
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Cabecera Modal */}
        <header className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-2xl text-white shadow-md">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Traslado de Ganado entre Campos</h3>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                Movimiento físico de stock e imputación de valor económico
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          
          {/* Origen y Destino */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
            <div>
              <CustomSelect
                label="Origen (Sale):"
                value={origenId}
                options={origenOptions}
                onChange={(val) => setOrigenId(val)}
                icon={<MapPin className="w-3.5 h-3.5 text-rose-600" />}
              />
            </div>

            <div>
              <CustomSelect
                label="Destino (Entra):"
                value={destinoId}
                options={destinoOptions}
                onChange={(val) => setDestinoId(val)}
                icon={<MapPin className="w-3.5 h-3.5 text-emerald-600" />}
              />
            </div>
          </div>

          {/* Especie y Categoría */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-extrabold text-slate-700 block text-[10px] uppercase tracking-wider">Especie</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setEspecie('VACUNO');
                    setCategoria('TERNEROS');
                  }}
                  className={`p-2 rounded-xl text-xs font-black border transition-all cursor-pointer min-h-[42px] ${
                    especie === 'VACUNO' ? 'bg-emerald-900 text-white border-emerald-700' : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  🐮 Vacunos
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEspecie('OVINO');
                    setCategoria('OVEJAS_CRIA');
                  }}
                  className={`p-2 rounded-xl text-xs font-black border transition-all cursor-pointer min-h-[42px] ${
                    especie === 'OVINO' ? 'bg-amber-900 text-white border-amber-700' : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  🐑 Ovinos
                </button>
              </div>
            </div>

            <div>
              <CustomSelect
                label="Categoría:"
                value={categoria}
                options={categoriaOptions}
                onChange={(val) => setCategoria(val)}
              />
            </div>
          </div>

          {/* Cabezas y Kilos */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-extrabold text-slate-700 block">Cantidad de Cabezas</label>
              <input
                type="number"
                required
                min="1"
                value={cabezas}
                onChange={(e) => setCabezas(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm font-black rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 min-h-[42px]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-extrabold text-slate-700 block">Kilos Promedio (kg/cab)</label>
              <input
                type="number"
                step="0.1"
                placeholder="ej: 160"
                value={kilosPromedio}
                onChange={(e) => setKilosPromedio(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm font-black rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 min-h-[42px]"
              />
            </div>
          </div>

          {/* Bloque de Imputación Económica Interna */}
          <div className="space-y-3 bg-emerald-50/70 border border-emerald-200/90 p-4 rounded-2xl">
            <label className="flex items-center space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={valorizar}
                onChange={(e) => setValorizar(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
              />
              <span className="font-extrabold text-emerald-950 text-xs flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-emerald-700" />
                <span>Imputar Valor Económico Interno (Rentabilidad por Campo)</span>
              </span>
            </label>

            {valorizar && (
              <div className="space-y-3 pt-1 border-t border-emerald-200">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-emerald-900 block text-[11px]">Precio / Cabeza (USD)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-emerald-700 text-xs">$ US</span>
                      <input
                        type="number"
                        step="0.01"
                        required={valorizar}
                        value={precioCabeza}
                        onChange={(e) => setPrecioCabeza(e.target.value)}
                        className="w-full bg-white border border-emerald-300 text-emerald-950 font-black text-xs rounded-xl pl-12 pr-3 py-2.5 focus:ring-2 focus:ring-emerald-500 min-h-[40px]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-emerald-900 block text-[11px]">Monto Imputado Total</label>
                    <div className="p-2.5 bg-emerald-900 text-emerald-100 rounded-xl text-xs font-black flex items-center justify-between min-h-[40px]">
                      <span>Total:</span>
                      <span className="text-sm text-white">USD {totalImputado.toLocaleString('es-UY')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-2 text-[10px] text-emerald-800 bg-white/80 p-2.5 rounded-xl border border-emerald-200">
                  <Info className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <p>
                    Se acreditará <strong>+USD {totalImputado.toLocaleString()}</strong> a la estancia origen y se debitará a la destino. A nivel empresa el neto es USD 0.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Fecha y Observaciones */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Fecha del Traslado</span>
              </label>
              <input
                type="date"
                required
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 min-h-[40px]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Observaciones / Detalle</label>
              <input
                type="text"
                placeholder="ej: Destete de otoño, remesa 1"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 min-h-[40px]"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 min-h-[46px] cursor-pointer mt-2"
          >
            <Check className="w-4 h-4 text-white" />
            <span>Guardar Traslado y Actualizar Stocks</span>
          </button>

        </form>
      </div>
    </div>
  );
};
