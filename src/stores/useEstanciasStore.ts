import { create } from 'zustand';
import type { Estancia } from '../types';

interface EstanciasState {
  estancias: Estancia[];
  estanciaSeleccionadaId: string; // 'TODAS' o el id específico de la estancia
  seleccionarEstancia: (id: string) => void;
  agregarEstancia: (nueva: Omit<Estancia, 'id' | 'activa'>) => void;
  obtenerEstanciaActual: () => Estancia | null;
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

export const useEstanciasStore = create<EstanciasState>((set, get) => ({
  estancias: estanciasIniciales,
  estanciaSeleccionadaId: 'TODAS', // Por defecto muestra el Consolidado Empresa (Todas)

  seleccionarEstancia: (id: string) => {
    set({ estanciaSeleccionadaId: id });
  },

  agregarEstancia: (nuevaData) => {
    const nuevaEstancia: Estancia = {
      ...nuevaData,
      id: `est-${Date.now()}`,
      activa: true,
    };

    set((state) => ({
      estancias: [...state.estancias, nuevaEstancia],
      estanciaSeleccionadaId: nuevaEstancia.id, // Selecciona automáticamente la nueva estancia creada
    }));
  },

  obtenerEstanciaActual: () => {
    const { estancias, estanciaSeleccionadaId } = get();
    if (estanciaSeleccionadaId === 'TODAS') return null;
    return estancias.find((e) => e.id === estanciaSeleccionadaId) || null;
  },
}));
