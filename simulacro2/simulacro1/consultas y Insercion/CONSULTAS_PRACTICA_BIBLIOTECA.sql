-- ============================================================
-- PROYECTO: CONSULTAS AVANZADAS - SISTEMA DE BIBLIOTECA
-- ============================================================
-- Base de datos:
-- cargos, autores, editoriales, categorias,
-- clientes, libros, empleados, prestamos
--
-- Objetivo:
-- Practicar consultas avanzadas con:
-- JOIN, LEFT JOIN, GROUP BY, HAVING,
-- COUNT, SUM, AVG, ORDER BY, LIMIT
-- ============================================================



-- ============================================================
-- 1️⃣ LIBROS MÁS PRESTADOS
-- ============================================================
-- Objetivo:
-- Saber cuáles libros han sido prestados más veces.
-- ============================================================

SELECT 
    l.id_libro,                     -- Identificador del libro
    l.titulo_libro,                 -- Nombre del libro

    -- COUNT cuenta cuántos préstamos tiene cada libro
    COUNT(p.id_prestamo) AS veces_prestado

FROM libros l

-- LEFT JOIN para incluir libros que nunca han sido prestados
LEFT JOIN prestamos p 
       ON p.id_libro = l.id_libro

-- Agrupamos por libro porque usamos COUNT()
GROUP BY l.id_libro, l.titulo_libro

-- Ordenamos de mayor a menor cantidad de préstamos
ORDER BY veces_prestado DESC;



-- ============================================================
-- 2️⃣ CLIENTES CON MÁS PRÉSTAMOS
-- ============================================================
-- Objetivo:
-- Identificar los clientes más activos.
-- ============================================================

SELECT 
    c.id_cliente,
    c.nombre_cliente,

    -- Contamos cuántos préstamos tiene cada cliente
    COUNT(p.id_prestamo) AS total_prestamos

FROM clientes c

-- INNER JOIN porque solo queremos clientes que tengan préstamos
JOIN prestamos p 
     ON p.id_cliente = c.id_cliente

-- Agrupamos por cliente
GROUP BY c.id_cliente, c.nombre_cliente

-- Orden descendente para ver el más activo primero
ORDER BY total_prestamos DESC;



-- ============================================================
-- 3️⃣ EMPLEADOS QUE MÁS PRÉSTAMOS GESTIONAN
-- ============================================================

SELECT 
    e.id_empleado,
    e.nombre_empleado,

    -- Contamos los préstamos gestionados por cada empleado
    COUNT(p.id_prestamo) AS prestamos_gestionados

FROM empleados e

JOIN prestamos p 
     ON p.id_empleado = e.id_empleado

GROUP BY e.id_empleado, e.nombre_empleado

ORDER BY prestamos_gestionados DESC;



-- ============================================================
-- 4️⃣ INGRESO POTENCIAL POR LIBRO
-- ============================================================
-- Supuesto:
-- Cada préstamo representa un ingreso equivalente al precio del libro.
-- ============================================================

SELECT 
    l.titulo_libro,
    l.precio_libro,

    -- Contamos veces prestado
    COUNT(p.id_prestamo) AS veces_prestado,

    -- Multiplicamos precio por cantidad de préstamos
    (l.precio_libro * COUNT(p.id_prestamo)) AS ingreso_potencial

FROM libros l

LEFT JOIN prestamos p 
       ON p.id_libro = l.id_libro

GROUP BY l.id_libro, l.titulo_libro, l.precio_libro

ORDER BY ingreso_potencial DESC;



-- ============================================================
-- 5️⃣ CANTIDAD DE LIBROS POR CATEGORÍA
-- ============================================================

SELECT 
    c.nombre AS categoria,

    -- Contamos libros dentro de cada categoría
    COUNT(l.id_libro) AS total_libros

FROM categorias c

LEFT JOIN libros l 
       ON l.id_categoria = c.id_categoria

GROUP BY c.id_categoria, c.nombre

ORDER BY total_libros DESC;



-- ============================================================
-- 6️⃣ CLIENTES CON MÁS DE 3 PRÉSTAMOS (HAVING)
-- ============================================================
-- HAVING se usa para filtrar después del GROUP BY.
-- ============================================================

SELECT 
    c.nombre_cliente,
    COUNT(p.id_prestamo) AS total_prestamos

FROM clientes c

JOIN prestamos p 
     ON p.id_cliente = c.id_cliente

GROUP BY c.id_cliente, c.nombre_cliente

-- Filtramos solo los que tienen más de 3 préstamos
HAVING COUNT(p.id_prestamo) > 3

ORDER BY total_prestamos DESC;



-- ============================================================
-- 7️⃣ LIBROS QUE NUNCA HAN SIDO PRESTADOS
-- ============================================================
-- Buscamos libros que no tengan registros en prestamos.
-- ============================================================

SELECT 
    l.titulo_libro

FROM libros l

LEFT JOIN prestamos p 
       ON p.id_libro = l.id_libro

-- Si no hay préstamo, el id será NULL
WHERE p.id_prestamo IS NULL;



-- ============================================================
-- 8️⃣ PROMEDIO DE PRECIO POR EDITORIAL
-- ============================================================
-- AVG calcula el promedio del precio de libros por editorial.
-- ============================================================

SELECT 
    e.nombre AS editorial,

    -- Promedio de precios
    AVG(l.precio_libro) AS precio_promedio

FROM editoriales e

JOIN libros l 
     ON l.id_editorial = e.id_editorial

GROUP BY e.id_editorial, e.nombre

ORDER BY precio_promedio DESC;



-- ============================================================
-- 9️⃣ PRÉSTAMOS SEGÚN AÑO DE PUBLICACIÓN
-- ============================================================
-- Permite analizar qué año genera más actividad.
-- ============================================================

SELECT 
    l.anio_publicacion,

    COUNT(p.id_prestamo) AS total_prestamos

FROM libros l

LEFT JOIN prestamos p 
       ON p.id_libro = l.id_libro

GROUP BY l.anio_publicacion

ORDER BY l.anio_publicacion DESC;



-- ============================================================
-- 🔟 TOP 5 AUTORES MÁS LEÍDOS
-- ============================================================
-- Se unen autores → libros → prestamos
-- ============================================================

SELECT 
    a.nombre AS autor,

    -- Total de préstamos de libros del autor
    COUNT(p.id_prestamo) AS total_prestamos

FROM autores a

JOIN libros l 
     ON l.id_autor = a.id_autor

JOIN prestamos p 
     ON p.id_libro = l.id_libro

GROUP BY a.id_autor, a.nombre

ORDER BY total_prestamos DESC

-- Solo mostramos los 5 primeros
LIMIT 5;



-- ============================================================
-- 📌 CONCEPTOS CLAVE PRACTICADOS
-- ============================================================
-- ✔ INNER JOIN vs LEFT JOIN
-- ✔ COUNT()
-- ✔ SUM()
-- ✔ AVG()
-- ✔ GROUP BY
-- ✔ HAVING
-- ✔ ORDER BY
-- ✔ LIMIT
-- ✔ Cálculos matemáticos en SELECT
--
-- Nivel alcanzado: SQL Intermedio - Avanzado
-- ============================================================