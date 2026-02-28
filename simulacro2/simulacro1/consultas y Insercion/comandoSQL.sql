=========================================================
TIPOS DE COMANDOS EN SQL
=========================================================

SQL se clasifica en 5 grandes grupos según su función:

---------------------------------------------------------
1 DDL - Data Definition Language
(Lenguaje de Definición de Datos)
---------------------------------------------------------
Se usa para crear y modificar la estructura de la base de datos.

Comandos principales:
- CREATE    -> Crear tablas, bases de datos, vistas, índices
- ALTER     -> Modificar estructura de una tabla
- DROP      -> Eliminar tablas o bases de datos
- TRUNCATE  -> Vaciar una tabla (sin borrar su estructura)
- RENAME    -> Cambiar nombre de un objeto

Ejemplo:
CREATE TABLE clientes (
    id INT PRIMARY KEY,
    nombre VARCHAR(100)
);

ALTER TABLE clientes ADD telefono VARCHAR(20);

DROP TABLE clientes;


---------------------------------------------------------
2 DML - Data Manipulation Language
(Lenguaje de Manipulación de Datos)
---------------------------------------------------------
Se usa para trabajar con los datos dentro de las tablas.

Comandos principales:
- INSERT  -> Insertar registros
- UPDATE  -> Modificar registros
- DELETE  -> Eliminar registros
- SELECT  -> Consultar datos

Ejemplo:
INSERT INTO clientes VALUES (1, 'Juan');

UPDATE clientes SET nombre = 'Pedro' WHERE id = 1;

DELETE FROM clientes WHERE id = 1;

SELECT * FROM clientes;


---------------------------------------------------------
3 DQL - Data Query Language
(Lenguaje de Consulta de Datos)
---------------------------------------------------------
Se enfoca únicamente en consultas.

Comando principal:
- SELECT

Cláusulas usadas con SELECT:
- WHERE
- GROUP BY
- ORDER BY
- HAVING
- JOIN

Ejemplo:
SELECT nombre, COUNT(*)
FROM clientes
GROUP BY nombre;


---------------------------------------------------------
4 DCL - Data Control Language
(Lenguaje de Control de Datos)
---------------------------------------------------------
Se usa para manejar permisos y seguridad.

Comandos principales:
- GRANT   -> Otorgar permisos
- REVOKE  -> Quitar permisos

Ejemplo:
GRANT SELECT ON clientes TO usuario1;

REVOKE SELECT ON clientes FROM usuario1;


---------------------------------------------------------
5 TCL - Transaction Control Language
(Lenguaje de Control de Transacciones)
---------------------------------------------------------
Se usa para controlar transacciones (confirmar o revertir cambios).

Comandos principales:
- COMMIT    -> Confirmar cambios
- ROLLBACK  -> Deshacer cambios
- SAVEPOINT -> Punto intermedio de guardado

Ejemplo:
BEGIN;

INSERT INTO clientes VALUES (2, 'Ana');

ROLLBACK;


=========================================================
RESUMEN GENERAL
=========================================================

DDL  -> Estructura (crear/modificar tablas)
DML  -> Manipular datos (insertar, actualizar, eliminar)
DQL  -> Consultar datos
DCL  -> Permisos
TCL  -> Control de transacciones

=========================================================