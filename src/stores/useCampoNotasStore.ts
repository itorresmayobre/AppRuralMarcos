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
  cargarNotasYPluviometroDesdeSupabase: () => Promise<void>;
  agregarPluviometro: (registro: Omit<RegistroPluviometro, 'id'>) => Promise<void>;
  agregarNotaCampo: (nota: Omit<NotaCampo, 'id'>) => Promise<void>;
  obtenerPluviometroEstancia: (estanciaId: string) => RegistroPluviometro[];
  obtenerNotasEstancia: (estanciaId: string) => NotaCampo[];
}

export const useCampoNotasStore = create<CampoNotasState>((set, get) => ({
  registrosPluviometro: [],
  notasCampo: [],
  cargando: false,

  cargarNotasYPluviometroDesdeSupabase: async () => {
    set({ cargando: true });
    const [pluviometroBD, notasBD] = await Promise.all([
      obtenerPluviometroBD(),
      obtenerNotasCampoBD()
    ]);

    set({
      registrosPluviometro: pluviometroBD,
      notasCampo: notasBD,
      cargando: false,
    });
  },

  agregarPluviometro: async (registro) => {
    let newId = `p-${Date.now()}`;

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

      if (!error && data) {
        newId = data.id;
      }
    } catch (e) {
      console.warn('Error insertando pluviómetro en Supabase:', e);
    }

    const nuevo: RegistroPluviometro = {
      ...registro,
      id: newId,
    };
    set((state) => ({
      registrosPluviometro: [nuevo, ...state.registrosPluviometro],
    }));
  },

  agregarNotaCampo: async (nota) => {
    let newId = `n-${Date.now()}`;

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

      if (!error && data) {
        newId = data.id;
      }
    } catch (e) {
      console.warn('Error insertando nota de campo en Supabase:', e);
    }

    const nueva: NotaCampo = {
      ...nota,
      id: newId,
    };
    set((state) => ({
      notasCampo: [nueva, ...state.notasCampo],
    }));
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
