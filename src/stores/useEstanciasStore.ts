import { create } from 'zustand';
import type { Estancia } from '../types';

interface EstanciasState {
  estancias: Estancia[];
  estanciaSeleccionadaId: string; // 'TODAS' o el id específico de la estancia
  reglasProrrateo: Record<string, number>; // estancia_id -> porcentaje (ej: { 'est-1': 35, 'est-2': 24 })
  seleccionarEstancia: (id: string) => void;
  agregarEstancia: (nueva: Omit<Estancia, 'id' | 'activa'>) => void;
  obtenerEstanciaActual: () => Estancia | null;
  actualizarReglasProrrateo: (reglas: Record<string, number>) => void;
  calcularProrrateoPorHectareas: () => Record<string, number>;
}

const estanciasIniciales: Estancia[] = [
  {
    id: 'est-1',
    nombre: 'Estancia El Ombú',
    dicose: '04-123456-7',
    hectareas_totales: 1250,
    hectareas_pastoreables: 1100,
    departamento: 'Salto',
    ubicacion_localidad: 'Ruta 31, Km 45',
    tipo_tenencia: 'PROPIO',
    activa: true,
  },
  {
    id: 'est-2',
    nombre: 'Estancia Los Plátanos',
    dicose: '18-987654-3',
    hectareas_totales: 850,
    hectareas_pastoreables: 780,
    departamento: 'Tacuarembó',
    ubicacion_localidad: 'Paso de los Toros',
    tipo_tenencia: 'ARRENDADO',
    activa: true,
  },
  {
    id: 'est-3',
    nombre: 'Campo La Querencia',
    dicose: '12-456789-1',
    hectareas_totales: 1500,
    hectareas_pastoreables: 1350,
    departamento: 'Paysandú',
    ubicacion_localidad: 'Guichón',
    tipo_tenencia: 'PROPIO',
    activa: true,
  },
];

// Inicialización por defecto de reglas de prorrateo por hectáreas
const calcularInicialProrrateo = (lista: Estancia[]) => {
  const totalHa = lista.reduce((a, b) => a + b.hectareas_totales, 0) || 1;
  const res: Record<string, number> = {};
  lista.forEach((e) => {
    res[e.id] = Math.round((e.hectareas_totales / totalHa) * 100);
  });
  return res;
};

export const useEstanciasStore = create<EstanciasState>((set, get) => ({
  estancias: estanciasIniciales,
  estanciaSeleccionadaId: 'TODAS', // Por defecto muestra el Consolidado Empresa (Todas)
  reglasProrrateo: calcularInicialProrrateo(estanciasIniciales),

  seleccionarEstancia: (id: string) => {
    set({ estanciaSeleccionadaId: id });
  },

  agregarEstancia: (nuevaData) => {
    const nuevaEstancia: Estancia = {
      ...nuevaData,
      id: `est-${Date.now()}`,
      activa: true,
    };

    set((state) => {
      const nuevasEstancias = [...state.estancias, nuevaEstancia];
      return {
        estancias: nuevasEstancias,
        estanciaSeleccionadaId: nuevaEstancia.id,
        reglasProrrateo: calcularInicialProrrateo(nuevasEstancias),
      };
    });
  },

  obtenerEstanciaActual: () => {
    const { estancias, estanciaSeleccionadaId } = get();
    if (estanciaSeleccionadaId === 'TODAS') return null;
    return estancias.find((e) => e.id === estanciaSeleccionadaId) || null;
  },

  actualizarReglasProrrateo: (reglas) => {
    set({ reglasProrrateo: reglas });
  },

  calcularProrrateoPorHectareas: () => {
    const { estancias } = get();
    return calcularInicialProrrateo(estancias);
  },
}));
