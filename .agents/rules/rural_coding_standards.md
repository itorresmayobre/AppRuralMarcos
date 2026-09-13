# Reglas y Estándares de Desarrollo: App Rural Uruguay (React + TS)

Este documento establece las reglas obligatorias de código para mantener el proyecto limpio, mantenible, escalable y con un lenguaje fiel al sector agropecuario uruguayo.

---

## 🌾 1. Dominio Agronómico y Ganadero Uruguayo (Glosario Oficial)

### A. Conceptos Fundamentales
* **`Estancia` / `Campo` / `Establecimiento`**: El predio físico o propiedad rural identificada por su código de **DICOSE** (ej. *Estancia El Ombú*).
* **`Ganado` / `Hacienda`**: El conjunto de animales (vacunos u ovinos) criados en la estancia.
* **`Potrero` / `Parcela`**: Subdivisión del campo donde pastan las tropas.
* **`Tropa` / `Lote`**: Grupo de animales manejados juntos en un potrero.

### B. Categorías DICOSE
* **`CategoriasVacunas`**: `VACAS_DE_CRIA`, `VAQUILLONAS_1_2`, `VAQUILLONAS_MAS_2`, `NOVILLOS_1_2`, `NOVILLOS_MAS_2`, `TERNEROS`, `TERNERAS`, `TOROS`.
* **`CategoriasOvinas`**: `OVEJAS_CRIA`, `CAPONES`, `CORDEROS_AS`, `CARNEROS`, `BORREGOS`.
* **`CargaAnimalUG`**: Carga animal expresada en **Unidades Ganaderas por Hectárea ($UG/ha$)** (Donde 1 UG = 1 Vaca de 380 kg).

### C. Finanzas Rurales
* **`LiquidacionDeGanado` / `LiquidacionHacienda`**: Venta de ganado a frigorífico o remate feria (consignatario).
* **`Moneda`**: Distinción clara entre `USD` (dólares para hacienda e insumos de valor) y `UYU` (pesos para gastos operativos).
* **`InsumosRurales`**: Ración, suplementos, específicas veterinarias, combustible y alambres.

---

## 📱 2. Enfoque Mobile-First y Responsividad Obligatoria

* **Diseño Mobile-First**: Diseñado primero para smartphones de capataces (`320px` - `480px`) e incrementado para tablets (`md:`) y escritorio (`lg:`).
* **Menú Deslizable (Drawer)**: Menú hamburguesa accesible con al menos 44px de área táctil.
* **Vistas Adaptativas**: Tablas convertidas en tarjetas táctiles en pantallas móviles (`block sm:hidden`).

---

## 🏗️ 3. HTML Semántico y Estructura Accesible

Uso obligatorio de `<header>`, `<nav>`, `<aside>`, `<main>`, `<section>`, `<article>`, `<time>`, `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>`.

---

## 🏷️ 4. Variables Mnemotécnicas y Nomenclatura

* Variables autoexplicativas sin abreviaciones ambiguas.
* TypeScript estricto sin `any`.
