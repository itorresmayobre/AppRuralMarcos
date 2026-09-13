import { create } from 'zustand';

export type TipoToast = 'EXITO' | 'ERROR' | 'ADVERTENCIA' | 'INFO';

export interface MensajeToast {
  id: string;
  tipo: TipoToast;
  titulo: string;
  descripcion?: string;
}

interface ToastState {
  toasts: MensajeToast[];
  mostrarToast: (titulo: string, descripcion?: string, tipo?: TipoToast) => void;
  eliminarToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  mostrarToast: (titulo, descripcion, tipo = 'EXITO') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const nuevoToast: MensajeToast = { id, tipo, titulo, descripcion };

    set((state) => ({
      toasts: [...state.toasts, nuevoToast],
    }));

    // Auto-eliminar después de 4.5 segundos
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 4500);
  },

  eliminarToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));
