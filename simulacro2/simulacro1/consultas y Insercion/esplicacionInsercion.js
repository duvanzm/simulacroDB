// ==========================================================
// ENDPOINT: INSERTAR CARGOS DESDE CSV
// ==========================================================

// Crea una ruta POST en la URL:
// http://localhost:3000/api/upload/cargos
// Este endpoint recibe un archivo CSV desde Postman
app.post('/api/upload/cargos', upload.single('archivo'), (req, res) => {

    // ------------------------------------------------------
    // upload.single('archivo')
    // ------------------------------------------------------
    // Esta función pertenece a multer.
    // Indica que vamos a recibir UN solo archivo
    // y que el nombre del campo en Postman debe llamarse "archivo".
    //
    // En Postman:
    // Body → form-data → key: archivo → type: File
    //
    // Multer guarda automáticamente el archivo en la carpeta uploads/
    // y deja la información disponible en:
    // req.file


    // ------------------------------------------------------
    // Creamos un arreglo vacío
    // ------------------------------------------------------
    // Aquí almacenaremos cada fila del CSV convertida en objeto JS.
    const rows = [];


    // ------------------------------------------------------
    // fs.createReadStream(req.file.path)
    // ------------------------------------------------------
    // fs = file system
    // Crea un flujo de lectura del archivo subido.
    //
    // req.file.path contiene la ruta del archivo en uploads/
    // Ejemplo: uploads/abc123.csv
    //
    // Se usa stream porque es más eficiente que cargar
    // todo el archivo en memoria de una vez.
    fs.createReadStream(req.file.path)

        // --------------------------------------------------
        // .pipe(parse({ columns: true, trim: true }))
        // --------------------------------------------------
        // parse viene de csv-parse.
        //
        // columns: true
        // → Convierte cada fila en un objeto usando
        //   la primera fila como nombres de columnas.
        //
        // trim: true
        // → Elimina espacios en blanco innecesarios.
        //
        // Ejemplo CSV:
        // nombre
        // Administrador
        //
        // Se convierte en:
        // { nombre: "Administrador" }
        .pipe(parse({ columns: true, trim: true }))

        // --------------------------------------------------
        // .on('data', row => rows.push(row))
        // --------------------------------------------------
        // Cada vez que el parser lee una fila,
        // ejecuta esta función.
        //
        // row representa una fila del CSV en formato objeto.
        //
        // Se agrega al arreglo rows.
        .on('data', row => rows.push(row))

        // --------------------------------------------------
        // .on('end', async () => { ... })
        // --------------------------------------------------
        // Este evento se ejecuta cuando termina
        // completamente la lectura del archivo.
        //
        // Aquí ya tenemos todas las filas guardadas
        // dentro del arreglo rows.
        .on('end', async () => {

            try {

                // --------------------------------------------------
                // Verificamos que el CSV tenga datos
                // --------------------------------------------------
                // Si rows.length es mayor que 0,
                // significa que hay registros para insertar.
                if (rows.length) {

                    // --------------------------------------------------
                    // Construcción dinámica de los VALUES
                    // --------------------------------------------------
                    //
                    // rows.map(...)
                    // → Recorre cada objeto del arreglo rows.
                    //
                    // r representa cada fila.
                    //
                    // `('${r.nombre}')`
                    // → Construye el valor SQL para cada fila.
                    //
                    // join(',')
                    // → Une todos los valores en una sola cadena.
                    //
                    // Ejemplo resultado:
                    // ('Administrador'),('Vendedor'),('Cajero')
                    const values = rows
                        .map(r => `('${r.nombre}')`)
                        .join(',');

                    // --------------------------------------------------
                    // Ejecuta INSERT masivo en MySQL
                    // --------------------------------------------------
                    //
                    // Se insertan todos los registros en UNA sola consulta.
                    //
                    // Esto es más rápido que hacer un INSERT por cada fila.
                    await db.query(`
                        INSERT INTO cargos (nombre)
                        VALUES ${values}
                    `);

                    // --------------------------------------------------
                    // Guarda un log en MongoDB
                    // --------------------------------------------------
                    //
                    // saveLog es tu función que inserta
                    // un documento en la colección logs.
                    //
                    // Esto sirve para auditoría.
                    saveLog('INSERT_CARGOS_CSV');
                }

                // --------------------------------------------------
                // Respuesta exitosa
                // --------------------------------------------------
                //
                // Devuelve JSON a Postman indicando:
                // - ok: operación exitosa
                // - total_insertados: cuántos registros se procesaron
                res.json({
                    ok: true,
                    total_insertados: rows.length
                });

            } catch (error) {

                // --------------------------------------------------
                // Manejo de errores
                // --------------------------------------------------
                //
                // Si algo falla (error SQL, archivo mal formado, etc.)
                // se devuelve estado 500.
                res.status(500).json({
                    error: 'Error insertando cargos'
                });
            }
        });
});