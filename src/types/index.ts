export type UserRole = 'ADMIN' | 'CAPATAZ' | 'CONTADOR' | 'OPERARIO';

export interface UserProfile {
  id: string;
  email: string;
  username: string; // Nombre de usuario para login (ej: "marcos.propietario")
  nombre: string;
  apellido: string;
  rol: UserRole;
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
}

export interface UsuarioEmpleado extends UserProfile {
  fecha_alta: string;
  activo: boolean;
}

export type TipoTenencia = 'PROPIO' | 'ARRENDADO' | 'PASTOREO';

export interface Estancia {
  id: string;
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

export interface TransaccionFinanciera {
  id: string;
  estancia_id: string;
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



