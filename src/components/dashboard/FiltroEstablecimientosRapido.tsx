import React from 'react';
import { useEstanciasStore } from '../../stores/useEstanciasStore';
import { useEmpresasStore } from '../../stores/useEmpresasStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { CustomSelect, type SelectOption } from '../ui/CustomSelect';
import { MapPin, Building2 } from 'lucide-react';

export const FiltroEstablecimientosRapido: React.FC = () => {
  const { estancias, estanciaSeleccionadaId, seleccionarEstancia } = useEstanciasStore();
  const { empresas, empresaSeleccionadaId, seleccionarEmpresa } = useEmpresasStore();
  const { usuario } = useAuthStore();

  const tieneAccesoTodas = usuario?.estancias_asignadas_ids?.includes('TODAS') || usuario?.rol === 'ADMIN' || usuario?.rol === 'PROPIETARIO' || usuario?.rol === 'SUPERADMIN';
  const estanciasPermitidas = tieneAccesoTodas
    ? estancias
    : estancias.filter(e => usuario?.estancias_asignadas_ids?.includes(e.id));

  const totalHectareasEmpresa = estanciasPermitidas.reduce((a, b) => a + b.hectareas_totales, 0);

  // Opciones de Empresa
  const empresaOptions: SelectOption[] = empresas.map((emp) => ({
    value: emp.id,
    label: emp.razon_social,
    badge: `${(emp.hectareas_totales_grupo || 0).toLocaleString('es-UY')} Ha`,
  }));

  // Opciones de Predio / Campo
  const predioOptions: SelectOption[] = [];

  if (tieneAccesoTodas) {
    predioOptions.push({
      value: 'TODAS',
      label: 'Consolidado Empresa',
      badge: `${totalHectareasEmpresa.toLocaleString('es-UY')} Ha`,
      badgeColor: 'bg-emerald-100 text-emerald-900 border border-emerald-200',
    });
  }

  estanciasPermitidas.forEach((estancia) => {
    predioOptions.push({
      value: estancia.id,
      label: estancia.nombre,
      badge: `${estancia.hectareas_totales.toLocaleString('es-UY')} Ha`,
      badgeColor: 'bg-slate-100 text-slate-800 border border-slate-200',
      description: `DICOSE ${estancia.dicose}`,
    });
  });

  return (
    <div aria-label="Filtros de Empresa y Campo" className="bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-2">
      
      {/* 1. Selector Empresa (Si hay múltiples empresas) */}
      {empresas.length > 1 ? (
        <div className="w-full sm:w-1/2">
          <CustomSelect
            value={empresaSeleccionadaId}
            options={empresaOptions}
            onChange={(val) => seleccionarEmpresa(val)}
            icon={<Building2 className="w-4 h-4 text-emerald-600" />}
            placeholder="Seleccionar Empresa..."
            variant="light"
          />
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 px-1">
          <Building2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{empresas[0]?.razon_social || 'AppRural Uruguay'}</span>
        </div>
      )}

      {/* 2. Selector Campo / Predio usando CustomSelect */}
      <div className="w-full sm:w-1/2">
        <CustomSelect
          value={estanciaSeleccionadaId}
          options={predioOptions}
          onChange={(val) => seleccionarEstancia(val)}
          icon={<MapPin className="w-4 h-4 text-emerald-600" />}
          placeholder="Seleccionar Campo..."
          variant="light"
        />
      </div>

    </div>
  );
};
