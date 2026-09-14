import type { ConceptoFinanciero } from '../../types';
import { CATALOGO_PLAN_AGROPECUARIO } from '../../stores/useConceptosFinancierosStore';

export const conceptosService = {
  /**
   * Obtiene el catálogo completo de conceptos del Plan Agropecuario desde Supabase.
   */
  async obtenerCatalogoCompleto(): Promise<ConceptoFinanciero[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(CATALOGO_PLAN_AGROPECUARIO);
      }, 200);
    });
  },

  /**
   * Obtiene los IDs de los conceptos activos para la empresa del usuario autenticado desde `conceptos_activos_empresa`.
   */
  async obtenerConceptosActivosEmpresa(): Promise<string[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // En producción: SELECT concepto_id FROM conceptos_activos_empresa WHERE activo = true
        const storageVal = localStorage.getItem('conceptos-financieros-agro-storage');
        if (storageVal) {
          try {
            const parsed = JSON.parse(storageVal);
            if (parsed.state?.conceptosActivosIds) {
              return resolve(parsed.state.conceptosActivosIds);
            }
          } catch {
            // Fallback
          }
        }
        resolve([
          'ing-vacunos', 'ing-lanares', 'ing-lana', 'ing-cereales', 'ing-brou', 'ing-pastoreos',
          'egr-sanidad', 'egr-racion', 'egr-combustible', 'egr-pasturas', 'egr-alambres', 'egr-sueldos'
        ]);
      }, 250);
    });
  },

  /**
   * Guarda los conceptos activos seleccionados por el Administrador en la tabla `conceptos_activos_empresa`.
   */
  async guardarConfiguracionConceptos(conceptosActivosIds: string[]): Promise<boolean> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!conceptosActivosIds || conceptosActivosIds.length === 0) {
          return reject(new Error('Debe haber al menos 1 concepto activo para la empresa.'));
        }
        // En producción: DELETE FROM conceptos_activos_empresa; INSERT INTO conceptos_activos_empresa ...
        resolve(true);
      }, 350);
    });
  },

  /**
   * Permite al Administrador registrar un concepto personalizado nuevo.
   */
  async crearConceptoPersonalizado(nuevo: Omit<ConceptoFinanciero, 'id' | 'es_estandar'>): Promise<ConceptoFinanciero> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const conceptoCreado: ConceptoFinanciero = {
          ...nuevo,
          id: `custom-${Date.now()}`,
          es_estandar: false,
        };
        resolve(conceptoCreado);
      }, 300);
    });
  }
};
