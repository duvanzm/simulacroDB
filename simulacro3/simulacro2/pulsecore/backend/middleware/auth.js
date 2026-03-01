/**
 * auth.js - Middleware de autenticación y autorización
 *
 * verificarToken : valida el JWT en el header Authorization
 * soloRoles(...) : verifica que el usuario tenga al menos uno de los roles indicados
 */

const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Middleware que verifica el token JWT.
 * Si es válido, adjunta los datos del usuario a req.usuario.
 */
function verificarToken(req, res, next) {
    const authHeader = req.headers['authorization'];

    // El header debe ser: "Bearer <token>"
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = payload; // { id, email, roles: ['USER', 'ADMIN', ...] }
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Token inválido o expirado' });
    }
}

/**
 * Fábrica de middleware que restringe el acceso a ciertos roles.
 * Uso: router.get('/ruta', verificarToken, soloRoles('ADMIN', 'AGENT'), handler)
 *
 * @param {...string} rolesPermitidos - Roles que pueden acceder al endpoint
 */
function soloRoles(...rolesPermitidos) {
    return (req, res, next) => {
        if (!req.usuario) {
            return res.status(401).json({ error: 'No autenticado' });
        }

        const tienePermiso = req.usuario.roles.some(r => rolesPermitidos.includes(r));

        if (!tienePermiso) {
            return res.status(403).json({
                error: `Acceso denegado. Se requiere uno de: ${rolesPermitidos.join(', ')}`
            });
        }

        next();
    };
}

module.exports = { verificarToken, soloRoles };
