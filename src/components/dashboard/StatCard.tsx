import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  color?: 'emerald' | 'amber' | 'blue' | 'purple';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'emerald'
}) => {
  const colorStyles = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 shadow-emerald-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-200/80 shadow-amber-100',
    blue: 'bg-blue-50 text-blue-700 border-blue-200/80 shadow-blue-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-200/80 shadow-purple-100',
  };

  return (
    <article className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-start justify-between">
      <div>
        <header className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{title}</header>
        <p className="text-2xl font-black text-slate-900 mt-1 tracking-tight">{value}</p>
        {subtitle && <p className="text-xs text-slate-500 mt-1 font-medium">{subtitle}</p>}
        {trend && (
          <span className="inline-block mt-2 text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-200">
            {trend}
          </span>
        )}
      </div>
      <figure className={`p-3 rounded-xl border ${colorStyles[color]} shadow-sm`}>
        <Icon className="w-6 h-6" />
      </figure>
    </article>
  );
};
