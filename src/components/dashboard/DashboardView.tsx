import React from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useEstanciasStore } from '../../stores/useEstanciasStore';
import { SelectorEmpresaBar } from '../empresas/SelectorEmpresaBar';
import { StatCard } from './StatCard';
import { AccionesRapidasBar } from './AccionesRapidasBar';
import { FiltroEstablecimientosRapido } from './FiltroEstablecimientosRapido';
import { MetricasEjercicioCard } from './MetricasEjercicioCard';
import { Beef, DollarSign, TrendingUp, ShieldAlert, Award, MapPin } from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { usuario } = useAuthStore();
  const { estancias, estanciaSeleccionadaId, obtenerEstanciaActual } = useEstanciasStore();

  const currentRole = usuario?.rol || 'OPERARIO';
  const estanciaActual = obtenerEstanciaActual();
  const canSeeMoney = currentRole === 'ADMIN' || currentRole === 'CONTADOR' || currentRole === 'SUPERADMIN';

  // Si no hay establecimiento seleccionado (o 'TODAS'), mostramos el acumulado consolidado
  const totalHectareas = estanciaActual 
    ? estanciaActual.hectareas_totales 
    : estancias.reduce((acc, curr) => acc + curr.hectareas_totales, 0);

  const nombreEstanciaVista = estanciaActual ? estanciaActual.nombre : 'Consolidado Empresa (Todos los Establecimientos)';
  const dicoseVista = estanciaActual ? estanciaActual.dicose : 'Multi-DICOSE';

  return (
    <div className="space-y-6">
      {/* Selector de Empresa Matriz (Multi-Tenant) */}
      <SelectorEmpresaBar />

      {/* Banner Principal Adaptado al Establecimiento Seleccionado */}
      <section aria-label="Resumen Ejecutivo de la Zafra" className="relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white p-6 sm:p-7 rounded-2xl shadow-xl border border-emerald-800/40">
        <div className="space-y-2 z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-emerald-500/20 text-emerald-300 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-500/30 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-emerald-400" /> {nombreEstanciaVista}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Dashboard Agronómico & Financiero</h2>
          <p className="text-slate-300 text-xs max-w-xl leading-relaxed">
            Métricas de carga animal ($UG/ha$), existencias ganaderas y flujo de fondos para <strong>{totalHectareas.toLocaleString()} Hectáreas</strong>.
          </p>
        </div>

        <figure className="z-10 flex items-center space-x-3 bg-emerald-950/80 px-4 py-3 rounded-xl border border-emerald-700/50 shadow-inner self-start sm:self-auto">
          <Award className="w-8 h-8 text-amber-400 flex-shrink-0" />
          <figcaption className="text-xs">
            <p className="font-extrabold text-white">DICOSE Oficial</p>
            <p className="text-emerald-300 font-mono">{dicoseVista}</p>
          </figcaption>
        </figure>
      </section>

      {/* Acciones Rápidas de Filtro por Establecimiento / Campo */}
      <FiltroEstablecimientosRapido />

      {/* Panel de Acciones Rápidas Operativas & Bitácora del Campo */}
      <AccionesRapidasBar />

      {/* Módulo de Métricas Financieras del Ejercicio en Curso */}
      {canSeeMoney && <MetricasEjercicioCard />}

      {/* Tarjetas KPIs */}
      <section aria-label="Indicadores Clave de Desempeño (KPIs)" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Stock Vacunos"
          value={estanciaSeleccionadaId === 'TODAS' ? '2.140 Cabezas' : '845 Cabezas'}
          subtitle="Vacas de cría, novillos y terneros"
          icon={Beef}
          trend="+4.2% parición"
          color="emerald"
        />
        <StatCard
          title="Carga Animal"
          value="0.82 UG/ha"
          subtitle={`Superficie: ${totalHectareas.toLocaleString()} Ha`}
          icon={TrendingUp}
          trend="Pastura sin sobrepastoreo"
          color="blue"
        />
        {canSeeMoney ? (
          <>
            <StatCard
              title="Ventas Hacienda (USD)"
              value={estanciaSeleccionadaId === 'TODAS' ? '$ 380.000' : '$ 142.500'}
              subtitle="Consignatarios & Frigorífico"
              icon={DollarSign}
              trend="Liquidaciones cerradas"
              color="emerald"
            />
            <StatCard
              title="Egresos Insumos (USD)"
              value={estanciaSeleccionadaId === 'TODAS' ? '$ 94.000' : '$ 38.200'}
              subtitle="Ración, sanidad y combustible"
              icon={DollarSign}
              trend="Dentro de presupuesto"
              color="amber"
            />
          </>
        ) : (
          <article className="col-span-1 sm:col-span-2 bg-amber-50/90 border border-amber-200/90 rounded-2xl p-5 flex items-center space-x-3 text-amber-900 text-xs shadow-sm">
            <ShieldAlert className="w-7 h-7 text-amber-600 flex-shrink-0" />
            <div>
              <p className="font-bold text-amber-950">Métricas Financieras Protegidas</p>
              <p className="mt-0.5 text-amber-800">
                Tu rol activo (<strong>{currentRole}</strong>) tiene permisos restringidos para ver montos en dinero según las reglas de RLS.
              </p>
            </div>
          </article>
        )}
      </section>
    </div>
  );
};

