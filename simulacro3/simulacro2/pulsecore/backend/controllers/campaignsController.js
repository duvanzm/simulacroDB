/**
 * campaignsController.js - Gestión de campañas
 *
 * GET  /campaigns - lista todas las campañas con sus ciudades
 * POST /campaigns - crea una nueva campaña (solo ADMIN)
 *
 * DIFERENCIAS MySQL:
 *   - GROUP_CONCAT en lugar de ARRAY_AGG
 *   - Placeholders con ?
 *   - result.insertId para obtener el id del INSERT
 *   - INSERT IGNORE para evitar duplicados
 */

const pool = require('../config/db_mysql');

/**
 * GET /campaigns
 * Accesible por todos los roles autenticados.
 */
async function listarCampanas(req, res) {
    try {
        const [rows] = await pool.execute(
            `SELECT
                camp.id,
                camp.nombre,
                camp.fecha_inicio,
                camp.fecha_fin,
                camp.creado_en,
                GROUP_CONCAT(DISTINCT c.nombre) AS ciudades
             FROM campaigns camp
             LEFT JOIN campaign_cities cc ON cc.campaign_id = camp.id
             LEFT JOIN cities c           ON c.id = cc.city_id
             GROUP BY camp.id
             ORDER BY camp.fecha_inicio DESC`
        );

        // Convertir ciudades de string a array
        const campanas = rows.map(c => ({
            ...c,
            ciudades: c.ciudades ? c.ciudades.split(',') : [],
        }));

        res.json({ total: campanas.length, campanas });

    } catch (err) {
        console.error('Error listando campañas:', err.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

/**
 * POST /campaigns
 * Solo ADMIN.
 * Body: { nombre, fecha_inicio, fecha_fin, ciudades: ['Medellin', 'Bogota'] }
 */
async function crearCampana(req, res) {
    const { nombre, fecha_inicio, fecha_fin, ciudades } = req.body;

    if (!nombre || !fecha_inicio || !fecha_fin) {
        return res.status(400).json({ error: 'Nombre, fecha_inicio y fecha_fin son obligatorios' });
    }

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const [result] = await conn.execute(
            'INSERT INTO campaigns (nombre, fecha_inicio, fecha_fin) VALUES (?,?,?)',
            [nombre, fecha_inicio, fecha_fin]
        );
        const campaignId = result.insertId;

        // Asociar ciudades
        if (ciudades && Array.isArray(ciudades)) {
            for (const nombreCiudad of ciudades) {
                // Insertar ciudad si no existe
                await conn.execute(
                    'INSERT IGNORE INTO cities (nombre) VALUES (?)', [nombreCiudad]
                );
                const [cityRows] = await conn.execute(
                    'SELECT id FROM cities WHERE UPPER(nombre) = UPPER(?)', [nombreCiudad]
                );
                if (cityRows.length > 0) {
                    await conn.execute(
                        'INSERT IGNORE INTO campaign_cities (campaign_id, city_id) VALUES (?,?)',
                        [campaignId, cityRows[0].id]
                    );
                }
            }
        }

        await conn.commit();
        res.status(201).json({ mensaje: 'Campaña creada', id: campaignId });

    } catch (err) {
        await conn.rollback();
        console.error('Error creando campaña:', err.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    } finally {
        conn.release();
    }
}

module.exports = { listarCampanas, crearCampana };
