# 🚜 MANUAL DE USO Y GESTIÓN OPERATIVA - APPRURAL (URUGUAY)

Bienvenido al manual oficial del sistema de gestión rural **AppRural**. Este documento está estructurado por secciones y módulos para facilitar la administración, el registro diario de campo y el análisis financiero bimoneda.

---

## 📌 1. NAVEGACIÓN Y ENCABEZADO GLOBAL

El encabezado superior permanece visible en todas las pantallas de la aplicación:

* **Selector Global de Establecimiento**:
  * Permite cambiar entre un campo específico (ej: *Estancia El Ombú*) o seleccionar **`🏢 Consolidado Empresa (Todas)`**.
  * Al elegir un campo, toda la plataforma (Dashboard, Ganado, Lluvias, Finanzas) filtrará automáticamente la información relativa a ese predio.
* **Menú Lateral (Sidebar)**: Acceso rápido a todos los módulos según el rol del usuario logueado.
* **Perfil de Usuario**: Muestra el nombre, rol asignado (`ADMIN`, `CAPATAZ`, `CONTADOR`, `OPERARIO`) y opción para cerrar sesión o cambiar contraseña.

---

## 📊 2. DASHBOARD GENERAL (PANEL PRINCIPAL)

Es el panel de control inicial de la empresa.

### ¿Qué muestra el Dashboard?
1. **Tarjeta de Métricas del Ejercicio Agrícola en Curso**:
   * Muestra el resumen del ciclo actual (**1º de Julio al 30 de Junio**).
   * **Ingresos Totales**, **Egresos Totales**, **Resultado Neto** e **Indicador $/Ha** (Margen por Hectárea).
2. **Resumen de Stock Ganadero**: Total de cabezas (Vacunos y Ovinos) en el campo o consolidado.
3. **Pluviómetro del Mes**: Total de milímetros acumulados en los últimos 30 días.
4. **Acciones Rápidas (Barra Táctil)**:
   * 💵 **Registrar Transacción**: Abre el modal de caja bimoneda.
   * 🌧️ **Registrar Lluvia**: Abre el modal del pluviómetro.
   * 📝 **Nueva Nota de Campo**: Abre la bitácora de alertas.
   * 🚚 **Traslado de Ganado**: Registra movimientos entre campos.

---

## 🏡 3. ESTABLECIMIENTOS Y CAMPOS (`Establecimientos`)

Administración de las propiedades rurales de la firma.

### ¿Qué muestra?
* Tarjetas resumidas con DICOSE, Departamento, Hectáreas Totales y Pastoreables, y Tipo de Tenencia.
* Total consolidado de hectáreas en producción.

### ¿Qué se ingresa?
* **Registrar Nuevo Establecimiento**:
  * **Nombre**: Ej. *Estancia La Querencia*.
  * **DICOSE Oficial**: Formato `04-123456-7`.
  * **Departamento**: Selector rápido (Salto, Tacuarembó, Paysandú, etc.).
  * **Hectáreas Totales y Pastoreables**: Superficie para el cálculo de $/Ha.
  * **Tipo de Tenencia**: `Propiedad (Campo Propio)`, `Arrendamiento` o `Contrato de Pastoreo`.

---

## 🐮 4. HACIENDA & STOCK GANADERO (`Ganado / Hacienda`)

Control físico del rodeo de vacunos y ovinos.

### ¿Qué muestra?
* Total de cabezas clasificadas por **Especie** (Vacunos 🐮 y Ovinos 🐑).
* Desglose por **Categorías Oficiales**:
  * *Vacunos*: Terneros, Terneras, Novillos 1-2, Novillos +2, Vaquillonas 1-2, Vaquillonas +2, Vacas de Cría, Toros.
  * *Ovinos*: Corderos/as, Ovejas de Cría, Capones, Carneros.

### ¿Qué se ingresa?
* **Ajuste Directo de Stock**: Modificación manual de cabezas o kilos promedio por categoría.
* **Traslado de Ganado entre Campos**: Ver Sección 5.

---

## 🚚 5. TRASLADO DE GANADERO INTERNO (`Modal Traslado`)

Movimiento físico de hacienda entre establecimientos de la empresa con imputación económica opcional.

### ¿Qué se ingresa?
1. **Origen (Sale)** y **Destino (Entra)**.
2. **Especie y Categoría**: (ej: *Vacunos 🐮 ➡️ Terneros*).
3. **Cabezas y Kilos Promedio**: (ej. *50 cabezas • 160 kg/cab*).
4. **☑ Imputar Valor Económico Interno (Rentabilidad por Campo)**:
   * Permite asignarle un precio de mercado interno (ej. `USD 350 / cabeza`).
   * **Efecto**: Acredita un crédito simulado a la estancia origen y un débito a la estancia destino para medir el **margen económico real de la cría frente a la invernada**. A nivel empresa el neto es $0.

---

## 🌧️ 6. PLUVIÓMETRO & NOTAS DE CAMPO

### Pluviómetro:
* Registra los milímetros diarios caídos en cada campo.
* Genera acumulados mensuales y gráficos de precipitaciones.

### Notas de Campo (Bitácora Operativa):
* Registro de novedades de potrero (ej: *Ruptura de alambre en potrero 4*, *Sanidad completada*).
* Niveles de prioridad: `BAJA`, `MEDIA`, `ALTA`.

---

## ⚙️ 7. CONFIGURADOR DE RUBROS Y PRORRATEO (`Rubros & Prorrateo`)

Centro de control de la contabilidad analítica para el Administrador.

### Pestaña A: Catálogo de Rubros
* Habilita o deshabilita los conceptos del Plan Agropecuario que usa la empresa.
* **Crear Rubro Personalizado**: Añadir nuevos rubros indicando si son `Costo Fijo` o `Costo Variable`.

### Pestaña B: Reglas de Prorrateo Corporativo
* Define los porcentajes de repartición de los gastos de estructura central (sueldos de administración, honorarios, UTE central).
* **Deslizadores de Porcentaje**: Ajuste manual por campo.
* **🪄 Botón Autocalcular por Hectáreas Totales**: Reparte los porcentajes de forma proporcional según las hectáreas de cada predio.

---

## 💵 8. FINANZAS Y REGISTRO DE TRANSACCIONES (`Finanzas`)

Ingreso de movimientos de caja bimoneda.

### ¿Qué se ingresa en el Modal de Transacción?
1. **Tipo**: `INGRESO` (Entrada) o `EGRESO` (Salida).
2. **Moneda**: Selector instantáneo `💵 Dólares (USD)` o `🇺🇾 Pesos (UYU)`.
3. **Monto e Indicador de Cotización**:
   * Muestra la cotización del dólar en vivo (ej: `TC: $ 40,50`).
   * Calcula el equivalente bimoneda automático (`$ 81.000 UYU ≈ USD 2.000`).
4. **Categoría / Rubro**: Selección táctil del gasto o venta.
5. **Clasificación de Costo**: `📌 Costo Fijo` o `📈 Costo Variable`.
6. **☑ Repartir este gasto entre varios campos (Prorrateo)**:
   * Al marcar esta casilla, el gasto se distribuye entre los campos respetando la regla porcentual configurada por el Admin.

---

## 📊 9. ESTADÍSTICAS & ANÁLISIS DE RENTABILIDAD (`Estadísticas`)

Módulo exclusivo para Administradores y Contadores.

### ¿Qué muestra?
1. **Resumen de KPIs**: Ingresos, Egresos, Resultado Neto y Margen por Hectárea.
2. **Estructura Fijos vs. Variables**: Proporción visual de costos de estructura frente a costos de producción.
3. **Ranking por Grupo**: Gastos acumulados según el Plan Agropecuario.
4. **Evolución del Ejercicio Agrícola**: Matriz de 12 meses de Julio a Junio.
5. **Matriz de Rentabilidad por Campo**:
   * Muestra por cada establecimiento: Ventas, Traslados salientes (+), Traslados entrantes (-), Egresos reales, **Egresos Prorrateados de Estructura** y **Margen Neto Final ($/Ha/año)**.
   * **Toggle de Análisis**: Permite alternar entre *💵 Caja Bancaria Real* y *📊 Económico (Con Traslados)*.

---

## 👥 10. USUARIOS, ROLES Y SEGURIDAD (`Usuarios`)

### Roles Disponibles:
* `ADMIN`: Propietario / Administrador general. Acceso 100% total.
* `CONTADOR`: Acceso a Finanzas, Estadísticas y Balances. Sin edición de ganado.
* `CAPATAZ`: Registro de hacienda, lluvias y notas. Sin acceso a números financieros.
* `OPERARIO`: Registro básico de tareas de campo.

### Asignación Multi-Campo:
Un empleado puede estar asignado a una estancia específica o tener la casilla **`Acceso Total a Todos los Establecimientos`**.

---

## 📋 11. AUDITORÍA DE OPERACIONES Y BACKLOG DE CRUDS PENDIENTES

Relevamiento de acciones de **Edición (Update)** y **Anulación / Eliminación (Delete)** a implementar en la siguiente fase:

1. **Finanzas y Transacciones**:
   * 🔴 *Edición de Comprobantes*: Modificar fecha, monto, rubro o tipo de cambio de una transacción ingresada con error.
   * 🔴 *Anulación / Eliminación*: Botón con confirmación para revocar o borrar un movimiento.
2. **Hacienda y Stock Ganadero**:
   * 🔴 *Causales de Modificación*: Registro explícito de motivo (Nacimiento/Parición, Muerte/Baja sanitaria, Consumo interno, Ajuste inventario).
   * 🔴 *Anulación de Traslados*: Revocar un traslado de ganado para restituir automáticamente el stock de origen y destino.
3. **Establecimientos y Campos**:
   * 🔴 *Edición de Predio*: Actualizar Hectáreas Totales, DICOSE o Nombre del campo.
   * 🔴 *Dar de Baja / Inactivar Predio*: Para contratos de arrendamiento o pastoreo finalizados.
4. **Notas de Campo y Pluviómetro**:
   * 🔴 *Marcar Nota como "Resuelta"*: Cambiar estado cuando la tarea de campo se completó.
   * 🔴 *Editar / Borrar Precipitaciones*: Corregir milímetros de lluvia mal ingresados.

---

## 🏛️ 12. ARQUITECTURA MULTI-EMPRESA, ESTILOS CENTRALIZADOS Y FOTOS

### A) Escalabilidad Multi-Empresa (Multi-Tenant / SaaS White-Label):
* **Estructura**: La base de datos está preparada para incorporar el campo `empresa_id` (tenant ID) en todas las tablas (`establecimientos`, `perfiles`, `transacciones`, `stock`).
* **Aislamiento Seguro (RLS)**: Las políticas de Supabase (*Row Level Security*) garantizan que la Empresa A jamás pueda consultar los datos o finanzas de la Empresa B.
* **Marca Blanca (White-Label)**: Posibilidad de asignar logo, nombre corporativo y tema de color personalizado por cada firma contratante.

### B) Paleta de Colores y Estilos Centralizados:
* **Variables CSS Globales**: Los colores de la interfaz (Verde Esmeralda Agro, Slate, Rose, Amber) se centralizarán en `index.css` utilizando variables CSS (`--color-primary`, `--color-primary-dark`, `--color-accent`).
* **Cambio Global Instantáneo**: Permite cambiar la paleta completa de toda la aplicación modificando una sola línea de código o adaptando el tema según la empresa logueada.

### C) Almacenamiento de Fotografías de Campo (Supabase Storage):
* **Integración Directa**: Las fotos de potreros, ganado, alambres o comprobantes se subirán directamente a buckets privados/públicos en **Supabase Storage**.
* **Captura Móvil**: Compatible con la cámara del celular/tablet para adjuntar imágenes a las notas de campo (`imagen_url`).

---

*AppRural Uruguay - Sistema de Gestión Agropecuaria Bimoneda.*
