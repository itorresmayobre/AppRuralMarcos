import type { ConceptoFinanciero } from '../../types';
import { obtenerConceptosFinancierosBD, supabase } from '../supabase';

export const conceptosService = {
  /**
   * Obtiene el catálogo completo de conceptos del Plan Agropecuario desde Supabase.
   */
  async obtenerCatalogoCompleto(): Promise<ConceptoFinanciero[]> {
    return obtenerConceptosFinancierosBD();
  },

  /**
   * Obtiene los IDs de los conceptos activos para la empresa del usuario autenticado desde `conceptos_activos_empresa`.
   */
  async obtenerConceptosActivosEmpresa(): Promise<string[]> {
    const { data, error } = await supabase.from('conceptos_activos_empresa').select('concepto_id').eq('activo', true);
    if (error || !data) {
      const todos = await obtenerConceptosFinancierosBD();
      return todos.map((c) => c.id);
    }
    return data.map((d) => d.concepto_id);
  },

  /**
   * Guarda los conceptos activos seleccionados por el Administrador en la tabla `conceptos_activos_empresa`.
   */
  async guardarConfiguracionConceptos(conceptosActivosIds: string[]): Promise<boolean> {
    if (!conceptosActivosIds || conceptosActivosIds.length === 0) {
      throw new Error('Debe haber al menos 1 concepto activo para la empresa.');
    }

    try {
      // Importación dinámica de stores para no generar referencias circulares
      const { useEmpresasStore } = await import('../../stores/useEmpresasStore');
      const { useAuthStore } = await import('../../stores/useAuthStore');

      const empresaIdReal = useEmpresasStore.getState().empresaSeleccionadaId || useAuthStore.getState().usuario?.empresa_ids?.[0];

      if (empresaIdReal) {
        const payload = conceptosActivosIds.map((id) => ({
          empresa_id: empresaIdReal,
          concepto_id: id,
          activo: true,
        }));

        await supabase.from('conceptos_activos_empresa').upsert(payload, { onConflict: 'empresa_id,concepto_id' });
      }
    } catch (e) {
      console.warn('Aviso al guardar configuración de conceptos en Supabase:', e);
    }
    return true;
  },

  /**
   * Permite al Administrador registrar un concepto personalizado nuevo.
   */
  async crearConceptoPersonalizado(nuevo: Omit<ConceptoFinanciero, 'id' | 'es_estandar'>): Promise<ConceptoFinanciero> {
    const newId = `custom-${Date.now()}`;
    const conceptoCreado: ConceptoFinanciero = {
      ...nuevo,
      id: newId,
      es_estandar: false,
    };

    try {
      await supabase.from('conceptos_financieros').insert([{
        id: newId,
        tipo: nuevo.tipo,
        grupo: nuevo.grupo,
        nombre: nuevo.nombre,
        icono: nuevo.icono || '📋',
        es_estandar: false,
        naturaleza_costo: nuevo.naturaleza_costo || null,
      }]);
    } catch (e) {
      console.warn('Error guardando en Supabase:', e);
    }

    return conceptoCreado;
  }
};
