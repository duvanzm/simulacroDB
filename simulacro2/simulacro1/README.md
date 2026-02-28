# API de Carga Masiva CSV con MySQL y MongoDB

## Información del Estudiante

- Nombre: Duvan Alexander Zuluaga Macias
- Cédula: 1045113839
- Clan: Mc Carthy
- Repositorio GitHub:

---

# Descripción del Proyecto

Este proyecto consiste en una API REST desarrollada con Node.js y Express que permite realizar cargas masivas de datos desde archivos CSV hacia una base de datos MySQL.  

Adicionalmente, cada operación de inserción es registrada en MongoDB con el fin de llevar un control de logs y auditoría del sistema.

El proyecto implementa una arquitectura híbrida utilizando:

- Base de datos relacional (MySQL) para datos estructurados.
- Base de datos NoSQL (MongoDB) para almacenamiento de eventos y registros.

---

# Tecnologías Utilizadas

- Node.js
- Express
- MySQL
- MongoDB
- Multer (subida de archivos)
- csv-parse (procesamiento de CSV)

---

# Pasos para Ejecutar el Proyecto Localmente

## copia y pega en tu terminal

## 1. clonar repositorio

```
git clone repo

```
## 2. Instala las dependencias 

- ubicarse en el archivo del proyecto

```
cd repo
```

- istalar dependencias 

```
npm install express multer csv-parse mysql2 mongodb
```

## 3. Crear las tablas en db  

```

```

# 4. levantas el servidor 

```
node index.js
```

# 5. Usa Postman para las Incercion y Consultas



# Justificación del modelo

Hise uso de las formas de normalizacon 1FN, 2FN y 3FN para descomponer la información en tablas relacionadas


# Explicación del proceso de normalización o diseño NoSQL



img


# Guía del Proceso de Migración Masiva

- El proceso funciona de la siguiente manera:

1. El usuario envía un archivo CSV mediante una petición POST.

2. Multer guarda temporalmente el archivo en la carpeta uploads/.

3. El sistema lee el archivo utilizando fs.createReadStream.

4. El paquete csv-parse convierte cada fila en un objeto JavaScript.

5. Se construye una consulta INSERT masiva.

6. Los datos son insertados en MySQL.

7. Se registra la acción en MongoDB.

8. Se retorna la cantidad de registros insertados.


# Descripción de los Endpoints

1. Subir Cargos

- Endpoint POST

```
/api/upload/cargos
```
- Descripción:

Permite subir un archivo CSV y cargar los datos en la tabla cargos.

2. Subir Autores
Endpoint POST

```
 /api/upload/autores
 ```
- Descripción:
Permite subir un archivo CSV y cargar los datos en la tabla autores.

3. Consultar Logs

- Endpoint GET

 ```
 /logs
 ```

- Descripción:
Devuelve todos los registros almacenados en MongoDB ordenados por fecha descendente