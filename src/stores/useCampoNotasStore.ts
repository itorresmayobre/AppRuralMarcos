import { create } from 'zustand';

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
  agregarPluviometro: (registro: Omit<RegistroPluviometro, 'id'>) => void;
  agregarNotaCampo: (nota: Omit<NotaCampo, 'id'>) => void;
  obtenerPluviometroEstancia: (estanciaId: string) => RegistroPluviometro[];
  obtenerNotasEstancia: (estanciaId: string) => NotaCampo[];
}

const mockPluviolmetrosIniciales: RegistroPluviometro[] = [
  { id: 'p1', estancia_id: 'est-1', fecha: '2026-09-12', milimetros: 35, observacion: 'Lluvia pareja en todo el campo, beneficio enorme para verdes de verdeo', registrado_por: 'juan.perez' },
  { id: 'p2', estancia_id: 'est-2', fecha: '2026-09-10', milimetros: 18, observacion: 'Chubascos de tarde', registrado_por: 'marcos.propietario' },
];

const mockNotasIniciales: NotaCampo[] = [
  { id: 'n1', estancia_id: 'est-1', fecha: '2026-09-11', titulo: 'Reparar Alambre Portería Norte', descripcion: 'Poste caído por tormenta en el potrero 4. Ganado contenido por electrificador.', prioridad: 'ALTA', creado_por: 'juan.perez' },
  { id: 'n2', estancia_id: 'est-2', fecha: '2026-09-09', titulo: 'Suplementación con Ración', descripcion: 'Comenzar a dar 1.5kg por vaca de cría en el potrero de las achiras.', prioridad: 'MEDIA', creado_por: 'carlos.silva' },
];

export const useCampoNotasStore = create<CampoNotasState>((set, get) => ({
  registrosPluviometro: mockPluviolmetrosIniciales,
  notasCampo: mockNotasIniciales,

  agregarPluviometro: (registro) => {
    const nuevo: RegistroPluviometro = {
      ...registro,
      id: `p-${Date.now()}`,
    };
    set((state) => ({
      registrosPluviometro: [nuevo, ...state.registrosPluviometro],
    }));
  },

  agregarNotaCampo: (nota) => {
    const nueva: NotaCampo = {
      ...nota,
      id: `n-${Date.now()}`,
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
