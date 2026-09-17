import { createClient } from '@supabase/supabase-js';
import type { 
  Estancia, 
  StockGanadero, 
  TransaccionFinanciera, 
  ReciboSueldo, 
  ConceptoFinanciero,
  UserProfile,
  UsuarioEmpleado
} from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dyzeiwwafcdzwocuksao.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5emVpd3dhZmNkendvY3Vrc2FvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0ODk1MzYsImV4cCI6MjEwNTA2NTUzNn0.x0amIE8dqfhItWLLb3K2O7fjsGBBQ3vzqQ5eZzrcqvI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Formatea errores provenientes de Supabase / PostgreSQL en un mensaje claro y legible en español.
 */
export function formatearErrorSupabase(error: any): string {
  if (!error) return 'Ocurrió un error desconocido.';

  const code = error.code || '';
  const message = error.message || '';
  const details = error.details || '';
  const hint = error.hint || '';

  let mensajeClaro = '';

  switch (code) {
    case '42501':
      mensajeClaro = 'Error de permisos (RLS). Tu usuario o el cliente público no tiene permisos para insertar en esta tabla.';
      break;
    case '23505':
      mensajeClaro = 'Registro duplicado. El correo electrónico o identificador ya se encuentra registrado en el sistema.';
      break;
    case '23503':
      mensajeClaro = 'Referencia inválida. Los datos asociados no existen o fueron eliminados.';
      break;
    case '23502':
      mensajeClaro = 'Faltan campos obligatorios para completar este registro en la base de datos.';
      break;
    case 'PGRST116':
      mensajeClaro = 'No se encontró el registro buscado en la base de datos.';
      break;
    default:
      mensajeClaro = message || 'Error al procesar la solicitud en Supabase.';
  }

  const anexos: string[] = [];
  if (details && details !== 'null') anexos.push(`Detalle: ${details}`);
  if (hint && hint !== 'null') anexos.push(`Sugerencia: ${hint}`);

  if (anexos.length > 0) {
    return `${mensajeClaro} [${anexos.join(' - ')}]`;
  }

  return mensajeClaro;
}

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
    empresa_ids: data.empresa_ids || [],
    estancias_asignadas_ids: ['TODAS'],
  };
}

/**
 * Obtener todos los usuarios / perfiles desde public.perfiles
 */
export async function obtenerUsuariosBD(): Promise<UsuarioEmpleado[]> {
  const { data, error } = await supabase
    .from('perfiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.warn('No se pudieron obtener usuarios de Supabase.', error?.message);
    return [];
  }

  return data.map((item) => ({
    id: item.id,
    email: item.email || '',
    username: item.username || `${item.nombre?.toLowerCase() || 'usuario'}.${item.apellido?.toLowerCase() || ''}`,
    nombre: item.nombre || 'Usuario',
    apellido: item.apellido || '',
    rol: item.rol || 'OPERARIO',
    empresa_ids: item.empresa_ids || [],
    estancias_asignadas_ids: ['TODAS'],
    fecha_alta: item.created_at ? item.created_at.substring(0, 10) : '2026-01-01',
    activo: item.activo !== false,
  }));
}

/**
 * Actualizar rol de un usuario en public.perfiles
 */
export async function actualizarRolBD(usuarioId: string, nuevoRol: string): Promise<boolean> {
  const { error } = await supabase
    .from('perfiles')
    .update({ rol: nuevoRol })
    .eq('id', usuarioId);

  if (error) {
    console.warn('Error actualizando rol en Supabase:', error.message);
    return false;
  }
  return true;
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
    comprobante_url: item.comprobante_url,
    comprobante_tipo: item.comprobante_tipo,
    nro_factura: item.nro_factura,
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
    comprobante_url: tx.comprobante_url || null,
    comprobante_tipo: tx.comprobante_tipo || null,
    nro_factura: tx.nro_factura || null,
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
    recibo_tipo: item.recibo_tipo,
    comprobante_pago_url: item.comprobante_pago_url,
    comprobante_pago_tipo: item.comprobante_pago_tipo,
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

/**
 * Obtener empresas desde Supabase
 */
export async function obtenerEmpresasBD(): Promise<any[]> {
  const { data, error } = await supabase.from('empresas').select('*');
  if (error) {
    console.warn('No se pudieron obtener empresas de Supabase.', error.message);
    return [];
  }
  return data.map((item) => ({
    id: item.id,
    propietario_usuario_id: item.propietario_usuario_id,
    razon_social: item.razon_social,
    nombre_fantasia: item.nombre_fantasia || item.razon_social,
    rut: item.rut,
    email_contacto: item.email_contacto,
    telefono_contacto: item.telefono_contacto || '',
    departamento_sede: item.departamento_sede,
    activa: item.activa ?? true,
    fecha_registro: item.created_at,
  }));
}

/**
 * Obtener solicitudes de registro en línea desde Supabase
 */
export async function obtenerSolicitudesRegistroBD(): Promise<any[]> {
  const { data, error } = await supabase.from('solicitudes_registro').select('*');
  if (error) {
    console.warn('No se pudieron obtener solicitudes de registro de Supabase.', error.message);
    return [];
  }
  return data.map((item) => ({
    id: item.id,
    solicitante_nombre: item.nombre_solicitante,
    solicitante_email: item.email,
    solicitante_telefono: item.telefono || '',
    estado: item.estado,
    fecha_solicitud: item.created_at,
  }));
}

/**
 * Obtener registros de pluviómetro desde Supabase
 */
export async function obtenerPluviometroBD(): Promise<any[]> {
  const { data, error } = await supabase.from('registros_pluviometro').select('*').order('fecha', { ascending: false });
  if (error) {
    console.warn('No se pudieron obtener registros de pluviómetro de Supabase.', error.message);
    return [];
  }
  return data.map((item) => ({
    id: item.id,
    estancia_id: item.establecimiento_id,
    fecha: item.fecha,
    milimetros: Number(item.milimetros),
    observacion: item.observacion || '',
    registrado_por: item.registrado_por || 'Sistema',
  }));
}

/**
 * Obtener notas de campo desde Supabase
 */
export async function obtenerNotasCampoBD(): Promise<any[]> {
  const { data, error } = await supabase.from('notas_campo').select('*').order('fecha', { ascending: false });
  if (error) {
    console.warn('No se pudieron obtener notas de campo de Supabase.', error.message);
    return [];
  }
  return data.map((item) => ({
    id: item.id,
    estancia_id: item.establecimiento_id,
    fecha: item.fecha,
    titulo: item.titulo,
    descripcion: item.descripcion || '',
    prioridad: item.prioridad || 'MEDIA',
    imagen_url: item.imagen_url || null,
    creado_por: item.creado_por || 'Sistema',
  }));
}

/**
 * Registrar una solicitud de alta pendiente de aprobación por el SuperAdmin (Formulario Ligero)
 */
export async function enviarSolicitudRegistroBD(data: {
  nombreContacto: string;
  email: string;
  telefono?: string;
}): Promise<{ exito: boolean; id?: string; error?: string }> {
  try {
    const payload: Record<string, any> = {
      nombre_solicitante: data.nombreContacto,
      email: data.email.trim().toLowerCase(),
    };

    if (data.telefono) payload.telefono = data.telefono;

    const clientePublico = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });

    const { data: res, error } = await clientePublico
      .from('solicitudes_registro')
      .insert([payload])
      .select('id')
      .single();

    if (error) {
      return { exito: false, error: formatearErrorSupabase(error) };
    }

    return { exito: true, id: res.id };
  } catch (err: any) {
    return { exito: false, error: err?.message || 'Error registrando la solicitud.' };
  }
}
