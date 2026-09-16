import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: string;
  color?: 'emerald' | 'amber' | 'blue' | 'purple';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
}) => {
  return (
    <article className="app-card !p-3 flex items-center justify-between gap-3">
      <div className="space-y-0.5 min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {Icon && <Icon className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />}
          <span className="app-metric-label truncate">{title}</span>
        </div>
        <p className="app-metric-value text-slate-900 leading-tight">{value}</p>
        {subtitle && <p className="text-[11px] text-slate-500 font-medium truncate">{subtitle}</p>}
      </div>

      {trend && (
        <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200/80 whitespace-nowrap flex-shrink-0 self-center">
          {trend}
        </span>
      )}
    </article>
  );
};

