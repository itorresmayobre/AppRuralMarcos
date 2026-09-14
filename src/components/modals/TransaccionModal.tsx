import React, { useState } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useEstanciasStore } from '../../stores/useEstanciasStore';
import { useFinanzasStore } from '../../stores/useFinanzasStore';
import { useConceptosFinancierosStore } from '../../stores/useConceptosFinancierosStore';
import { useToastStore } from '../../stores/useToastStore';
import { calcularEjercicioYMesAgricola } from '../../utils/periodoAgricola';
import type { Moneda, TipoTransaccion } from '../../types';
import {
  X,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  MapPin,
  Calendar,
  Layers
} from 'lucide-react';

interface TransaccionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TransaccionModal: React.FC<TransaccionModalProps> = ({ isOpen, onClose }) => {
  const { usuario } = useAuthStore();
  const { estancias, obtenerEstanciaActual } = useEstanciasStore();
  const { agregarTransaccion } = useFinanzasStore();
  const { catalog, obtenerConceptosActivosPorTipo } = useConceptosFinancierosStore();
  const { mostrarToast } = useToastStore();

  const currentRole = usuario?.rol || 'OPERARIO';
  const puedeVerFinanzas = currentRole === 'ADMIN' || currentRole === 'CONTADOR';

  const estanciaActual = obtenerEstanciaActual();
  const [estanciaFormId, setEstanciaFormId] = useState<string>(
    estanciaActual?.id || (estancias[0]?.id ?? 'est-1')
  );

  const [tipoFinanciero, setTipoFinanciero] = useState<TipoTransaccion>('INGRESO');
  const [moneda, setMoneda] = useState<Moneda>('USD');
  const [monto, setMonto] = useState<string>('');

  const conceptosDisponibles = obtenerConceptosActivosPorTipo(tipoFinanciero);
  const [categoria, setCategoria] = useState<string>(conceptosDisponibles[0]?.nombre || 'Ventas de Hacienda');
  const [naturalezaCosto, setNaturalezaCosto] = useState<'FIJO' | 'VARIABLE'>(
    conceptosDisponibles[0]?.naturaleza_costo || 'VARIABLE'
  );
  const [descripcionFinanciera, setDescripcionFinanciera] = useState<string>('');
  const [fecha, setFecha] = useState<string>(new Date().toISOString().split('T')[0]);

  const { ejercicio: ejercicioAgricola, mes: mesAgricola } = calcularEjercicioYMesAgricola(fecha);

  if (!isOpen || !puedeVerFinanzas) return null;

  const handleSeleccionarCategoria = (conceptoItem: typeof catalog[0]) => {
    setCategoria(conceptoItem.nombre);
    if (conceptoItem.naturaleza_costo) {
      setNaturalezaCosto(conceptoItem.naturaleza_costo);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const valMonto = parseFloat(monto);

    if (isNaN(valMonto) || valMonto <= 0) {
      mostrarToast('Error de Validación', 'Por favor ingresa un monto válido mayor a 0', 'ERROR');
      return;
    }

    agregarTransaccion({
      estancia_id: estanciaFormId,
      tipo: tipoFinanciero,
      moneda,
      monto: valMonto,
      categoria: categoria || 'General',
      descripcion: descripcionFinanciera || `${tipoFinanciero === 'INGRESO' ? 'Ingreso' : 'Egreso'} financiero`,
      fecha,
      ejercicio_agricola: ejercicioAgricola,
      periodo_mes: mesAgricola,
      naturaleza_costo: tipoFinanciero === 'EGRESO' ? naturalezaCosto : undefined,
    });

    const nombreEstablecimiento = estancias.find(e => e.id === estanciaFormId)?.nombre || 'Establecimiento';
    mostrarToast(
      'Transacción Registrada',
      `${tipoFinanciero} por ${moneda} ${valMonto.toLocaleString()} (${mesAgricola} - Ej. ${ejercicioAgricola}) en ${nombreEstablecimiento}`,
      'EXITO'
    );

    setMonto('');
    setDescripcionFinanciera('');
    onClose();
  };

  // Agrupar conceptos activos disponibles por su Grupo del Plan Agropecuario
  const gruposMap: Record<string, typeof conceptosDisponibles> = {};
  conceptosDisponibles.forEach((c) => {
    if (!gruposMap[c.grupo]) gruposMap[c.grupo] = [];
    gruposMap[c.grupo].push(c);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Cabecera Exclusiva Transacciones */}
        <header className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-2xl flex-shrink-0 ${
              tipoFinanciero === 'INGRESO' ? 'bg-emerald-600 text-white shadow-md' : 'bg-rose-600 text-white shadow-md'
            }`}>
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-1.5">
                <span>Registrar Transacción Financiera</span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5 font-medium">
                Movimiento de Ingreso o Egreso de caja
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Selector de Establecimiento Destino */}
        <div className="p-3 bg-slate-50 border-b border-slate-200/80 space-y-1.5 flex-shrink-0">
          <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">Establecimiento Destino:</label>
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
            {estancias.map((est) => {
              const esSeleccionado = estanciaFormId === est.id;
              return (
                <button
                  key={est.id}
                  type="button"
                  onClick={() => setEstanciaFormId(est.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition-all cursor-pointer flex-shrink-0 border ${
                    esSeleccionado
                      ? 'bg-emerald-700 text-white border-emerald-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{est.nombre}</span>
                  {esSeleccionado && <Check className="w-3.5 h-3.5 ml-1 text-emerald-200 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Formulario Exclusivo de Finanzas */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-xs">

          {/* Selector Prominente Ingreso vs Egreso */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setTipoFinanciero('INGRESO');
                const activos = obtenerConceptosActivosPorTipo('INGRESO');
                if (activos.length > 0) setCategoria(activos[0].nombre);
              }}
              className={`p-3 rounded-2xl border font-extrabold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                tipoFinanciero === 'INGRESO'
                  ? 'bg-emerald-100 border-emerald-500 text-emerald-950 shadow-sm ring-2 ring-emerald-500/30'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ArrowUpRight className="w-4 h-4 text-emerald-600" />
              <span>INGRESO (Entrada US$)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTipoFinanciero('EGRESO');
                const activos = obtenerConceptosActivosPorTipo('EGRESO');
                if (activos.length > 0) setCategoria(activos[0].nombre);
              }}
              className={`p-3 rounded-2xl border font-extrabold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                tipoFinanciero === 'EGRESO'
                  ? 'bg-rose-100 border-rose-500 text-rose-950 shadow-sm ring-2 ring-rose-500/30'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ArrowDownRight className="w-4 h-4 text-rose-600" />
              <span>EGRESO (Salida US$)</span>
            </button>
          </div>

          {/* Selector de Moneda (USD / UYU) */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 block">Moneda de la Operación</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMoneda('USD')}
                className={`p-2.5 rounded-xl border text-xs font-black flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                  moneda === 'USD'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-700 shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>💵 Dólares (USD)</span>
              </button>

              <button
                type="button"
                onClick={() => setMoneda('UYU')}
                className={`p-2.5 rounded-xl border text-xs font-black flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                  moneda === 'UYU'
                    ? 'bg-blue-950 text-blue-300 border-blue-700 shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>🇺🇾 Pesos (UYU)</span>
              </button>
            </div>
          </div>

          {/* Monto Total */}
          <div className="space-y-1">
            <label className="font-extrabold text-slate-700 block">Monto Total ({moneda})</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-500">
                {moneda === 'USD' ? '$ US' : '$ UYU'}
              </span>
              <input
                type="number"
                step="0.01"
                required
                placeholder="ej: 14500"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm font-black rounded-xl pl-16 pr-4 py-3 focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
              />
            </div>
          </div>

          {/* Categorías / Rubros Habilitados por el Admin */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 block">Rubro / Concepto (Habilitados por Admin)</label>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                {conceptosDisponibles.length} disponibles
              </span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar p-1 border border-slate-200 rounded-2xl bg-slate-50/50">
              {Object.keys(gruposMap).map((grupo) => (
                <div key={grupo} className="space-y-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block px-1 pt-1 flex items-center gap-1">
                    <Layers className="w-3 h-3 text-slate-400" />
                    <span>{grupo}</span>
                  </span>

                  <div className="grid grid-cols-2 gap-1.5">
                    {gruposMap[grupo].map((item) => {
                      const esSeleccionado = categoria === item.nombre;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSeleccionarCategoria(item)}
                          className={`p-2 rounded-xl text-left text-[11px] font-bold border transition-all flex items-center justify-between space-x-1.5 cursor-pointer ${
                            esSeleccionado
                              ? tipoFinanciero === 'INGRESO'
                                ? 'bg-emerald-800 text-white border-emerald-600 shadow-sm ring-1 ring-emerald-500/50'
                                : 'bg-rose-800 text-white border-rose-600 shadow-sm ring-1 ring-rose-500/50'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center space-x-1.5 truncate">
                            <span className="text-sm flex-shrink-0">{item.icono}</span>
                            <span className="truncate">{item.nombre}</span>
                          </div>

                          {item.naturaleza_costo && (
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded flex-shrink-0 ${
                              esSeleccionado
                                ? 'bg-white/20 text-white'
                                : item.naturaleza_costo === 'FIJO'
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'bg-blue-100 text-blue-900'
                            }`}>
                              {item.naturaleza_costo === 'FIJO' ? 'Fijo' : 'Var'}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selector de Clasificación de Costo (Solo para Egresos) */}
          {tipoFinanciero === 'EGRESO' && (
            <div className="space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
              <label className="font-extrabold text-slate-700 block text-[11px]">
                Clasificación de Costo para esta Transacción:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNaturalezaCosto('FIJO')}
                  className={`p-2.5 rounded-xl border text-xs font-black flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                    naturalezaCosto === 'FIJO'
                      ? 'bg-amber-900 text-amber-200 border-amber-600 shadow-sm ring-1 ring-amber-500'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>📌 Costo Fijo (Estructura)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setNaturalezaCosto('VARIABLE')}
                  className={`p-2.5 rounded-xl border text-xs font-black flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                    naturalezaCosto === 'VARIABLE'
                      ? 'bg-blue-900 text-blue-200 border-blue-600 shadow-sm ring-1 ring-blue-500'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>📈 Costo Variable (Productivo)</span>
                </button>
              </div>
            </div>
          )}

          {/* Fecha y Período Agrícola */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 block flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span>Fecha del Comprobante</span>
              </label>
              <span className="text-[10px] font-black text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded-md border border-emerald-200">
                Mes: {mesAgricola} | Ej. {ejercicioAgricola}
              </span>
            </div>
            <input
              type="date"
              required
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 min-h-[42px]"
            />
          </div>

          {/* Descripción */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 block">Descripción / Detalle de la Operación</label>
            <input
              type="text"
              placeholder={tipoFinanciero === 'INGRESO' ? "ej: Venta novillos remate pantalla" : "ej: Compra ración destete y vacuna 1er dosis"}
              value={descripcionFinanciera}
              onChange={(e) => setDescripcionFinanciera(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
            />
          </div>

          {/* Botón de Enviar */}
          <button
            type="submit"
            className={`w-full text-white font-extrabold text-xs py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 min-h-[46px] cursor-pointer mt-2 ${
              tipoFinanciero === 'INGRESO'
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800'
                : 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800'
            }`}
          >
            <Check className="w-4 h-4 text-white" />
            <span>{tipoFinanciero === 'INGRESO' ? 'Guardar Ingreso Financiero' : 'Guardar Egreso Financiero'}</span>
          </button>

        </form>
      </div>
    </div>
  );
};
