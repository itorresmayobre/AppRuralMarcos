export type UserRole = 'SUPERADMIN' | 'PROPIETARIO' | 'ADMIN' | 'CAPATAZ' | 'CONTADOR' | 'OPERARIO';

export interface UserProfile {
  id: string;
  email: string;
  username: string; // Nombre de usuario para login (ej: "marcos.propietario")
  nombre: string;
  apellido: string;
  rol: UserRole;
  empresa_id?: string; // ID de la empresa principal a la que pertenece
  empresas_asignadas_ids?: string[]; // Lista de IDs de empresas asignadas a las que tiene acceso (ej: ['emp-1', 'emp-2'] o ['TODAS'])
  estancias_asignadas_ids: string[]; // Lista de IDs de estancias asignadas (ej: ['est-1', 'est-2'] o ['TODAS'])
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

export type PlanSaaS = 'BASIC' | 'PRO' | 'ENTERPRISE';

export interface Empresa {
  id: string;
  propietario_usuario_id?: string; // ID del usuario Propietario (titular inamovible)
  razon_social: string;
  nombre_fantasia: string;
  rut: string;
  email_contacto: string;
  telefono_contacto: string;
  departamento_sede: string;
  hectareas_totales_grupo: number;
  plan: PlanSaaS;
  activa: boolean;
  fecha_registro: string;
}

export type EstadoSolicitud = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';

export interface SolicitudRegistro {
  id: string;
  nombre_empresa: string;
  rut: string;
  solicitante_nombre: string;
  solicitante_email: string;
  solicitante_telefono: string;
  departamento: string;
  hectareas_estimadas: number;
  estancias_estimadas: number;
  estado: EstadoSolicitud;
  fecha_solicitud: string;
  observaciones?: string;
}

export type TipoTenencia = 'PROPIO' | 'ARRENDADO' | 'PASTOREO';

export interface Estancia {
  id: string;
  empresa_id?: string;
  nombre: string;
  dicose: string; // Código DICOSE Uruguay (ej: 04-123456-7)
  hectareas_totales: number;
  hectareas_pastoreables: number;
  departamento: string;
  ubicacion_localidad: string;
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
  ejercicio_agricola?: string; // ej: "2025-2026"
  periodo_mes?: string; // ej: "Julio", "Agosto", ..., "Junio"
  naturaleza_costo?: NaturalezaCosto;
  // Campos de Prorrateo entre Campos
  es_prorrateado?: boolean;
  distribucion_prorrateo?: DistribucionProrrateoItem[];
  // Campos de Cotización Bimoneda
  moneda_original?: Moneda;
  monto_original?: number;
  tipo_cambio?: number;
  monto_usd?: number;
  monto_uyu?: number;
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
  valorizar_transferencia: boolean;
  precio_por_cabeza?: number;
  precio_por_kilo?: number;
  monto_total_imputado: number;
  creado_por_usuario: string;
}

export type EstadoFirmaRecibo = 'PENDIENTE' | 'FIRMADO' | 'CONFORME';

export interface ReciboSueldo {
  id: string;
  empresa_id: string;
  usuario_id: string; // Empleado que cobra
  usuario_nombre?: string;
  transaccion_id?: string;
  periodo_mes: string; // ej: "Setiembre 2026"
  ejercicio_agricola: string;
  monto_liquido: number;
  moneda: Moneda;
  fecha_pago: string;
  recibo_url: string; // PDF o foto del recibo en Storage
  estado_firma: EstadoFirmaRecibo;
  observaciones?: string;
}
