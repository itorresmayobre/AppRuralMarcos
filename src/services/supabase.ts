import { createClient } from '@supabase/supabase-js';
import type { 
  Estancia, 
  StockGanadero, 
  TransaccionFinanciera, 
  ReciboSueldo, 
  ConceptoFinanciero,
  UserProfile
} from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dyzeiwwafcdzwocuksao.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5emVpd3dhZmNkendvY3Vrc2FvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0ODk1MzYsImV4cCI6MjEwNTA2NTUzNn0.x0amIE8dqfhItWLLb3K2O7fjsGBBQ3vzqQ5eZzrcqvI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ==============================================================================
// 1. FUNCIONES DE ALMACENAMIENTO (SUPABASE STORAGE BUCKETS)
// ==============================================================================

/**
 * Sube un archivo (PDF o Imagen) a un Bucket de Supabase Storage y retorna la URL pública o firmada.
 */
export async function subirArchivoStorage(
  bucket: 'fotos-campo' | 'facturas-comprobantes' | 'recibos-sueldo',
  path: string,
  file: File
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.error(`Error subiendo archivo a ${bucket}:`, error.message);
      return null;
    }

    if (bucket === 'fotos-campo') {
      const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(data.path);
      return publicData.publicUrl;
    } else {
      // Buckets privados: generar signed URL por 1 año
      const { data: signedData, error: signedErr } = await supabase.storage
        .from(bucket)
        .createSignedUrl(data.path, 60 * 60 * 24 * 365);
      
      if (signedErr) {
        console.error('Error generando signed URL:', signedErr.message);
        return null;
      }
      return signedData.signedUrl;
    }
  } catch (err) {
    console.error('Excepción al subir archivo a Storage:', err);
    return null;
  }
}

// ==============================================================================
// 2. FUNCIONES DE BASE DE DATOS POSTGRESQL (POSTGREST API)
// ==============================================================================

/**
 * Obtener perfil de usuario desde public.perfiles
 */
export async function obtenerPerfilUsuarioBD(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('perfiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    email: data.email,
    username: data.username,
    nombre: data.nombre,
    apellido: data.apellido,
    rol: data.rol,
    empresa_id: data.empresa_id,
    estancias_asignadas_ids: ['TODAS'],
  };
}

/**
 * Obtener establecimientos de la base de datos
 */
export async function obtenerEstablecimientosBD(): Promise<Estancia[]> {
  const { data, error } = await supabase.from('establecimientos').select('*');
  if (error) {
    console.warn('No se pudieron obtener establecimientos de Supabase.', error.message);
    return [];
  }
  return data as Estancia[];
}

/**
 * Obtener stock ganadero de la base de datos
 */
export async function obtenerStockGanaderoBD(): Promise<StockGanadero[]> {
  const { data, error } = await supabase.from('stock_ganadero').select('*');
  if (error) {
    console.warn('No se pudo obtener stock ganadero de Supabase.', error.message);
    return [];
  }
  return data.map((item) => ({
    id: item.id,
    estancia_id: item.establecimiento_id,
    especie: item.especie,
    categoria: item.categoria,
    cabezas: item.cabezas,
    kilos_promedio: item.kilos_promedio,
    ultima_actualizacion: item.ultima_actualizacion,
  }));
}

/**
 * Obtener transacciones financieras de la base de datos
 */
export async function obtenerTransaccionesBD(): Promise<TransaccionFinanciera[]> {
  const { data, error } = await supabase
    .from('transacciones_financieras')
    .select('*')
    .order('fecha', { ascending: false });

  if (error) {
    console.warn('No se pudieron obtener transacciones de Supabase.', error.message);
    return [];
  }

  return data.map((item) => ({
    id: item.id,
    estancia_id: item.establecimiento_id,
    tipo: item.tipo,
    moneda: item.moneda,
    monto: Number(item.monto),
    categoria: item.categoria,
    descripcion: item.descripcion || '',
    fecha: item.fecha,
    creado_por_usuario: item.creado_por || 'Sistema',
    ejercicio_agricola: item.ejercicio_agricola,
    periodo_mes: item.periodo_mes,
    naturaleza_costo: item.naturaleza_costo,
    es_prorrateado: item.es_prorrateado,
    distribucion_prorrateo: item.distribucion_prorrateo,
    moneda_original: item.moneda_original,
    monto_original: item.monto_original,
    tipo_cambio: item.tipo_cambio,
    monto_usd: item.monto_usd,
    monto_uyu: item.monto_uyu,
  }));
}

/**
 * Guardar nueva transacción en Supabase
 */
export async function guardarTransaccionBD(tx: Omit<TransaccionFinanciera, 'id' | 'creado_por_usuario'> | Omit<TransaccionFinanciera, 'id'>): Promise<string | null> {
  const payload = {
    establecimiento_id: tx.estancia_id,
    tipo: tx.tipo,
    moneda: tx.moneda,
    monto: tx.monto,
    categoria: tx.categoria,
    descripcion: tx.descripcion,
    fecha: tx.fecha,
    ejercicio_agricola: tx.ejercicio_agricola,
    periodo_mes: tx.periodo_mes,
    naturaleza_costo: tx.naturaleza_costo,
    es_prorrateado: tx.es_prorrateado || false,
    distribucion_prorrateo: tx.distribucion_prorrateo || null,
    moneda_original: tx.moneda_original,
    monto_original: tx.monto_original,
    tipo_cambio: tx.tipo_cambio,
    monto_usd: tx.monto_usd,
    monto_uyu: tx.monto_uyu,
  };

  const { data, error } = await supabase
    .from('transacciones_financieras')
    .insert([payload])
    .select('id')
    .single();

  if (error) {
    console.error('Error insertando transacción en Supabase:', error.message);
    return null;
  }
  return data.id;
}

/**
 * Obtener recibos de sueldo desde Supabase
 */
export async function obtenerRecibosSueldoBD(): Promise<ReciboSueldo[]> {
  const { data, error } = await supabase.from('recibos_sueldo').select('*');
  if (error) {
    console.warn('No se pudieron obtener recibos de sueldo de Supabase.', error.message);
    return [];
  }
  return data.map((item) => ({
    id: item.id,
    empresa_id: item.empresa_id,
    usuario_id: item.usuario_id,
    transaccion_id: item.transaccion_id,
    periodo_mes: item.periodo_mes,
    ejercicio_agricola: item.ejercicio_agricola,
    monto_liquido: Number(item.monto_liquido),
    moneda: item.moneda,
    fecha_pago: item.fecha_pago,
    recibo_url: item.recibo_url,
    estado_firma: item.estado_firma,
    observaciones: item.observaciones,
  }));
}

/**
 * Obtener catálogo de rubros / conceptos financieros desde Supabase
 */
export async function obtenerConceptosFinancierosBD(): Promise<ConceptoFinanciero[]> {
  const { data, error } = await supabase.from('conceptos_financieros').select('*');
  if (error) {
    console.warn('No se pudieron obtener conceptos financieros de Supabase.', error.message);
    return [];
  }
  return data as ConceptoFinanciero[];
}
