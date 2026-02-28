// Importa el framework Express para crear el servidor HTTP
const express = require('express');

// Importa Multer para manejar subida de archivos
const multer = require('multer');

// Importa el parser de CSV para convertir el archivo en objetos JavaScript
const { parse } = require('csv-parse');

// Importa el driver mysql2 con soporte para promesas
const mysql = require('mysql2/promise');

// Importa el módulo fs para trabajar con el sistema de archivos
const fs = require('fs');

// Importa MongoClient para conectarse a MongoDB
const { MongoClient } = require('mongodb');

// Esta línea no se está usando realmente en el código
const { create } = require('domain');

// mongodb://read:scORHWprCvp26Gz1zwPQgSsokHyPC2@157.180.40.190:27017/db_andrescortes
// URI de conexión a MongoDB local
const uri = 'mongodb://read:scORHWprCvp26Gz1zwPQgSsokHyPC2@157.180.40.190:27017/';

// Crea una nueva instancia del cliente de Mongo
const client = new MongoClient(uri);

// Crea la aplicación Express
const app = express();

// Configura Multer para guardar archivos subidos en la carpeta uploads/
const upload = multer({ dest: 'uploads/' });

// Crea un pool de conexiones a MySQL con la configuración indicada
const db = mysql.createPool({
    host: '157.180.40.190',        // Dirección del servidor MySQL
    user: 'root',                 // Usuario de la base de datos
    password: 'scORHWprCvp26Gz1zwPQgSsokHyPC2', // Contraseña
    database: 'db_duvan_csv',     // Nombre de la base de datos
    waitForConnections: true,     // Espera si no hay conexiones disponibles
    connectionLimit: 40,          // Máximo número de conexiones simultáneas
    queueLimit: 0                 // Sin límite en la cola de espera
});

// Función para probar la conexión a MySQL
async function connectMysql() {
    try {
        // Intenta obtener una conexión del pool
        const connection = await db.getConnection();

        // Si logra conectarse, muestra mensaje en consola
        console.log('Conectado a MySQL');

        // Libera la conexión para que pueda ser reutilizada
        connection.release();

    } catch (error) {
        // Si ocurre un error, lo muestra
        console.error('Error al conectar a MySQL:', error);

        // Termina el proceso si falla la conexión
        process.exit(1);
    }
}

// Ejecuta la función para verificar la conexión
connectMysql();

// Variable que almacenará la colección de logs
let logsCollection;

// Función para conectarse a MongoDB
async function connectDB() {
    try {
        // Conecta el cliente a MongoDB
        await client.connect();

        console.log('Conectado a MongoDB');

        // Selecciona la base de datos llamada app
        const db = client.db('app');

        // Selecciona la colección llamada logs
        logsCollection = db.collection('logs');

        console.log('logs creado');

    } catch (error) {
        // Muestra error si falla la conexión
        console.log(error);
    }
}

// Ejecuta la conexión a MongoDB
connectDB();

// Función para guardar un log en MongoDB
async function saveLog(action) {
    try {
        // Inserta un documento con la acción y fecha actual
        await logsCollection.insertOne({
            action,
            created_at: new Date()
        });

        console.log(`log ${action} agregado`);
        
    } catch (error) {
        console.log('error en saveLog');
    }
}

// Endpoint para subir archivo CSV de cargos

app.post('/api/upload/cargos', upload.single('archivo'), (req, res) => {

    // Arreglo donde se guardarán las filas del CSV
    const rows = [];

    // Lee el archivo subido desde el sistema de archivos
    fs.createReadStream(req.file.path)

        // Pasa el contenido al parser CSV
        .pipe(parse({ columns: true, trim: true }))

        // Por cada fila leída la agrega al arreglo rows
        .on('data', row => rows.push(row))

        // Cuando termina de leer el archivo
        .on('end', async () => {
            try {

                // Si existen filas en el CSV
                if (rows.length) {

                    // Construye una cadena con los valores para el INSERT
                    const values = rows
                        .map(r => `('${r.id}','${r.nombre}')`)
                        .join(',');

                    // Ejecuta el INSERT masivo en la tabla cargos
                    await db.query(`INSERT INTO cargos (id, nombre) VALUES ${values}`);

                    // Guarda un log en MongoDB
                    saveLog('INSERT');
                }

                // Responde con éxito y total de registros insertados
                res.json({ ok: true, total: rows.length });

            } catch (error) {
                // Si ocurre error, responde con estado 500
                res.status(500).json({ error: 'internal server error' });
            }
        });
});

// Endpoint para subir archivo CSV de autores
app.post('/api/upload/autores', upload.single('archivo'), (req, res) => {

    const rows = [];

    fs.createReadStream(req.file.path)
        .pipe(parse({ columns: true, trim: true }))
        .on('data', row => rows.push(row))
        .on('end', async () => {
            try {

                if (rows.length) {

                    // Construye valores para INSERT
                    const values = rows
                        .map(r => `('${r.id}','${r.nombre}')`)
                        .join(',');

                    // Ejecuta INSERT masivo en tabla autores
                    await db.query(`INSERT INTO autores (id, nombre) VALUES ${values}`);

                    // Guarda log en Mongo
                    saveLog('INSERT');
                }

                // Devuelve respuesta exitosa
                res.json({ ok: true, total: rows.length });

            } catch (error) {
                console.log(error);

                res.status(500).json({ error: 'internal server error' });
            }
        });
});

// Endpoint para consultar los logs almacenados en MongoDB
app.get('/logs', async (req, res) => {

    try {
        // Busca todos los documentos en la colección logs
        // Los ordena por fecha descendente
        // Convierte el cursor en arreglo
        const logs = await logsCollection
            .find()
            .sort({ created_at : -1 })
            .toArray();
        
        // Devuelve los logs en formato JSON
        res.json(logs);

    } catch (error) {
        res.status(500).json({ error: 'internal server error mongoDB' });
    }
});

// Inicia el servidor en el puerto 3000
app.listen(3000, () => {
    console.log('http://localhost:3000');
});