import { create } from 'zustand';
import { obtenerPluviometroBD, obtenerNotasCampoBD, supabase } from '../services/supabase';

export interface RegistroPluviometro {
  id: string;
  estancia_id: string;
  fecha: string;
  milimetros: number;
  observacion?: string;
  registrado_por: string;
}

export interface NotaCampo {
  id: string;
  estancia_id: string;
  fecha: string;
  titulo: string;
  descripcion: string;
  prioridad: 'ALTA' | 'MEDIA' | 'BAJA';
  creado_por: string;
}

interface CampoNotasState {
  registrosPluviometro: RegistroPluviometro[];
  notasCampo: NotaCampo[];
  cargando: boolean;
  inicializado: boolean;
  cargarNotasYPluviometroDesdeSupabase: () => Promise<void>;
  agregarPluviometro: (registro: Omit<RegistroPluviometro, 'id'>) => Promise<{ success: boolean; error?: string }>;
  agregarNotaCampo: (nota: Omit<NotaCampo, 'id'>) => Promise<{ success: boolean; error?: string }>;
  obtenerPluviometroEstancia: (estanciaId: string) => RegistroPluviometro[];
  obtenerNotasEstancia: (estanciaId: string) => NotaCampo[];
}

export const useCampoNotasStore = create<CampoNotasState>((set, get) => ({
  registrosPluviometro: [],
  notasCampo: [],
  cargando: false,
  inicializado: false,

  cargarNotasYPluviometroDesdeSupabase: async () => {
    set({ cargando: true });
    const [pluviometroBD, notasBD] = await Promise.all([
      obtenerPluviometroBD(),
      obtenerNotasCampoBD()
    ]);

    set({
      registrosPluviometro: pluviometroBD || [],
      notasCampo: notasBD || [],
      cargando: false,
      inicializado: true,
    });
  },

  agregarPluviometro: async (registro) => {
    if (!registro.estancia_id) {
      return { success: false, error: 'Debes seleccionar un establecimiento para registrar la lluvia.' };
    }

    try {
      const payload = {
        establecimiento_id: registro.estancia_id,
        fecha: registro.fecha,
        milimetros: registro.milimetros,
        observacion: registro.observacion || null,
      };

      const { data, error } = await supabase
        .from('registros_pluviometro')
        .insert([payload])
        .select('id')
        .single();

      if (error) {
        console.error('Error insertando pluviómetro en Supabase:', error.message);
        return { success: false, error: error.message };
      }

      const nuevo: RegistroPluviometro = {
        ...registro,
        id: data.id,
      };

      set((state) => ({
        registrosPluviometro: [nuevo, ...state.registrosPluviometro],
      }));

      return { success: true };
    } catch (e: any) {
      console.error('Error insertando pluviómetro:', e);
      return { success: false, error: e?.message || 'Error inesperado al conectar con el servidor.' };
    }
  },

  agregarNotaCampo: async (nota) => {
    if (!nota.estancia_id) {
      return { success: false, error: 'Debes seleccionar un establecimiento para registrar la nota de campo.' };
    }

    try {
      const payload = {
        establecimiento_id: nota.estancia_id,
        fecha: nota.fecha,
        titulo: nota.titulo,
        descripcion: nota.descripcion,
        prioridad: nota.prioridad,
      };

      const { data, error } = await supabase
        .from('notas_campo')
        .insert([payload])
        .select('id')
        .single();

      if (error) {
        console.error('Error insertando nota de campo en Supabase:', error.message);
        return { success: false, error: error.message };
      }

      const nueva: NotaCampo = {
        ...nota,
        id: data.id,
      };

      set((state) => ({
        notasCampo: [nueva, ...state.notasCampo],
      }));

      return { success: true };
    } catch (e: any) {
      console.error('Error insertando nota de campo:', e);
      return { success: false, error: e?.message || 'Error inesperado al conectar con el servidor.' };
    }
  },

  obtenerPluviometroEstancia: (estanciaId: string) => {
    const { registrosPluviometro } = get();
    if (estanciaId === 'TODAS') return registrosPluviometro;
    return registrosPluviometro.filter((r) => r.estancia_id === estanciaId);
  },

  obtenerNotasEstancia: (estanciaId: string) => {
    const { notasCampo } = get();
    if (estanciaId === 'TODAS') return notasCampo;
    return notasCampo.filter((n) => n.estancia_id === estanciaId);
  },
}));
