/**
 * AgroUY Centralized UI Design System Constants
 * 
 * Estandariza la jerarquía tipográfica, formularios, etiquetas, 
 * inputs y botones a lo largo de toda la aplicación para garantizar 
 * consistencia visual perfecta en celulares y escritorio.
 */

export const UI_THEME = {
  // Jerarquía Tipográfica
  text: {
    modalTitle: 'text-base font-extrabold text-white',
    sectionTitle: 'text-sm font-bold text-slate-800',
    cardTitle: 'text-xs font-bold uppercase tracking-wider text-slate-500',
    label: 'font-bold text-slate-700 block text-xs',
    labelExtrabold: 'font-extrabold text-slate-700 block text-xs',
    labelWithIcon: 'font-bold text-slate-700 block text-xs flex items-center gap-1.5',
    helperText: 'text-[11px] text-slate-500 font-medium',
    bodyText: 'text-xs text-slate-700 leading-relaxed',
    badgeText: 'text-[10px] font-bold px-2 py-0.5 rounded-md',
  },

  // Estilos de Formularios e Inputs
  form: {
    container: 'p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-xs',
    fieldBlock: 'space-y-1.5',
    input: 'w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[42px]',
    inputNumberProminent: 'w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm font-black rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 min-h-[44px]',
    textarea: 'w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-xl p-3 focus:ring-2 focus:ring-emerald-500',
    cardBlock: 'bg-slate-50 border border-slate-200 p-3 rounded-2xl space-y-2.5',
  },

  // Botones Estándar
  button: {
    primary: 'w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-xs py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 min-h-[46px] cursor-pointer mt-2',
    danger: 'w-full bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-xs py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 min-h-[46px] cursor-pointer mt-2',
    chipActive: 'bg-emerald-950 text-emerald-300 border-emerald-700 shadow-sm',
    chipInactive: 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100',
  },

  // Banner de Advertencia (Ej: Sin estancias)
  banner: {
    amberWarning: 'p-3 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex items-center gap-2 flex-shrink-0',
  }
} as const;
