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
    empresa_id: item.empresa_id,
    empresas_asignadas_ids: item.empresa_id ? [item.empresa_id] : ['TODAS'],
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
    telefono_contacto: item.telefono || '',
    departamento_sede: item.departamento_sede,
    hectareas_totales_grupo: Number(item.hectareas_totales_grupo || 0),
    plan: item.plan || 'PRO',
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
    nombre_empresa: item.nombre_empresa,
    rut: item.rut,
    solicitante_nombre: item.nombre_solicitante,
    solicitante_email: item.email,
    solicitante_telefono: item.telefono,
    departamento: item.departamento,
    hectareas_estimadas: Number(item.hectareas_estimadas || 0),
    estancias_estimadas: 1,
    estado: item.estado,
    fecha_solicitud: item.fecha_solicitud,
    observaciones: '',
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
    creado_por: item.creado_por || 'Sistema',
  }));
}

/**
 * Flujo Autónomo de Alta de Cliente Completa en Supabase (Empresa + Campo + Auth + Perfil PROPIETARIO)
 */
export async function registrarClienteAutonomoSupabase(params: {
  nombreEmpresa: string;
  rut: string;
  nombreContacto: string;
  apellidoContacto: string;
  email: string;
  password: string;
  departamento: string;
  nombreCampoInicial: string;
  hectareas: number;
}): Promise<{ exito: boolean; error?: string }> {
  try {
    // 1. Crear Empresa
    const { data: empresaRes, error: errEmpresa } = await supabase
      .from('empresas')
      .insert([{
        razon_social: params.nombreEmpresa,
        nombre_fantasia: params.nombreEmpresa,
        rut: params.rut,
        email_contacto: params.email,
        departamento_sede: params.departamento,
        hectareas_totales_grupo: params.hectareas,
        plan: 'PRO',
        activa: true,
      }])
      .select('id')
      .single();

    if (errEmpresa || !empresaRes) {
      return { exito: false, error: errEmpresa?.message || 'Error creando la empresa' };
    }

    const empresaId = empresaRes.id;

    // 2. Crear Campo / Establecimiento Inicial
    const { error: errCampo } = await supabase
      .from('establecimientos')
      .insert([{
        empresa_id: empresaId,
        nombre: params.nombreCampoInicial,
        dicose: `${params.departamento.substring(0, 2).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}-1`,
        hectareas_totales: params.hectareas,
        hectareas_pastoreables: Math.round(params.hectareas * 0.9),
        departamento: params.departamento,
        tipo_tenencia: 'PROPIO',
        activa: true,
      }]);

    if (errCampo) {
      console.warn('Aviso: No se pudo crear el campo inicial automáticamente:', errCampo.message);
    }

    // 3. Crear Usuario en Supabase Auth
    const { data: authData, error: errAuth } = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
    });

    if (errAuth || !authData.user) {
      return { exito: false, error: errAuth?.message || 'Error registrando usuario en Auth' };
    }

    const userId = authData.user.id;
    const username = `${params.nombreContacto.toLowerCase()}.${params.apellidoContacto.toLowerCase()}`;

    // 4. Crear Perfil en public.perfiles con rol PROPIETARIO
    const { error: errPerfil } = await supabase
      .from('perfiles')
      .insert([{
        id: userId,
        empresa_id: empresaId,
        username: username,
        nombre: params.nombreContacto,
        apellido: params.apellidoContacto,
        email: params.email,
        rol: 'PROPIETARIO',
        activo: true,
      }]);

    if (errPerfil) {
      console.warn('Aviso al crear perfil:', errPerfil.message);
    }

    // 5. Vincular Propietario a la Empresa
    await supabase
      .from('empresas')
      .update({ propietario_usuario_id: userId })
      .eq('id', empresaId);

    return { exito: true };
  } catch (err: any) {
    return { exito: false, error: err?.message || 'Excepción en el alta autónoma' };
  }
}
