/**
 * appointmentsController.js - Gestión de citas
 *
 * GET  /appointments - lista citas (ADMIN/AGENT ven todas, USER solo las suyas)
 * POST /appointments - crea una cita para el usuario autenticado
 *
 * DIFERENCIAS MySQL:
 *   - Placeholders con ?
 *   - const [rows] = await pool.execute(...)
 *   - result.insertId para obtener el id del INSERT
 *   - Filtro dinámico con concatenación de string (controlado, sin input de usuario)
 */

const pool = require('../config/db_mysql');

/**
 * GET /appointments
 */
async function listarCitas(req, res) {
    const { id: userId, roles } = req.usuario;
    const esPrivilegiado = roles.includes('ADMIN') || roles.includes('AGENT');

    try {
        // Construir query con o sin filtro de usuario
        // El valor de userId es un entero del JWT, no input directo del usuario
        const sql = `
            SELECT
                a.id,
                u.email             AS usuario_email,
                u.nombre_completo   AS usuario_nombre,
                camp.nombre         AS campana,
                a.programada_en,
                a.ubicacion,
                apst.estado         AS estado,
                a.creado_en
            FROM appointments a
            JOIN users u                        ON u.id = a.user_id
            LEFT JOIN campaigns camp            ON camp.id = a.campaign_id
            LEFT JOIN appointment_statuses apst ON apst.id = a.status_id
            ${esPrivilegiado ? '' : 'WHERE a.user_id = ?'}
            ORDER BY a.programada_en DESC`;

        const params = esPrivilegiado ? [] : [userId];
        const [rows] = await pool.execute(sql, params);

        res.json({ total: rows.length, citas: rows });

    } catch (err) {
        console.error('Error listando citas:', err.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

/**
 * POST /appointments
 * Body: { campaign_id?, programada_en, ubicacion? }
 */
async function crearCita(req, res) {
    const { id: userId } = req.usuario;
    const { campaign_id, programada_en, ubicacion } = req.body;

    if (!programada_en) {
        return res.status(400).json({ error: 'La fecha de la cita es obligatoria' });
    }

    try {
        // Obtener estado SCHEDULED
        const [statusRows] = await pool.execute(
            "SELECT id FROM appointment_statuses WHERE estado = 'SCHEDULED'"
        );
        const statusId = statusRows[0]?.id || null;

        const [result] = await pool.execute(
            `INSERT INTO appointments (user_id, campaign_id, programada_en, ubicacion, status_id)
             VALUES (?,?,?,?,?)`,
            [userId, campaign_id || null, programada_en, ubicacion || null, statusId]
        );

        res.status(201).json({
            mensaje: 'Cita creada correctamente',
            id: result.insertId
        });

    } catch (err) {
        console.error('Error creando cita:', err.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

module.exports = { listarCitas, crearCita };
