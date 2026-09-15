/**
 * CONFIGURACIÓN CENTRALIZADA DE ESTILOS Y TEMA (THEME CONFIG)
 * Permite cambiar colores, paleta corporativa y clases reutilizables en toda la app desde un solo lugar.
 */

export const theme = {
  // Paleta de colores primarios
  colors: {
    primary: '#059669', // Emerald 600
    primaryDark: '#064e3b', // Emerald 950
    primaryLight: '#d1fae5', // Emerald 100
    accent: '#10b981', // Emerald 500
    darkHeader: '#0f172a', // Slate 900
    bgMain: '#f8fafc', // Slate 50
  },

  // Clases CSS reutilizables para botones
  buttons: {
    primary: 'bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-md cursor-pointer transition-all active:scale-95 min-h-[42px] px-4 py-2.5 flex items-center justify-center space-x-2',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold rounded-xl border border-slate-300 transition-all cursor-pointer min-h-[42px] px-4 py-2.5 flex items-center justify-center space-x-2',
    dark: 'bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl shadow-md transition-all cursor-pointer min-h-[42px] px-4 py-2.5 flex items-center justify-center space-x-2',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl shadow-md transition-all cursor-pointer min-h-[42px] px-4 py-2.5 flex items-center justify-center space-x-2',
  },

  // Clases reutilizables para tarjetas y paneles
  cards: {
    base: 'bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4',
    dark: 'bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-xl p-5 space-y-4',
    highlight: 'bg-emerald-50/80 rounded-2xl border border-emerald-200/90 p-5 space-y-4',
  },

  // Clases reutilizables para inputs y formularios
  inputs: {
    base: 'w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[42px]',
  },

  // Clases reutilizables para Badges de estado
  badges: {
    emerald: 'bg-emerald-100 text-emerald-900 border border-emerald-200 text-[10px] font-black px-2.5 py-0.5 rounded-md inline-block',
    amber: 'bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-black px-2.5 py-0.5 rounded-md inline-block',
    blue: 'bg-blue-100 text-blue-900 border border-blue-200 text-[10px] font-black px-2.5 py-0.5 rounded-md inline-block',
    rose: 'bg-rose-100 text-rose-900 border border-rose-200 text-[10px] font-black px-2.5 py-0.5 rounded-md inline-block',
    slate: 'bg-slate-100 text-slate-800 border border-slate-200 text-[10px] font-black px-2.5 py-0.5 rounded-md inline-block',
  }
};
