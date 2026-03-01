/**
 * authController.js - Lógica de login y registro
 *
 * POST /login    - autentica usuario y devuelve JWT
 * POST /register - crea nuevo usuario con rol USER
 *
 * DIFERENCIAS MySQL vs PostgreSQL:
 *   - Placeholders: ? en lugar de $1, $2...
 *   - pool.execute() devuelve [rows, fields]; se desestructura así: const [rows] = await pool.execute(...)
 *   - INSERT no devuelve RETURNING; el id está en result.insertId
 *   - GROUP_CONCAT en lugar de ARRAY_AGG para agrupar roles
 */

const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const pool   = require('../config/db_mysql');
require('dotenv').config();

/**
 * POST /login
 * Body: { email, password }
 * Retorna: { token, usuario: { id, email, nombre, roles } }
 */
async function login(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
    }

    try {
        // GROUP_CONCAT agrupa los roles en un string separado por coma
        const [rows] = await pool.execute(
            `SELECT u.id, u.email, u.password_hash, u.nombre_completo, u.estado,
                    GROUP_CONCAT(r.nombre) AS roles
             FROM users u
             LEFT JOIN user_roles ur ON ur.user_id = u.id
             LEFT JOIN roles r       ON r.id = ur.role_id
             WHERE u.email = ?
             GROUP BY u.id`,
            [email]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        const usuario = rows[0];

        const passwordValida = await bcrypt.compare(password, usuario.password_hash);
        if (!passwordValida) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        if (usuario.estado === 'INACTIVE') {
            return res.status(403).json({ error: 'Cuenta inactiva' });
        }

        // GROUP_CONCAT devuelve string "ADMIN,USER" → convertir a array
        const rolesArray = usuario.roles ? usuario.roles.split(',') : [];

        const token = jwt.sign(
            {
                id:     usuario.id,
                email:  usuario.email,
                nombre: usuario.nombre_completo,
                roles:  rolesArray,
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
        );

        res.json({
            token,
            usuario: {
                id:     usuario.id,
                email:  usuario.email,
                nombre: usuario.nombre_completo,
                roles:  rolesArray,
            }
        });

    } catch (err) {
        console.error('Error en login:', err.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

/**
 * POST /register
 * Body: { email, password, nombre_completo, telefono?, ciudad? }
 */
async function register(req, res) {
    const { email, password, nombre_completo, telefono, ciudad } = req.body;

    if (!email || !password || !nombre_completo) {
        return res.status(400).json({ error: 'Email, contraseña y nombre son obligatorios' });
    }

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // Verificar que el email no exista
        const [existe] = await conn.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existe.length > 0) {
            await conn.rollback();
            return res.status(409).json({ error: 'El email ya está registrado' });
        }

        // Buscar ciudad si fue enviada
        let cityId = null;
        if (ciudad) {
            const [cityRows] = await conn.execute(
                'SELECT id FROM cities WHERE UPPER(nombre) = UPPER(?)', [ciudad]
            );
            if (cityRows.length > 0) cityId = cityRows[0].id;
        }

        const hash = await bcrypt.hash(password, 10);

        // En MySQL el id del INSERT está en result.insertId
        const [result] = await conn.execute(
            `INSERT INTO users (email, password_hash, nombre_completo, telefono, city_id, estado)
             VALUES (?,?,?,?,?,'ACTIVE')`,
            [email, hash, nombre_completo, telefono || null, cityId]
        );
        const userId = result.insertId;

        // Asignar rol USER por defecto
        await conn.execute(
            `INSERT INTO user_roles (user_id, role_id)
             SELECT ?, id FROM roles WHERE nombre = 'USER'`,
            [userId]
        );

        await conn.commit();
        res.status(201).json({ mensaje: 'Usuario registrado correctamente', id: userId });

    } catch (err) {
        await conn.rollback();
        console.error('Error en registro:', err.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    } finally {
        conn.release();
    }
}

module.exports = { login, register };
