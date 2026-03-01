/**
 * seed.js - Importador del CSV a MySQL y MongoDB
 *
 * Lee el archivo Pulse_Core.csv (debe estar en la raíz del proyecto)
 * y carga los datos en ambas bases de datos.
 *
 * Ejecutar UNA sola vez:
 *   node database/seed.js
 *
 * DIFERENCIAS vs PostgreSQL:
 *   - mysql2 usa ? como placeholder (no $1, $2...)
 *   - INSERT IGNORE en lugar de ON CONFLICT DO NOTHING
 *   - Las filas afectadas se leen de result.affectedRows
 *   - pool.execute() devuelve [rows, fields] (array destructurado)
 */

const fs   = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const mysql = require('mysql2/promise');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// ── Conexiones ──────────────────────────────────────────────
const pool = mysql.createPool({
    host:     process.env.MYSQL_HOST,
    port:     Number(process.env.MYSQL_PORT) || 3306,
    database: process.env.MYSQL_DATABASE,
    user:     process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    multipleStatements: false,
});

const mongoClient = new MongoClient(process.env.MONGO_URI);

// ── Leer CSV ────────────────────────────────────────────────
const csvPath = path.join(__dirname, '../Pulse_Core.csv');
const filas   = parse(fs.readFileSync(csvPath, 'utf8'), {
    columns: true,
    skip_empty_lines: true,
});
console.log(`📄 CSV cargado: ${filas.length} filas`);

// ── Helpers ─────────────────────────────────────────────────

/**
 * Obtiene el id de un registro en una tabla catálogo,
 * o lo inserta si no existe. Usa caché en memoria para evitar
 * consultas repetidas al mismo valor.
 *
 * NOTA MySQL: usa INSERT IGNORE + SELECT para manejar duplicados.
 */
const cacheCatalogos = {};

async function obtenerOInsertarCatalogo(conn, tabla, campo, valor) {
    if (!valor || String(valor).trim() === '') return null;

    const clave = `${tabla}:${valor.trim().toUpperCase()}`;
    if (cacheCatalogos[clave]) return cacheCatalogos[clave];

    // Intentar insertar (si ya existe, INSERT IGNORE no falla)
    await conn.execute(
        `INSERT IGNORE INTO ${tabla} (${campo}) VALUES (?)`,
        [valor.trim()]
    );

    // Obtener el id (ya sea recién insertado o preexistente)
    const [rows] = await conn.execute(
        `SELECT id FROM ${tabla} WHERE UPPER(${campo}) = UPPER(?)`,
        [valor.trim()]
    );

    const id = rows[0]?.id || null;
    cacheCatalogos[clave] = id;
    return id;
}

// ── Proceso principal ────────────────────────────────────────
async function importar() {
    // Obtener una conexión del pool (para usar transacción)
    const conn = await pool.getConnection();
    await mongoClient.connect();

    const db      = mongoClient.db(process.env.MONGO_DATABASE);
    const tickets = db.collection('tickets');

    // Índice único para evitar duplicados en MongoDB
    await tickets.createIndex({ ticket_id: 1 }, { unique: true });

    // Mapas en memoria para evitar duplicados
    const usuariosCreados  = new Map(); // email -> user_id
    const campaignasCreadas = new Map(); // nombre -> campaign_id
    const ticketsCreados   = new Set(); // ticket_id procesados

    try {
        await conn.beginTransaction();

        for (const fila of filas) {

            // ── 1. USUARIO ───────────────────────────────────
            let userId;
            if (usuariosCreados.has(fila.user_email)) {
                userId = usuariosCreados.get(fila.user_email);
            } else {
                const cityId    = await obtenerOInsertarCatalogo(conn, 'cities', 'nombre', fila.user_city);
                const channelId = await obtenerOInsertarCatalogo(conn, 'notification_channels', 'canal', fila.preferred_channel);

                // Contraseña temporal: últimos 4 dígitos del teléfono
                const passTemp = fila.user_phone?.slice(-4) || '1234';
                const hash     = await bcrypt.hash(passTemp, 10);

                // INSERT IGNORE evita error si el email ya existe
                await conn.execute(
                    `INSERT IGNORE INTO users
                     (email, password_hash, nombre_completo, telefono, city_id, estado, canal_preferido_id)
                     VALUES (?,?,?,?,?,?,?)`,
                    [fila.user_email, hash, fila.user_full_name,
                     fila.user_phone, cityId, fila.user_status || 'ACTIVE', channelId]
                );

                // Obtener id (sea nuevo o ya existente)
                const [uRows] = await conn.execute(
                    'SELECT id FROM users WHERE email = ?', [fila.user_email]
                );
                userId = uRows[0].id;
                usuariosCreados.set(fila.user_email, userId);

                // Asignar rol USER por defecto
                await conn.execute(
                    `INSERT IGNORE INTO user_roles (user_id, role_id)
                     SELECT ?, id FROM roles WHERE nombre = 'USER'`,
                    [userId]
                );

                // ── 2. DONANTE ───────────────────────────────
                const bloodId = await obtenerOInsertarCatalogo(conn, 'blood_types', 'tipo', fila.blood_type);
                const levelId = await obtenerOInsertarCatalogo(conn, 'donor_levels', 'nivel', fila.donor_level);

                await conn.execute(
                    `INSERT IGNORE INTO donors (user_id, blood_type_id, donor_level_id, ultima_donacion)
                     VALUES (?,?,?,?)`,
                    [userId, bloodId, levelId, fila.last_donation_date || null]
                );
            }

            // ── 3. CAMPAÑA ───────────────────────────────────
            let campaignId = null;
            if (fila.campaign_name) {
                if (campaignasCreadas.has(fila.campaign_name)) {
                    campaignId = campaignasCreadas.get(fila.campaign_name);
                } else {
                    await conn.execute(
                        `INSERT IGNORE INTO campaigns (nombre, fecha_inicio, fecha_fin)
                         VALUES (?,?,?)`,
                        [fila.campaign_name, fila.campaign_start_date, fila.campaign_end_date]
                    );
                    const [cRows] = await conn.execute(
                        'SELECT id FROM campaigns WHERE nombre = ?', [fila.campaign_name]
                    );
                    campaignId = cRows[0].id;
                    campaignasCreadas.set(fila.campaign_name, campaignId);
                }

                // Asociar ciudad a la campaña
                if (fila.campaign_city) {
                    const ccityId = await obtenerOInsertarCatalogo(conn, 'cities', 'nombre', fila.campaign_city);
                    await conn.execute(
                        'INSERT IGNORE INTO campaign_cities (campaign_id, city_id) VALUES (?,?)',
                        [campaignId, ccityId]
                    );
                }
            }

            // ── 4. CITA ──────────────────────────────────────
            let appointmentId = null;
            if (fila.appointment_scheduled_at) {
                const apptStatusId = await obtenerOInsertarCatalogo(
                    conn, 'appointment_statuses', 'estado',
                    fila.appointment_status || 'SCHEDULED'
                );
                const [aRes] = await conn.execute(
                    `INSERT INTO appointments (user_id, campaign_id, programada_en, ubicacion, status_id)
                     VALUES (?,?,?,?,?)`,
                    [userId, campaignId, fila.appointment_scheduled_at,
                     fila.appointment_location || null, apptStatusId]
                );
                appointmentId = aRes.insertId; // MySQL devuelve el ID en insertId
            }

            // ── 5. NOTIFICACIÓN ──────────────────────────────
            if (fila.notification_message) {
                const nChannelId = await obtenerOInsertarCatalogo(conn, 'notification_channels', 'canal', fila.notification_channel);
                const nStatusId  = await obtenerOInsertarCatalogo(conn, 'notification_statuses', 'estado', fila.notification_status);
                const notifRef   = `NOTIF-${String(fila.row_id).padStart(6, '0')}`;

                await conn.execute(
                    `INSERT IGNORE INTO notifications (id, user_id, appointment_id, channel_id, mensaje, status_id, enviada_en)
                     VALUES (?,?,?,?,?,?,?)`,
                    [notifRef, userId, appointmentId, nChannelId,
                     fila.notification_message, nStatusId, fila.notification_sent_at || null]
                );
            }

            // ── 6. TICKET (MongoDB) ───────────────────────────
            if (fila.ticket_id && !ticketsCreados.has(fila.ticket_id)) {
                const tagsList = [fila.ticket_tag_1, fila.ticket_tag_2, fila.ticket_tag_3]
                    .filter(t => t && t.trim() !== '');

                try {
                    await tickets.insertOne({
                        ticket_id:    fila.ticket_id,
                        asunto:       fila.ticket_subject,
                        categoria:    fila.ticket_category,
                        prioridad:    fila.ticket_priority,
                        estado:       fila.ticket_status,
                        tags:         tagsList,
                        usuario_email: fila.user_email,
                        relacion_sql: {
                            tipo: fila.related_type, // NOTIFICATION | APPOINTMENT | CAMPAIGN
                            ref:  fila.related_ref,
                        },
                        historial:    [],
                        mensajes:     [],
                        creado_en:    new Date(),
                        actualizado_en: new Date(),
                    });
                } catch (e) {
                    // Ignorar error de clave duplicada (ticket ya insertado)
                    if (e.code !== 11000) throw e;
                }
                ticketsCreados.add(fila.ticket_id);
            }

            // ── 7. EVENTO / MENSAJE del ticket (MongoDB) ─────
            if (fila.ticket_id && fila.event_type) {
                const filtro = { ticket_id: fila.ticket_id };

                if (fila.event_type === 'TICKET_MESSAGE' && fila.message_body) {
                    await tickets.updateOne(filtro, {
                        $push: {
                            mensajes: {
                                autor_tipo:   fila.message_author_type,
                                autor_nombre: fila.message_author_name,
                                cuerpo:       fila.message_body,
                                adjunto_url:  fila.attachment_url || null,
                                enviado_en:   new Date(fila.event_at),
                            }
                        },
                        $set: { actualizado_en: new Date() }
                    });
                } else {
                    await tickets.updateOne(filtro, {
                        $push: {
                            historial: {
                                tipo_evento: fila.event_type,
                                ocurrido_en: new Date(fila.event_at),
                                descripcion: fila.message_body || '',
                            }
                        },
                        $set: { actualizado_en: new Date() }
                    });
                }
            }
        }

        await conn.commit();
        console.log('✅ MySQL: datos importados correctamente');
        console.log(`✅ MongoDB: ${await tickets.countDocuments()} tickets cargados`);

    } catch (err) {
        await conn.rollback();
        console.error('❌ Error durante la importación:', err.message);
        throw err;
    } finally {
        conn.release();
        await mongoClient.close();
        await pool.end();
    }
}

importar().catch(console.error);
