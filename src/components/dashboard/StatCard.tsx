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
}) => {
  return (
    <article className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
      <div className="flex items-center justify-between">
        <header className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">{title}</header>
        {trend && (
          <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">
            {trend}
          </span>
        )}
      </div>
      <p className="text-xl font-black text-slate-900 tracking-tight leading-none">{value}</p>
      {subtitle && <p className="text-[11px] text-slate-500 font-medium truncate">{subtitle}</p>}
    </article>
  );
};
