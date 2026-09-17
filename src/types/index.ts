export type UserRole = 'SUPERADMIN' | 'PROPIETARIO' | 'ADMIN' | 'CAPATAZ' | 'CONTADOR' | 'OPERARIO';

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  nombre: string;
  apellido: string;
  rol: UserRole;
  empresa_id?: string;
  empresa_ids?: string[];
  empresas_asignadas_ids?: string[];
  estancias_asignadas_ids: string[];
}

export interface PermisoRol {
  ver_dashboard: boolean;
  ver_ganado: boolean;
  editar_ganado: boolean;
  ver_finanzas: boolean;
  editar_finanzas: boolean;
  ver_estancias: boolean;
  editar_estancias: boolean;
  administrar_usuarios: boolean;
  ver_consola_dev?: boolean;
}

export interface UsuarioEmpleado extends UserProfile {
  fecha_alta: string;
  activo: boolean;
}

export type PlanSaaS = 'BASIC' | 'STARTER' | 'PRO' | 'ENTERPRISE';

export interface SuscripcionPropietario {
  id: string;
  propietario_usuario_id: string;
  plan: PlanSaaS;
  max_empresas: number;
  max_establecimientos: number;
  max_usuarios: number;
  estado: 'ACTIVA' | 'SUSPENDIDA' | 'CANCELADA';
  created_at?: string;
}

export interface Empresa {
  id: string;
  propietario_usuario_id?: string;
  razon_social: string;
  nombre_fantasia: string;
  rut: string;
  email_contacto: string;
  telefono_contacto: string;
  departamento_sede: string;
  hectareas_totales_grupo?: number;
  plan?: PlanSaaS;
  activa: boolean;
  fecha_registro: string;
}

export type EstadoSolicitud = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';

export interface SolicitudRegistro {
  id: string;
  nombre_solicitante: string;
  email: string;
  telefono?: string;
  nombre_empresa?: string;
  rut?: string;
  departamento?: string;
  hectareas_estimadas?: number;
  estancias_estimadas?: number;
  solicitante_nombre?: string;
  solicitante_email?: string;
  solicitante_telefono?: string;
  estado: EstadoSolicitud;
  fecha_solicitud: string;
  observaciones?: string;
}

export type TipoTenencia = 'PROPIO' | 'ARRENDADO' | 'PASTOREO';

export interface Estancia {
  id: string;
  empresa_id?: string;
  nombre: string;
  dicose: string;
  hectareas_totales: number;
  hectareas_pastoreables: number;
  departamento: string;
  ubicacion_localidad?: string;
  tipo_tenencia: TipoTenencia;
  activa: boolean;
}

export type EspecieGanado = 'VACUNO' | 'OVINO';

export type CategoriaVacuno = 
  | 'VACAS_DE_CRIA'
  | 'VAQUILLONAS_1_2'
  | 'VAQUILLONAS_MAS_2'
  | 'NOVILLOS_1_2'
  | 'NOVILLOS_MAS_2'
  | 'TERNEROS'
  | 'TERNERAS'
  | 'TOROS';

export type CategoriaOvino = 
  | 'OVEJAS_CRIA'
  | 'CAPONES'
  | 'CORDEROS_AS'
  | 'CARNEROS';

export interface StockGanadero {
  id: string;
  estancia_id: string;
  empresa_id?: string;
  especie: EspecieGanado;
  categoria: CategoriaVacuno | CategoriaOvino;
  cabezas: number;
  kilos_promedio?: number;
  ultima_actualizacion: string;
}

export type TipoTransaccion = 'INGRESO' | 'EGRESO';
export type Moneda = 'USD' | 'UYU';

export type CategoriaFinanciera = 
  | 'VENTA_HACIENDA'
  | 'COMPRA_HACIENDA'
  | 'INSUMOS_VETERINARIOS'
  | 'RACION_SUPLEMENTOS'
  | 'COMBUSTIBLE'
  | 'PASTURAS_AGRO'
  | 'HONORARIOS_SERVICIOS'
  | 'MANTENIMIENTO_ALAMBRES'
  | 'ARRENDAMIENTO_CAMPO'
  | 'GASTOS_GENERALES';

export type NaturalezaCosto = 'FIJO' | 'VARIABLE';

export interface DistribucionProrrateoItem {
  estancia_id: string;
  porcentaje: number;
  monto: number;
}

export interface ReglaProrrateoEstablecimiento {
  estancia_id: string;
  porcentaje_predeterminado: number;
}

export interface TransaccionFinanciera {
  id: string;
  estancia_id: string;
  empresa_id?: string;
  tipo: TipoTransaccion;
  moneda: Moneda;
  monto: number;
  categoria: string;
  descripcion: string;
  fecha: string;
  creado_por_usuario: string;
  ejercicio_agricola?: string;
  periodo_mes?: string;
  naturaleza_costo?: NaturalezaCosto;
  es_prorrateado?: boolean;
  distribucion_prorrateo?: DistribucionProrrateoItem[];
  moneda_original?: Moneda;
  monto_original?: number;
  tipo_cambio?: number;
  monto_usd?: number;
  monto_uyu?: number;
  comprobante_url?: string;
  comprobante_tipo?: 'IMAGE' | 'PDF';
  nro_factura?: string;
}

export interface ConceptoFinanciero {
  id: string;
  tipo: TipoTransaccion;
  grupo: string;
  nombre: string;
  icono: string;
  es_estandar?: boolean;
  naturaleza_costo?: NaturalezaCosto;
  es_recurrente_mensual?: boolean;
}

export interface ConceptoEmpresaConfig {
  concepto_id: string;
  activo: boolean;
  monto_recurrente_default?: number;
}

export interface MovimientoGanado {
  id: string;
  estancia_origen_id: string;
  estancia_destino_id: string;
  empresa_id?: string;
  especie: EspecieGanado;
  categoria: CategoriaVacuno | CategoriaOvino;
  cabezas: number;
  kilos_totales?: number;
  kilos_promedio?: number;
  fecha: string;
  observaciones?: string;
  valorizar_transferencia?: boolean;
  precio_por_cabeza?: number;
  precio_por_kilo?: number;
  monto_total_imputado: number;
  creado_por_usuario: string;
}

export type EstadoFirmaRecibo = 'PENDIENTE' | 'FIRMADO' | 'CONFORME';

export interface ReciboSueldo {
  id: string;
  empresa_id: string;
  usuario_id: string;
  usuario_nombre?: string;
  transaccion_id?: string;
  periodo_mes: string;
  ejercicio_agricola: string;
  monto_liquido: number;
  moneda: Moneda;
  fecha_pago: string;
  recibo_url?: string;
  recibo_tipo?: 'IMAGE' | 'PDF';
  comprobante_pago_url?: string;
  comprobante_pago_tipo?: 'IMAGE' | 'PDF';
  estado_firma: EstadoFirmaRecibo;
  observaciones?: string;
}

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
  descripcion?: string;
  prioridad: 'BAJA' | 'MEDIA' | 'ALTA';
  imagen_url?: string;
  creado_por: string;
}
