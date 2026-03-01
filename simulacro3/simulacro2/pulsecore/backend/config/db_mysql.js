/**
 * db_mysql.js - Pool de conexión a MySQL con mysql2
 *
 * Usa mysql2/promise para poder usar async/await.
 * Exporta el pool para ser usado en todos los controladores.
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

// Crear pool de conexiones (reutiliza conexiones en lugar de abrir una nueva por query)
const pool = mysql.createPool({
    host:     process.env.MYSQL_HOST     || 'localhost',
    port:     Number(process.env.MYSQL_PORT) || 3306,
    database: process.env.MYSQL_DATABASE,
    user:     process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    waitForConnections: true,   // Esperar si no hay conexiones libres
    connectionLimit: 10,        // Máximo de conexiones simultáneas
    queueLimit: 0,              // Sin límite en la cola de espera
});

// Verificar conexión al iniciar
pool.getConnection()
    .then(conn => {
        console.log('✅ MySQL conectado');
        conn.release(); // Devolver la conexión al pool
    })
    .catch(err => {
        console.error('❌ Error conectando a MySQL:', err.message);
    });

module.exports = pool;
