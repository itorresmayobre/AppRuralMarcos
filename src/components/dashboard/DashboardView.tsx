import React from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useEstanciasStore } from '../../stores/useEstanciasStore';
import { useGanadoStore } from '../../stores/useGanadoStore';
import { useFinanzasStore } from '../../stores/useFinanzasStore';
import { StatCard } from './StatCard';
import { AccionesRapidasBar } from './AccionesRapidasBar';
import { FiltroEstablecimientosRapido } from './FiltroEstablecimientosRapido';
import { MetricasEjercicioCard } from './MetricasEjercicioCard';
import { Beef, DollarSign, TrendingUp, ShieldAlert } from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { usuario } = useAuthStore();
  const { estancias, estanciaSeleccionadaId, obtenerEstanciaActual } = useEstanciasStore();
  const { stockList } = useGanadoStore();
  const { obtenerTransaccionesEstancia } = useFinanzasStore();

  const currentRole = usuario?.rol || 'OPERARIO';
  const estanciaActual = obtenerEstanciaActual();
  const canSeeMoney = currentRole === 'ADMIN' || currentRole === 'CONTADOR' || currentRole === 'PROPIETARIO' || currentRole === 'SUPERADMIN';

  // Superficie en hectáreas
  const totalHectareas = estanciaActual 
    ? estanciaActual.hectareas_totales 
    : estancias.reduce((acc, curr) => acc + curr.hectareas_totales, 0);

  // 1. Cálculo Dinámico de Stock Ganadero y Carga Animal (UG/ha)
  const stockFiltrado = estanciaSeleccionadaId === 'TODAS'
    ? stockList
    : stockList.filter((s) => s.estancia_id === estanciaSeleccionadaId);

  const totalVacunos = stockFiltrado
    .filter((s) => s.especie === 'VACUNO')
    .reduce((sum, item) => sum + item.cabezas, 0);

  const totalOvinos = stockFiltrado
    .filter((s) => s.especie === 'OVINO')
    .reduce((sum, item) => sum + item.cabezas, 0);

  // Equivalencia Uruguaya UG: Vacuno ~0.8 UG, Ovino ~0.15 UG
  const totalUG = stockFiltrado.reduce((sum, item) => {
    const equiv = item.especie === 'OVINO' ? 0.15 : 0.8;
    return sum + (item.cabezas * equiv);
  }, 0);

  const cargaUGPerHa = totalHectareas > 0 ? (totalUG / totalHectareas) : 0;

  // 2. Cálculo Dinámico de Finanzas en USD (Ventas vs Egresos)
  const transaccionesVista = obtenerTransaccionesEstancia(estanciaSeleccionadaId);

  const ventasHaciendaUSD = transaccionesVista
    .filter((t) => t.tipo === 'INGRESO')
    .reduce((sum, t) => sum + (t.moneda === 'USD' ? t.monto : t.monto / 40), 0);

  const egresosInsumosUSD = transaccionesVista
    .filter((t) => t.tipo === 'EGRESO')
    .reduce((sum, t) => sum + (t.moneda === 'USD' ? t.monto : t.monto / 40), 0);

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* 1. Filtros de Empresa & Campo (Barra Novedosa Ultra-Compacta 1-Fila) */}
      <FiltroEstablecimientosRapido />

      {/* 2. DATOS DE ALTA PRIORIDAD: Tarjetas KPIs (Stock, Carga UG/ha, Ventas, Egresos) */}
      <section aria-label="Indicadores Clave de Desempeño (KPIs)" className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <StatCard
          title="Stock Vacunos"
          value={`${totalVacunos.toLocaleString('es-UY')} Cab`}
          subtitle={totalOvinos > 0 ? `+ ${totalOvinos.toLocaleString('es-UY')} Ovinos` : "Vacunos totales"}
          icon={Beef}
          trend={totalVacunos > 0 ? "Existencias BD" : "Sin hacienda"}
          color="emerald"
        />
        <StatCard
          title="Carga Animal"
          value={`${cargaUGPerHa.toFixed(2)} UG/ha`}
          subtitle={`Superficie: ${totalHectareas.toLocaleString('es-UY')} Ha`}
          icon={TrendingUp}
          trend={cargaUGPerHa > 0 ? (cargaUGPerHa <= 1.0 ? "Equilibrada" : "Alta") : "Sin animales"}
          color="blue"
        />
        {canSeeMoney ? (
          <>
            <StatCard
              title="Ventas Hacienda (USD)"
              value={`$ ${Math.round(ventasHaciendaUSD).toLocaleString('es-UY')}`}
              subtitle="Ingresos totales"
              icon={DollarSign}
              trend={ventasHaciendaUSD > 0 ? "Ingresos registrados" : "Sin ventas"}
              color="emerald"
            />
            <StatCard
              title="Egresos Insumos (USD)"
              value={`$ ${Math.round(egresosInsumosUSD).toLocaleString('es-UY')}`}
              subtitle="Egresos caja"
              icon={DollarSign}
              trend={egresosInsumosUSD > 0 ? "Gastos registrados" : "Sin egresos"}
              color="amber"
            />
          </>
        ) : (
          <article className="col-span-2 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center space-x-2 text-amber-900 text-xs">
            <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="font-bold">Métricas Protegidas</p>
              <p className="text-[10px] text-amber-800">Tu rol ({currentRole}) no permite ver montos monetarios.</p>
            </div>
          </article>
        )}
      </section>

      {/* 3. ESTADÍSTICAS Y MÉTRICAS FINANCIERAS DEL EJERCICIO (VISIBLES ARRIBA) */}
      {canSeeMoney && <MetricasEjercicioCard />}

      {/* 4. ACCIONES RÁPIDAS OPERATIVAS & BITÁCORA DEL CAMPO (NOTAS AL FINAL) */}
      <AccionesRapidasBar />
    </div>
  );
};
