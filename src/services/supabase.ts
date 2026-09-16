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
  nombreContacto: string;
  apellidoContacto?: string;
  email: string;
  password: string;
  rut?: string;
  departamento?: string;
  nombreCampoInicial?: string;
  hectareas?: number;
}): Promise<{ exito: boolean; error?: string }> {
  try {
    const emailNormalizado = params.email.trim().toLowerCase();
    const depto = params.departamento || 'Soriano';
    const rutFinal = params.rut?.trim() || '210000000000';
    const campoNombre = params.nombreCampoInicial?.trim() || 'Estancia Por Defecto';
    const totalHa = params.hectareas || 500;

    let userId: string | undefined = undefined;

    // 1. Crear o Autenticar Usuario en Supabase Auth (Auto-recuperación si quedó registrado previamente)
    const { data: authData, error: errAuth } = await supabase.auth.signUp({
      email: emailNormalizado,
      password: params.password,
    });

    if (errAuth) {
      if (errAuth.message.includes('already registered') || errAuth.status === 400) {
        // El usuario ya existía en Auth (ej. por intento anterior bloqueado por RLS). Intentamos autenticarlo:
        const { data: signInData, error: errSignIn } = await supabase.auth.signInWithPassword({
          email: emailNormalizado,
          password: params.password,
        });

        if (!errSignIn && signInData?.user) {
          userId = signInData.user.id;
        } else {
          return {
            exito: false,
            error: 'El correo electrónico ya se encuentra registrado. Si es tu cuenta, ingresa tu contraseña correcta en el Login.',
          };
        }
      } else {
        return { exito: false, error: errAuth.message };
      }
    } else {
      userId = authData.user?.id;
    }

    if (!userId) {
      return { exito: false, error: 'No se pudo generar ni autenticar el usuario en Auth.' };
    }

    // 1.5 Asegurar token JWT activo en la sesión
    try {
      await supabase.auth.signInWithPassword({
        email: emailNormalizado,
        password: params.password,
      });
    } catch {
      // Ignorar si requiere confirmación por email
    }

    // 2. Verificar si la Empresa ya existe o debe crearse
    let empresaId: string | undefined = undefined;

    const { data: empresaExistente } = await supabase
      .from('empresas')
      .select('id')
      .eq('propietario_usuario_id', userId)
      .maybeSingle();

    if (empresaExistente?.id) {
      empresaId = empresaExistente.id;
    } else {
      const { data: empresaRes, error: errEmpresa } = await supabase
        .from('empresas')
        .insert([{
          razon_social: params.nombreEmpresa,
          nombre_fantasia: params.nombreEmpresa,
          rut: rutFinal,
          email_contacto: emailNormalizado,
          departamento_sede: depto,
          propietario_usuario_id: userId,
          hectareas_totales_grupo: totalHa,
          plan: 'PRO',
          activa: true,
        }])
        .select('id')
        .single();

      if (errEmpresa || !empresaRes) {
        let msg = errEmpresa?.message || 'Error creando la empresa en la base de datos';
        if (errEmpresa?.code === '42501') {
          msg = 'Error de permisos RLS en Supabase (42501). Recuerda ejecutar las políticas SQL en el panel de Supabase.';
        }
        return { exito: false, error: msg };
      }
      empresaId = empresaRes.id;
    }

    // 3. Crear Campo / Establecimiento Inicial ("Estancia Por Defecto") si no existe
    const { data: camposExistentes } = await supabase
      .from('establecimientos')
      .select('id')
      .eq('empresa_id', empresaId);

    if (!camposExistentes || camposExistentes.length === 0) {
      await supabase
        .from('establecimientos')
        .insert([{
          empresa_id: empresaId,
          nombre: campoNombre,
          dicose: `00-000000-0`,
          hectareas_totales: totalHa,
          hectareas_pastoreables: Math.round(totalHa * 0.9),
          departamento: depto,
          tipo_tenencia: 'PROPIO',
          activa: true,
        }]);
    }

    // 4. Crear Perfil en public.perfiles con rol PROPIETARIO si no existe
    const { data: perfilExistente } = await supabase
      .from('perfiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (!perfilExistente) {
      const ape = params.apellidoContacto?.trim() || 'Propietario';
      const username = `${params.nombreContacto.toLowerCase().replace(/\s+/g, '')}.${ape.toLowerCase().replace(/\s+/g, '')}`;

      const { error: errPerfil } = await supabase
        .from('perfiles')
        .insert([{
          id: userId,
          empresa_id: empresaId,
          username: username,
          nombre: params.nombreContacto,
          apellido: ape,
          email: emailNormalizado,
          rol: 'PROPIETARIO',
          activo: true,
        }]);

      if (errPerfil) {
        console.warn('Aviso al crear perfil:', errPerfil.message);
      }
    }

    return { exito: true };
  } catch (err: any) {
    return { exito: false, error: err?.message || 'Excepción imprevista en el alta de la empresa.' };
  }
}
