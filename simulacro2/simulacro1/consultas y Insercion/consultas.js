// ======================================================
// CONSULTAS COMPLEJAS - API BIBLIOTECA
// Todas las consultas incluyen explicación línea por línea
// ======================================================



// ======================================================
// 1 Obtener todos los libros con autor, categoría y editorial
// ======================================================
app.get('/api/libros', async (req, res) => {

    try {

        // Ejecuta una consulta SQL usando JOIN para unir varias tablas
        const [rows] = await db.query(`

            SELECT 
                l.id_libro,                 -- Selecciona el id del libro
                l.titulo_libro,             -- Selecciona el título
                l.anio_publicacion,         -- Año de publicación
                l.precio_libro,             -- Precio del libro
                a.nombre AS autor,          -- Nombre del autor (alias autor)
                c.nombre AS categoria,      -- Nombre de la categoría
                e.nombre AS editorial       -- Nombre de la editorial

            FROM libros l                  -- Tabla principal (alias l)

            INNER JOIN autores a           -- Une tabla autores
                ON l.id_autor = a.id_autor -- Condición de relación

            INNER JOIN categorias c        -- Une tabla categorías
                ON l.id_categoria = c.id_categoria

            INNER JOIN editoriales e       -- Une tabla editoriales
                ON l.id_editorial = e.id_editorial
        `);

        // Guarda un log en Mongo indicando que se hizo esta consulta
        saveLog('SELECT_LIBROS_COMPLETOS');

        // Devuelve el resultado en formato JSON
        res.json(rows);

    } catch (error) {

        // Si ocurre error devuelve estado 500
        res.status(500).json({ error: 'Error consultando libros' });
    }
});



// ======================================================
// 2 Clientes con cantidad total de préstamos
// ======================================================
app.get('/api/clientes/prestamos', async (req, res) => {

    try {

        const [rows] = await db.query(`

            SELECT 
                c.id_cliente,                       -- ID del cliente
                c.nombre_cliente,                   -- Nombre del cliente
                COUNT(p.id_prestamo) AS total_prestamos  -- Cuenta cuantos préstamos tiene

            FROM clientes c                         -- Tabla principal clientes

            LEFT JOIN prestamos p                   -- LEFT JOIN para incluir clientes sin préstamos
                ON c.id_cliente = p.id_cliente

            GROUP BY c.id_cliente                   -- Agrupa por cliente

            ORDER BY total_prestamos DESC           -- Ordena de mayor a menor
        `);

        saveLog('CLIENTES_CON_PRESTAMOS');

        res.json(rows);

    } catch (error) {

        res.status(500).json({ error: 'Error en consulta clientes' });
    }
});



// ======================================================
// 3 Top 5 libros más prestados
// ======================================================
app.get('/api/libros/top', async (req, res) => {

    try {

        const [rows] = await db.query(`

            SELECT 
                l.titulo_libro,                    -- Título del libro
                COUNT(p.id_prestamo) AS total_prestamos -- Cuenta préstamos

            FROM libros l

            INNER JOIN prestamos p 
                ON l.id_libro = p.id_libro         -- Relación libro-prestamo

            GROUP BY l.id_libro                   -- Agrupa por libro

            ORDER BY total_prestamos DESC         -- Ordena descendente

            LIMIT 5                               -- Solo muestra los 5 primeros
        `);

        saveLog('TOP_5_LIBROS');

        res.json(rows);

    } catch (error) {

        res.status(500).json({ error: 'Error top libros' });
    }
});



// ======================================================
// 4 Historial de préstamos por cliente (dinámico)
// ======================================================
app.get('/api/clientes/:id/historial', async (req, res) => {

    // Obtiene el id del cliente desde la URL
    const { id } = req.params;

    try {

        const [rows] = await db.query(`

            SELECT 
                p.id_prestamo,            -- ID del préstamo
                p.fecha_prestamo,         -- Fecha del préstamo
                p.fecha_devolucion,       -- Fecha de devolución
                l.titulo_libro,           -- Título del libro
                e.nombre_empleado         -- Empleado que gestionó

            FROM prestamos p

            INNER JOIN libros l 
                ON p.id_libro = l.id_libro

            INNER JOIN empleados e 
                ON p.id_empleado = e.id_empleado

            WHERE p.id_cliente = ?       -- Filtro por cliente dinámico

            ORDER BY p.fecha_prestamo DESC
        `, [id]); // Se pasa el parámetro de forma segura

        saveLog('HISTORIAL_CLIENTE');

        res.json(rows);

    } catch (error) {

        res.status(500).json({ error: 'Error historial cliente' });
    }
});



// ======================================================
// 5 Empleados con más préstamos gestionados
// ======================================================
app.get('/api/empleados/top', async (req, res) => {

    try {

        const [rows] = await db.query(`

            SELECT 
                e.nombre_empleado, 
                COUNT(p.id_prestamo) AS total_gestionados

            FROM empleados e

            INNER JOIN prestamos p 
                ON e.id_empleado = p.id_empleado

            GROUP BY e.id_empleado

            ORDER BY total_gestionados DESC
        `);

        saveLog('TOP_EMPLEADOS');

        res.json(rows);

    } catch (error) {

        res.status(500).json({ error: 'Error empleados' });
    }
});



// ======================================================
// 6 Libros por categoría (filtro dinámico)
// ======================================================
app.get('/api/categorias/:id/libros', async (req, res) => {

    const { id } = req.params;

    try {

        const [rows] = await db.query(`

            SELECT 
                l.titulo_libro,
                l.precio_libro

            FROM libros l

            WHERE l.id_categoria = ?   -- Filtro dinámico
        `, [id]);

        saveLog('LIBROS_POR_CATEGORIA');

        res.json(rows);

    } catch (error) {

        res.status(500).json({ error: 'Error libros categoría' });
    }
});



// ======================================================
// 7 Préstamos activos (no devueltos)
// ======================================================
app.get('/api/prestamos/activos', async (req, res) => {

    try {

        const [rows] = await db.query(`

            SELECT 
                p.id_prestamo,
                c.nombre_cliente,
                l.titulo_libro,
                p.fecha_prestamo

            FROM prestamos p

            INNER JOIN clientes c 
                ON p.id_cliente = c.id_cliente

            INNER JOIN libros l 
                ON p.id_libro = l.id_libro

            WHERE p.fecha_devolucion IS NULL  -- Solo préstamos sin devolución
        `);

        saveLog('PRESTAMOS_ACTIVOS');

        res.json(rows);

    } catch (error) {

        res.status(500).json({ error: 'Error préstamos activos' });
    }
});



// ======================================================
// 8 Facturación simulada por libro
// ======================================================
app.get('/api/libros/facturacion', async (req, res) => {

    try {

        const [rows] = await db.query(`

            SELECT 
                l.titulo_libro,

                -- Multiplica la cantidad de préstamos por el precio
                COUNT(p.id_prestamo) * l.precio_libro AS total_facturado

            FROM libros l

            INNER JOIN prestamos p 
                ON l.id_libro = p.id_libro

            GROUP BY l.id_libro

            ORDER BY total_facturado DESC
        `);

        saveLog('FACTURACION_LIBROS');

        res.json(rows);

    } catch (error) {

        res.status(500).json({ error: 'Error facturación' });
    }
});

// ==========================================================
// ¿QUÉ HACE: const [rows] = await db.query(...) ?
// ==========================================================

// db.query() usando mysql2/promise NO devuelve solo los datos.
// Devuelve un arreglo con DOS posiciones:
//
// [
//   rows,   -> Posición 0: Datos reales de la consulta (registros)
//   fields  -> Posición 1: Información de las columnas (metadata)
// ]

// Ejemplo real de lo que devuelve:
const resultado = await db.query('SELECT * FROM libros');

/*
resultado sería algo así:

[
  [ { id_libro: 1, titulo: "Libro A" }, { id_libro: 2, titulo: "Libro B" } ],
  [ { name: "id_libro" }, { name: "titulo" } ]
]
*/

// Cuando escribimos:
const [rows] = await db.query('SELECT * FROM libros');

// Estamos usando DESESTRUCTURACIÓN de arreglos en JavaScript.
// Eso significa:
//
// "Guárdame la primera posición del arreglo en la variable rows"

// Es exactamente lo mismo que hacer:
const resultado2 = await db.query('SELECT * FROM libros');
const rows2 = resultado2[0]; // Toma solo la primera posición

// Entonces:
// rows contiene únicamente los datos de la consulta
// y NO contiene la información de columnas (fields).

// ¿Por qué se usa?
// Porque en una API REST normalmente solo queremos enviar los datos al cliente:
//
// res.json(rows);
//
// Así Postman recibe solo los registros y no la metadata innecesaria.

// En resumen:
// const [rows]
// → Extrae únicamente los datos de la consulta
// → Ignora la información técnica de las columnas
// → Hace que la respuesta sea limpia y profesional