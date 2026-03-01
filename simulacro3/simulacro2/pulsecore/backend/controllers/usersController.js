/**
 * usersController.js - Gestión de usuarios
 *
 * GET /users     - lista todos los usuarios (solo ADMIN)
 * GET /users/:id - detalle de un usuario
 *
 * DIFERENCIAS MySQL:
 *   - GROUP_CONCAT en lugar de ARRAY_AGG
 *   - Placeholders con ?
 *   - const [rows] = await pool.execute(...)
 */

const pool = require('../config/db_mysql');

/**
 * GET /users
 * Solo ADMIN. Retorna todos los usuarios con roles y datos de donante.
 */
async function listarUsuarios(req, res) {
    try {
        const [rows] = await pool.execute(
            `SELECT
                u.id,
                u.email,
                u.nombre_completo,
                u.telefono,
                c.nombre            AS ciudad,
                u.estado,
                u.creado_en,
                GROUP_CONCAT(DISTINCT r.nombre) AS roles,
                bt.tipo             AS tipo_sangre,
                dl.nivel            AS nivel_donante,
                d.ultima_donacion
             FROM users u
             LEFT JOIN cities c             ON c.id  = u.city_id
             LEFT JOIN user_roles ur        ON ur.user_id = u.id
             LEFT JOIN roles r              ON r.id  = ur.role_id
             LEFT JOIN donors d             ON d.user_id = u.id
             LEFT JOIN blood_types bt       ON bt.id = d.blood_type_id
             LEFT JOIN donor_levels dl      ON dl.id = d.donor_level_id
             GROUP BY u.id, c.nombre, bt.tipo, dl.nivel, d.ultima_donacion
             ORDER BY u.creado_en DESC`
        );

        // Convertir GROUP_CONCAT string a array en cada usuario
        const usuarios = rows.map(u => ({
            ...u,
            roles: u.roles ? u.roles.split(',') : [],
        }));

        res.json({ total: usuarios.length, usuarios });

    } catch (err) {
        console.error('Error listando usuarios:', err.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

/**
 * GET /users/:id
 * USER solo puede ver su propio perfil.
 * ADMIN y AGENT pueden ver cualquier perfil.
 */
async function obtenerUsuario(req, res) {
    const idSolicitado = parseInt(req.params.id);
    const { id: idToken, roles } = req.usuario;

    if (!roles.includes('ADMIN') && !roles.includes('AGENT') && idToken !== idSolicitado) {
        return res.status(403).json({ error: 'No tienes permiso para ver este perfil' });
    }

    try {
        const [rows] = await pool.execute(
            `SELECT
                u.id, u.email, u.nombre_completo, u.telefono,
                c.nombre            AS ciudad,
                u.estado,
                GROUP_CONCAT(DISTINCT r.nombre) AS roles,
                bt.tipo             AS tipo_sangre,
                dl.nivel            AS nivel_donante,
                d.ultima_donacion
             FROM users u
             LEFT JOIN cities c        ON c.id  = u.city_id
             LEFT JOIN user_roles ur   ON ur.user_id = u.id
             LEFT JOIN roles r         ON r.id  = ur.role_id
             LEFT JOIN donors d        ON d.user_id = u.id
             LEFT JOIN blood_types bt  ON bt.id = d.blood_type_id
             LEFT JOIN donor_levels dl ON dl.id = d.donor_level_id
             WHERE u.id = ?
             GROUP BY u.id, c.nombre, bt.tipo, dl.nivel, d.ultima_donacion`,
            [idSolicitado]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const usuario = {
            ...rows[0],
            roles: rows[0].roles ? rows[0].roles.split(',') : [],
        };

        res.json(usuario);

    } catch (err) {
        console.error('Error obteniendo usuario:', err.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

module.exports = { listarUsuarios, obtenerUsuario };
