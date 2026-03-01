/**
 * authRoutes.js - Rutas de autenticación
 * 
 * POST /login    → Iniciar sesión
 * POST /register → Registrar nuevo usuario
 */

const express = require('express');
const router = express.Router();
const { login, register } = require('../controllers/authController');

router.post('/login', login);
router.post('/register', register);

module.exports = router;
