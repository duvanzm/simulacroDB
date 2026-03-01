/**
 * server.js - Punto de entrada del servidor Express
 *
 * Inicializa las conexiones a PostgreSQL y MongoDB,
 * registra los middlewares y las rutas, y levanta el servidor.
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { conectarMongo } = require('./config/db_mongo');
// La conexión de MySQL se inicializa al importar el módulo
require('./config/db_mysql');

const authRoutes = require('./routes/authRoutes');
const apiRoutes = require('./routes/index');

const app = express();

// ── Middlewares globales ─────────────────────────────────────
app.use(cors());                          // Permite peticiones del frontend
app.use(express.json());                  // Parsear JSON en el body
app.use(express.urlencoded({ extended: true }));

// ── Servir el frontend estático ──────────────────────────────
// El frontend (HTML, CSS, JS) está en la carpeta /frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// ── Rutas ────────────────────────────────────────────────────
// Autenticación (sin token)
app.use('/api', authRoutes);

// Rutas protegidas (requieren token JWT)
app.use('/api', apiRoutes);

// Fallback: sirve el index del frontend para cualquier ruta no encontrada
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/login.html'));
});

// ── Arranque del servidor ────────────────────────────────────
const PORT = process.env.PORT || 3000;

async function iniciar() {
    try {
        // Conectar MongoDB antes de aceptar peticiones
        await conectarMongo();

        app.listen(PORT, () => {
            console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('❌ Error iniciando el servidor:', err.message);
        process.exit(1);
    }
}

iniciar();
