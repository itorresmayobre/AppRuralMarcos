import React from 'react';
import { useEmpresasStore } from '../../stores/useEmpresasStore';
import { CustomSelect, type SelectOption } from '../ui/CustomSelect';
import { Building2 } from 'lucide-react';

export const SelectorEmpresaBar: React.FC = () => {
  const { empresas, empresaSeleccionadaId, seleccionarEmpresa } = useEmpresasStore();

  if (empresas.length <= 1) return null;

  const empresaOptions: SelectOption[] = empresas.map((emp) => ({
    value: emp.id,
    label: emp.razon_social,
    badge: `${emp.hectareas_totales_grupo} Ha`,
    badgeColor: emp.activa
      ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
      : 'bg-rose-100 text-rose-900 border border-rose-200',
  }));

  return (
    <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-center space-x-2">
        <div className="p-2 bg-indigo-100 text-indigo-900 rounded-xl">
          <Building2 className="w-5 h-5 text-indigo-700" />
        </div>
        <div>
          <h4 className="text-xs font-black text-slate-900">Grupo Empresarial Activo</h4>
          <p className="text-[11px] text-slate-500 font-medium">Empresa matriz seleccionada para consolidación multipredial</p>
        </div>
      </div>

      <div className="w-full sm:w-72">
        <CustomSelect
          label="Empresa Matriz:"
          value={empresaSeleccionadaId}
          options={empresaOptions}
          onChange={(val) => seleccionarEmpresa(val)}
          icon={<Building2 className="w-4 h-4 text-indigo-600" />}
        />
      </div>
    </div>
  );
};
