/**
 * routes/index.js - Todas las rutas protegidas de la API
 *
 * Aplica verificarToken a todas las rutas.
 * Aplica soloRoles() en las rutas que tienen restricción de rol.
 */

const express = require('express');
const router = express.Router();

const { verificarToken, soloRoles } = require('../middleware/auth');

// Controladores
const { listarUsuarios, obtenerUsuario }       = require('../controllers/usersController');
const { listarCampanas, crearCampana }         = require('../controllers/campaignsController');
const { listarCitas, crearCita }               = require('../controllers/appointmentsController');
const {
    listarTickets,
    obtenerTicket,
    crearTicket,
    cambiarEstadoTicket,
    obtenerTicketRelacionado,
} = require('../controllers/ticketsController');

// Aplicar autenticación a todas las rutas de este router
router.use(verificarToken);

// ── Usuarios ─────────────────────────────────────────────────
// Solo ADMIN puede listar todos los usuarios
router.get('/users', soloRoles('ADMIN'), listarUsuarios);
// Cualquier rol puede ver un usuario (el controlador verifica si es el suyo)
router.get('/users/:id', obtenerUsuario);

// ── Campañas ─────────────────────────────────────────────────
// Todos los roles autenticados pueden ver campañas
router.get('/campaigns', listarCampanas);
// Solo ADMIN puede crear campañas
router.post('/campaigns', soloRoles('ADMIN'), crearCampana);

// ── Citas ─────────────────────────────────────────────────────
// ADMIN y AGENT ven todas; USER solo las suyas (lógica en el controlador)
router.get('/appointments', listarCitas);
// Cualquier usuario puede crear una cita
router.post('/appointments', crearCita);

// ── Tickets (MongoDB) ─────────────────────────────────────────
// ADMIN/AGENT ven todos; USER solo los suyos
router.get('/tickets', listarTickets);
// Cualquier usuario puede crear un ticket
router.post('/tickets', crearTicket);
// Detalle completo con historial y mensajes
router.get('/tickets/:id', obtenerTicket);
// Solo ADMIN y AGENT pueden cambiar el estado
router.patch('/tickets/:id/status', soloRoles('ADMIN', 'AGENT'), cambiarEstadoTicket);
// Endpoint híbrido (Mongo + PostgreSQL)
router.get('/tickets/:id/related', obtenerTicketRelacionado);

module.exports = router;
