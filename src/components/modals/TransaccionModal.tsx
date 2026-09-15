import React from 'react';
import { useTransaccionForm } from '../../hooks/finanzas/useTransaccionForm';
import {
  X,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  MapPin,
  Calendar,
  Layers,
  PieChart,
  RefreshCw
} from 'lucide-react';

interface TransaccionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TransaccionModal: React.FC<TransaccionModalProps> = ({ isOpen, onClose }) => {
  const form = useTransaccionForm(onClose);

  if (!isOpen || !form.puedeVerFinanzas) return null;

  // Agrupar conceptos activos disponibles por su Grupo del Plan Agropecuario
  const gruposMap: Record<string, typeof form.conceptosDisponibles> = {};
  form.conceptosDisponibles.forEach((c) => {
    if (!gruposMap[c.grupo]) gruposMap[c.grupo] = [];
    gruposMap[c.grupo].push(c);
  });

  return (
    <section aria-label="Modal Registrar Transacción Financiera" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <article className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Cabecera Exclusiva Transacciones */}
        <header className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-2xl flex-shrink-0 ${
              form.tipoFinanciero === 'INGRESO' ? 'bg-emerald-600 text-white shadow-md' : 'bg-rose-600 text-white shadow-md'
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
        <nav aria-label="Selección de Establecimiento" className="p-3 bg-slate-50 border-b border-slate-200/80 space-y-1.5 flex-shrink-0">
          <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">Establecimiento Destino:</label>
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
            {form.prorrateo.estancias.map((est) => {
              const esSeleccionado = form.estanciaFormId === est.id;
              return (
                <button
                  key={est.id}
                  type="button"
                  onClick={() => form.setEstanciaFormId(est.id)}
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
        </nav>

        {/* Formulario Exclusivo de Finanzas */}
        <form onSubmit={form.handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-xs">

          {/* Selector Prominente Ingreso vs Egreso */}
          <fieldset className="grid grid-cols-2 gap-3 border-0 p-0 m-0">
            <legend className="sr-only">Tipo de Operación Financiera</legend>
            <button
              type="button"
              onClick={() => form.setTipoFinanciero('INGRESO')}
              className={`p-3 rounded-2xl border font-extrabold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                form.tipoFinanciero === 'INGRESO'
                  ? 'bg-emerald-100 border-emerald-500 text-emerald-950 shadow-sm ring-2 ring-emerald-500/30'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ArrowUpRight className="w-4 h-4 text-emerald-600" />
              <span>INGRESO (Entrada US$)</span>
            </button>

            <button
              type="button"
              onClick={() => form.setTipoFinanciero('EGRESO')}
              className={`p-3 rounded-2xl border font-extrabold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                form.tipoFinanciero === 'EGRESO'
                  ? 'bg-rose-100 border-rose-500 text-rose-950 shadow-sm ring-2 ring-rose-500/30'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ArrowDownRight className="w-4 h-4 text-rose-600" />
              <span>EGRESO (Salida US$)</span>
            </button>
          </fieldset>

          {/* Selector de Moneda (USD / UYU) */}
          <fieldset className="space-y-1 border-0 p-0 m-0">
            <legend className="font-bold text-slate-700 block mb-1">Moneda de la Operación</legend>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => form.setMoneda('USD')}
                className={`p-2.5 rounded-xl border text-xs font-black flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                  form.moneda === 'USD'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-700 shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>💵 Dólares (USD)</span>
              </button>

              <button
                type="button"
                onClick={() => form.setMoneda('UYU')}
                className={`p-2.5 rounded-xl border text-xs font-black flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                  form.moneda === 'UYU'
                    ? 'bg-blue-950 text-blue-300 border-blue-700 shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>🇺🇾 Pesos (UYU)</span>
              </button>
            </div>
          </fieldset>

          {/* Monto Total y Conversión Bimoneda */}
          <fieldset className="space-y-1 border-0 p-0 m-0">
            <div className="flex items-center justify-between">
              <label htmlFor="monto-input" className="font-extrabold text-slate-700 block">Monto Total ({form.moneda})</label>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                <RefreshCw className="w-3 h-3 text-emerald-600" /> TC: $ {form.cotizacion.tipoCambio}
              </span>
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-500">
                {form.moneda === 'USD' ? '$ US' : '$ UYU'}
              </span>
              <input
                id="monto-input"
                type="number"
                step="0.01"
                required
                placeholder="ej: 14500"
                value={form.monto}
                onChange={(e) => form.setMonto(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm font-black rounded-xl pl-16 pr-4 py-3 focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
              />
            </div>

            {/* Vista Previa Conversión Bimoneda Automática */}
            {parseFloat(form.monto) > 0 && (
              <output className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 flex items-center justify-between text-xs font-bold block">
                <span>Equivalente estimado:</span>
                <span className="font-black text-emerald-800">
                  {form.moneda === 'USD'
                    ? `$ ${(parseFloat(form.monto) * form.cotizacion.tipoCambio).toLocaleString('es-UY')} UYU`
                    : `USD ${(parseFloat(form.monto) / form.cotizacion.tipoCambio).toLocaleString('es-UY', { maximumFractionDigits: 2 })}`}
                </span>
              </output>
            )}
          </fieldset>

          {/* Bloque Prorratear entre Campos */}
          <fieldset className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl space-y-3 border-0">
            <legend className="sr-only">Prorrateo Multipredial</legend>
            <label className="flex items-center space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={form.prorrateo.esProrrateado}
                onChange={(e) => form.prorrateo.setEsProrrateado(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
              />
              <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                <PieChart className="w-4 h-4 text-emerald-600" />
                <span>🌐 Repartir este gasto entre varios campos (Prorrateo)</span>
              </span>
            </label>

            {form.prorrateo.esProrrateado && (
              <div className="space-y-2.5 pt-2 border-t border-slate-200/80 animate-fadeIn">
                <p className="text-[11px] text-slate-500 font-medium">
                  Carga los porcentajes asignados a cada campo para esta transacción:
                </p>

                <div className="space-y-2">
                  {form.prorrateo.estancias.map((est) => {
                    const pct = form.prorrateo.customProrrateo[est.id] || 0;
                    const valMonto = parseFloat(form.monto) || 0;
                    const montoParcial = Math.round((valMonto * (pct / 100)) * 100) / 100;

                    return (
                      <div key={est.id} className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                          <span className="font-extrabold text-slate-800">{est.nombre}</span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={pct}
                            onChange={(e) => {
                              const v = Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0));
                              form.prorrateo.handleProrrateoChange(est.id, v);
                            }}
                            className="w-12 text-center text-xs font-black bg-slate-50 border border-slate-300 rounded-lg py-1 focus:ring-2 focus:ring-emerald-500"
                          />
                          <span className="font-extrabold text-slate-500">%</span>

                          {valMonto > 0 && (
                            <span className="text-[11px] font-mono font-black text-emerald-800 ml-1">
                              ({form.moneda} {montoParcial.toLocaleString()})
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </fieldset>

          {/* Categorías / Rubros Habilitados por el Admin */}
          <fieldset className="space-y-2 border-0 p-0 m-0">
            <div className="flex items-center justify-between">
              <legend className="font-bold text-slate-700 block">Rubro / Concepto (Habilitados por Admin)</legend>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                {form.conceptosDisponibles.length} disponibles
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
                      const esSeleccionado = form.categoria === item.nombre;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => form.handleSeleccionarCategoria(item)}
                          className={`p-2 rounded-xl text-left text-[11px] font-bold border transition-all flex items-center justify-between space-x-1.5 cursor-pointer ${
                            esSeleccionado
                              ? form.tipoFinanciero === 'INGRESO'
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
          </fieldset>

          {/* Selector de Clasificación de Costo (Solo para Egresos) */}
          {form.tipoFinanciero === 'EGRESO' && (
            <fieldset className="space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
              <legend className="font-extrabold text-slate-700 block text-[11px]">
                Clasificación de Costo para esta Transacción:
              </legend>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => form.setNaturalezaCosto('FIJO')}
                  className={`p-2.5 rounded-xl border text-xs font-black flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                    form.naturalezaCosto === 'FIJO'
                      ? 'bg-amber-900 text-amber-200 border-amber-600 shadow-sm ring-1 ring-amber-500'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>📌 Costo Fijo (Estructura)</span>
                </button>

                <button
                  type="button"
                  onClick={() => form.setNaturalezaCosto('VARIABLE')}
                  className={`p-2.5 rounded-xl border text-xs font-black flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                    form.naturalezaCosto === 'VARIABLE'
                      ? 'bg-blue-900 text-blue-200 border-blue-600 shadow-sm ring-1 ring-blue-500'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>📈 Costo Variable (Productivo)</span>
                </button>
              </div>
            </fieldset>
          )}

          {/* Fecha y Período Agrícola */}
          <fieldset className="space-y-1 border-0 p-0 m-0">
            <div className="flex items-center justify-between">
              <label htmlFor="fecha-comprobante" className="font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span>Fecha del Comprobante</span>
              </label>
              <span className="text-[10px] font-black text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded-md border border-emerald-200">
                Mes: {form.fecha}
              </span>
            </div>
            <input
              id="fecha-comprobante"
              type="date"
              required
              value={form.fecha}
              onChange={(e) => form.setFecha(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 min-h-[42px]"
            />
          </fieldset>

          {/* Descripción */}
          <fieldset className="space-y-1 border-0 p-0 m-0">
            <label htmlFor="descripcion-op" className="font-bold text-slate-700 block">Descripción / Detalle de la Operación</label>
            <input
              id="descripcion-op"
              type="text"
              placeholder={form.tipoFinanciero === 'INGRESO' ? "ej: Venta novillos remate pantalla" : "ej: Compra ración destete y vacuna 1er dosis"}
              value={form.descripcionFinanciera}
              onChange={(e) => form.setDescripcionFinanciera(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
            />
          </fieldset>

          {/* Botón de Enviar */}
          <button
            type="submit"
            className={`w-full text-white font-extrabold text-xs py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 min-h-[46px] cursor-pointer mt-2 ${
              form.tipoFinanciero === 'INGRESO'
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800'
                : 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800'
            }`}
          >
            <Check className="w-4 h-4 text-white" />
            <span>{form.tipoFinanciero === 'INGRESO' ? 'Guardar Ingreso Financiero' : 'Guardar Egreso Financiero'}</span>
          </button>

        </form>
      </article>
    </section>
  );
};
