/**
 * db_mongo.js - Conexión a MongoDB
 *
 * Exporta la función conectarMongo() que retorna la instancia de la DB.
 * Se llama una vez al iniciar el servidor y se reutiliza en toda la app.
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

let db; // instancia almacenada en módulo (patrón singleton)

/**
 * Conecta a MongoDB y almacena la referencia a la base de datos.
 * Si ya está conectada, retorna la instancia existente.
 */
async function conectarMongo() {
    if (db) return db;

    const cliente = new MongoClient(process.env.MONGO_URI);
    await cliente.connect();
    db = cliente.db(process.env.MONGO_DATABASE);
    console.log('✅ MongoDB conectado');
    return db;
}

/**
 * Retorna la instancia de la DB (debe haberse llamado conectarMongo primero).
 */
function obtenerDB() {
    if (!db) throw new Error('MongoDB no inicializado. Llama conectarMongo() primero.');
    return db;
}

module.exports = { conectarMongo, obtenerDB };
