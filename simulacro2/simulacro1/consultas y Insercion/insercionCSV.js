// ==========================================================
// ENDPOINTS PARA INSERTAR DATOS DESDE CSV
// Proyecto Biblioteca - Express + MySQL + Mongo Logs
// ==========================================================



// ==========================================================
// 1 INSERTAR CARGOS DESDE CSV
// ==========================================================
app.post('/api/upload/cargos', upload.single('archivo'), (req, res) => {

    // Arreglo donde se guardarán las filas del CSV
    const rows = [];

    // Lee el archivo subido desde la carpeta uploads/
    fs.createReadStream(req.file.path)

        // Convierte el CSV en objetos JS
        .pipe(parse({ columns: true, trim: true }))

        // Cada fila se agrega al arreglo rows
        .on('data', row => rows.push(row))

        // Cuando termina de leer el archivo
        .on('end', async () => {

            try {

                // Verifica que el CSV tenga datos
                if (rows.length) {

                    // Construye los valores dinámicamente
                    const values = rows
                        .map(r => `('${r.nombre}')`)
                        .join(',');

                    // Ejecuta INSERT masivo
                    await db.query(`
                        INSERT INTO cargos (nombre)
                        VALUES ${values}
                    `);

                    // Guarda log en Mongo
                    saveLog('INSERT_CARGOS_CSV');
                }

                // Respuesta exitosa
                res.json({
                    ok: true,
                    total_insertados: rows.length
                });

            } catch (error) {

                res.status(500).json({
                    error: 'Error insertando cargos'
                });
            }
        });
});



// ==========================================================
// 2 INSERTAR AUTORES DESDE CSV
// ==========================================================
app.post('/api/upload/autores', upload.single('archivo'), (req, res) => {

    const rows = [];

    fs.createReadStream(req.file.path)
        .pipe(parse({ columns: true, trim: true }))
        .on('data', row => rows.push(row))
        .on('end', async () => {

            try {

                if (rows.length) {

                    const values = rows
                        .map(r => `('${r.nombre}')`)
                        .join(',');

                    await db.query(`
                        INSERT INTO autores (nombre)
                        VALUES ${values}
                    `);

                    saveLog('INSERT_AUTORES_CSV');
                }

                res.json({
                    ok: true,
                    total_insertados: rows.length
                });

            } catch (error) {

                res.status(500).json({
                    error: 'Error insertando autores'
                });
            }
        });
});



// ==========================================================
// 3 INSERTAR CLIENTES DESDE CSV
// ==========================================================
app.post('/api/upload/clientes', upload.single('archivo'), (req, res) => {

    const rows = [];

    fs.createReadStream(req.file.path)
        .pipe(parse({ columns: true, trim: true }))
        .on('data', row => rows.push(row))
        .on('end', async () => {

            try {

                if (rows.length) {

                    const values = rows
                        .map(r => `(
                            '${r.nombre_cliente}',
                            '${r.telefono_cliente}',
                            '${r.correo_cliente}'
                        )`)
                        .join(',');

                    await db.query(`
                        INSERT INTO clientes
                        (nombre_cliente, telefono_cliente, correo_cliente)
                        VALUES ${values}
                    `);

                    saveLog('INSERT_CLIENTES_CSV');
                }

                res.json({
                    ok: true,
                    total_insertados: rows.length
                });

            } catch (error) {

                res.status(500).json({
                    error: 'Error insertando clientes'
                });
            }
        });
});



// ==========================================================
// 4 INSERTAR EMPLEADOS DESDE CSV
// ==========================================================
app.post('/api/upload/empleados', upload.single('archivo'), (req, res) => {

    const rows = [];

    fs.createReadStream(req.file.path)
        .pipe(parse({ columns: true, trim: true }))
        .on('data', row => rows.push(row))
        .on('end', async () => {

            try {

                if (rows.length) {

                    const values = rows
                        .map(r => `(
                            '${r.nombre_empleado}',
                            ${r.id_cargo}
                        )`)
                        .join(',');

                    await db.query(`
                        INSERT INTO empleados
                        (nombre_empleado, id_cargo)
                        VALUES ${values}
                    `);

                    saveLog('INSERT_EMPLEADOS_CSV');
                }

                res.json({
                    ok: true,
                    total_insertados: rows.length
                });

            } catch (error) {

                res.status(500).json({
                    error: 'Error insertando empleados'
                });
            }
        });
});



// ==========================================================
// 5 INSERTAR LIBROS DESDE CSV
// ==========================================================
app.post('/api/upload/libros', upload.single('archivo'), (req, res) => {

    const rows = [];

    fs.createReadStream(req.file.path)
        .pipe(parse({ columns: true, trim: true }))
        .on('data', row => rows.push(row))
        .on('end', async () => {

            try {

                if (rows.length) {

                    const values = rows
                        .map(r => `(
                            '${r.titulo_libro}',
                            ${r.id_autor},
                            ${r.id_categoria},
                            ${r.id_editorial},
                            ${r.anio_publicacion},
                            ${r.precio_libro}
                        )`)
                        .join(',');

                    await db.query(`
                        INSERT INTO libros
                        (titulo_libro, id_autor, id_categoria, id_editorial, anio_publicacion, precio_libro)
                        VALUES ${values}
                    `);

                    saveLog('INSERT_LIBROS_CSV');
                }

                res.json({
                    ok: true,
                    total_insertados: rows.length
                });

            } catch (error) {

                res.status(500).json({
                    error: 'Error insertando libros'
                });
            }
        });
});



// ==========================================================
// 6 INSERTAR PRESTAMOS DESDE CSV
// ==========================================================
app.post('/api/upload/prestamos', upload.single('archivo'), (req, res) => {

    const rows = [];

    fs.createReadStream(req.file.path)
        .pipe(parse({ columns: true, trim: true }))
        .on('data', row => rows.push(row))
        .on('end', async () => {

            try {

                if (rows.length) {

                    const values = rows
                        .map(r => `(
                            '${r.fecha_prestamo}',
                            ${r.fecha_devolucion ? `'${r.fecha_devolucion}'` : null},
                            ${r.id_cliente},
                            ${r.id_empleado},
                            ${r.id_libro}
                        )`)
                        .join(',');

                    await db.query(`
                        INSERT INTO prestamos
                        (fecha_prestamo, fecha_devolucion, id_cliente, id_empleado, id_libro)
                        VALUES ${values}
                    `);

                    saveLog('INSERT_PRESTAMOS_CSV');
                }

                res.json({
                    ok: true,
                    total_insertados: rows.length
                });

            } catch (error) {

                res.status(500).json({
                    error: 'Error insertando prestamos'
                });
            }
        });
});