“Organizar datos no es mover columnas; es diseñar pensamiento estructurado.”

---

## Introducción

Te has unido al equipo de ingeniería de **CorpData Analytics**, una firma especializada en modernización tecnológica para grupos empresariales.

Uno de sus clientes principales, **Enterprise Nexus Group**, ha gestionado durante años la información de empresas, empleados, clientes y contratos en un único archivo maestro de Excel.

El archivo ha crecido sin control y actualmente presenta:

* Empresas repetidas en múltiples filas
* Empleados duplicados
* Clientes con correos inconsistentes
* Contratos asociados manualmente
* Servicios y facturación sin estructura clara

El sistema es inmanejable y no permite generar reportes confiables.



### Fuente de Datos
Analizarás un archivo plano (Excel/CSV) que contiene información mezclada:


### Diseño del Modelo
Debes aplicar 1FN, 2FN y 3FN para descomponer la información en tablas relacionadas.

---

### Diagrama

Debes entregar una representación visual de tu modelo (DER) realizado en una herramienta externa (draw.io o similar).

---

## Fase 2: Implementación de Base de Datos

Crea la base de datos utilizando el gestor de tu elección (PostgreSQL/MySQL o MongoDB).

Convención de Nombres:  
Todas las tablas/colecciones y atributos/campos deben estar en Inglés y minuscula.

Integridad:

(SQL)  
Uso estricto de PK, FK y Restricciones (UNIQUE, NOT NULL).


## Migración Masiva de Datos (El Reto)

El sistema debe ser capaz de ingerir el archivo plano desorganizado y distribuir la información en tu nuevo modelo de datos.
Debes implementar lógica que evite duplicación de entidades maestras.

Ejemplo:

Si la empresa "TechNova Ltd" aparece en 15 filas del CSV, tu base de datos solo debe crear un registro de empresa y vincular correctamente los contratos asociados.
Este proceso de carga debe ejecutarse mediante un script o un endpoint específico de la API.

---

## Backend CRUD (Express.js)

Desarrolla un servidor RESTful usando Node.js y Express.

Selecciona UNA entidad principal de tu modelo (ej: Companies, Contracts o Services) y desarrolla un CRUD completo para gestionarla.

El código debe ser modular, limpio y organizado.
La conexión a la base de datos debe manejar errores correctamente.

---

## Consultas Avanzadas (Business Intelligence)

El Director Administrativo solicita visualizar lo siguiente:

### Análisis de Empresas:

- "Necesito saber qué empresas han generado mayor facturación total y cuántos contratos tienen asociados."

### Historial de Cliente:

- "Quiero ver el historial de contratos de un cliente específico, detallando servicios y fecha de transacción."

### Servicios Más Utilizados:

- "Genera un listado de los servicios más contratados dentro de una categoría específica, ordenados por ingresos generados."

(Nota:  Si usas SQL, esto requiere JOINs y GROUP BY)

---

# Auditoría

Cada acción que realice el sistema debe quedar registrada en MongoDB.
Se debe crear una colección llamada:
audit_logs

Estructura mínima:

* id
* action
* date

Ejemplos de acciones:
* upload_file
* execute_migration
* create_entity
* update_entity
* delete_entity
* run_query

Cada vez que el sistema ejecute una funcionalidad, debe generar automáticamente un registro en esta colección.


# 4. Entregables

Repositorio de GitHub:

* Código fuente del proyecto.
* Carpeta /docs con:

  * Diagrama del Modelo de Datos.
  * Archivo CSV utilizado.
  * Scripts de Base de Datos.
  * Colección de Postman exportada.
* README.md.

---

# 5. Documentación (README.md)

Debe estar redactado en Inglés e incluir:

* Pasos para ejecutar el proyecto localmente.
* Justificación del modelo.
* Explicación del proceso de normalización o diseño NoSQL.
* Guía del proceso de Migración Masiva.
* Descripción de los endpoints.

---

# 6. Criterios de Aceptación

Migración:  
Cargue de informacion desde el Excel/CSV

Modelo de Datos:  
(SQL) Cumple 3FN.  

Backend:  
Código organizado, uso de variables de entorno (.env), códigos HTTP correctos.

Consultas:  
Responden con exactitud a los requerimientos planteados.

Auditoría:  
Todas las acciones del sistema quedan registradas correctamente con id, action y date.


https://docs.google.com/spreadsheets/d/1G7EMJM1OP-ji-ZEUeQj7F__fmVLcAUgz/edit?usp=sharing&ouid=105996360187852195949&rtpof=true&sd=true