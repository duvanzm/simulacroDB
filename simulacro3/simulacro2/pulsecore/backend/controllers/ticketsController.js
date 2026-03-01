/**
 * ticketsController.js - Gestión de tickets de soporte (MongoDB)
 *
 * GET  /tickets              - lista tickets
 * GET  /tickets/:id          - detalle de un ticket
 * POST /tickets              - crea un ticket nuevo
 * PATCH /tickets/:id/status  - cambia estado del ticket (ADMIN/AGENT)
 * GET  /tickets/:id/related  - endpoint híbrido: MongoDB + MySQL
 *
 * Los tickets viven en MongoDB.
 * El endpoint híbrido /related combina MongoDB con consultas a MySQL.
 *
 * DIFERENCIAS MySQL en el endpoint híbrido:
 *   - Placeholders con ?
 *   - const [rows] = await pool.execute(...)
 *   - rows[0] en lugar de rows.rows[0]
 */

const { obtenerDB } = require('../config/db_mongo');
const pool          = require('../config/db_mysql');

/**
 * GET /tickets
 * ADMIN/AGENT: todos los tickets | USER: solo los suyos
 */
async function listarTickets(req, res) {
    const { email, roles } = req.usuario;
    const esPrivilegiado   = roles.includes('ADMIN') || roles.includes('AGENT');

    try {
        const db     = obtenerDB();
        const filtro = esPrivilegiado ? {} : { usuario_email: email };

        const tickets = await db.collection('tickets')
            .find(filtro, { projection: { historial: 0, mensajes: 0 } })
            .sort({ creado_en: -1 })
            .toArray();

        res.json({ total: tickets.length, tickets });

    } catch (err) {
        console.error('Error listando tickets:', err.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

/**
 * GET /tickets/:id
 * Ticket completo con historial y mensajes.
 */
async function obtenerTicket(req, res) {
    const { id }    = req.params;
    const { email, roles } = req.usuario;

    try {
        const db     = obtenerDB();
        const ticket = await db.collection('tickets').findOne({ ticket_id: id });

        if (!ticket) {
            return res.status(404).json({ error: 'Ticket no encontrado' });
        }

        const esPrivilegiado = roles.includes('ADMIN') || roles.includes('AGENT');
        if (!esPrivilegiado && ticket.usuario_email !== email) {
            return res.status(403).json({ error: 'No tienes acceso a este ticket' });
        }

        res.json(ticket);

    } catch (err) {
        console.error('Error obteniendo ticket:', err.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

/**
 * POST /tickets
 * Body: { asunto, categoria, prioridad?, tags?: [] }
 */
async function crearTicket(req, res) {
    const { email, nombre } = req.usuario;
    const { asunto, categoria, prioridad, tags } = req.body;

    if (!asunto || !categoria) {
        return res.status(400).json({ error: 'Asunto y categoría son obligatorios' });
    }

    const categorias = ['ACCOUNT', 'APPOINTMENTS', 'CAMPAIGNS', 'NOTIFICATIONS', 'OTHER'];
    if (!categorias.includes(categoria)) {
        return res.status(400).json({
            error: `Categoría inválida. Opciones: ${categorias.join(', ')}`
        });
    }

    try {
        const db    = obtenerDB();
        const total = await db.collection('tickets').countDocuments();
        const nuevoId = `TCK-${String(total + 1).padStart(6, '0')}`;

        await db.collection('tickets').insertOne({
            ticket_id:    nuevoId,
            asunto,
            categoria,
            prioridad:    prioridad || 'P3',
            estado:       'OPEN',
            tags:         tags || [],
            usuario_email: email,
            relacion_sql: null,
            historial: [
                {
                    tipo_evento: 'TICKET_CREATED',
                    ocurrido_en: new Date(),
                    descripcion: `Ticket creado por ${nombre}`,
                }
            ],
            mensajes:       [],
            creado_en:      new Date(),
            actualizado_en: new Date(),
        });

        res.status(201).json({ mensaje: 'Ticket creado', ticket_id: nuevoId });

    } catch (err) {
        console.error('Error creando ticket:', err.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

/**
 * PATCH /tickets/:id/status
 * Solo ADMIN y AGENT.
 * Body: { estado: 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' }
 */
async function cambiarEstadoTicket(req, res) {
    const { id }    = req.params;
    const { estado } = req.body;
    const { nombre } = req.usuario;

    const estadosValidos = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
    if (!estadosValidos.includes(estado)) {
        return res.status(400).json({
            error: `Estado inválido. Opciones: ${estadosValidos.join(', ')}`
        });
    }

    try {
        const db     = obtenerDB();
        const ticket = await db.collection('tickets').findOne({ ticket_id: id });

        if (!ticket) {
            return res.status(404).json({ error: 'Ticket no encontrado' });
        }

        await db.collection('tickets').updateOne(
            { ticket_id: id },
            {
                $set:  { estado, actualizado_en: new Date() },
                $push: {
                    historial: {
                        tipo_evento: 'TICKET_STATUS_CHANGED',
                        ocurrido_en: new Date(),
                        descripcion: `Estado cambiado de ${ticket.estado} a ${estado} por ${nombre}`,
                    }
                }
            }
        );

        res.json({ mensaje: 'Estado actualizado', ticket_id: id, nuevo_estado: estado });

    } catch (err) {
        console.error('Error cambiando estado:', err.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

/**
 * GET /tickets/:id/related  ← ENDPOINT HÍBRIDO
 *
 * 1. Consulta MongoDB para obtener el ticket y su relacion_sql
 * 2. Según el tipo (NOTIFICATION | APPOINTMENT | CAMPAIGN),
 *    consulta MySQL para traer la entidad relacionada
 * 3. Devuelve ambos resultados combinados en un solo objeto
 */
async function obtenerTicketRelacionado(req, res) {
    const { id }           = req.params;
    const { email, roles } = req.usuario;

    try {
        const db     = obtenerDB();
        const ticket = await db.collection('tickets').findOne({ ticket_id: id });

        if (!ticket) {
            return res.status(404).json({ error: 'Ticket no encontrado' });
        }

        const esPrivilegiado = roles.includes('ADMIN') || roles.includes('AGENT');
        if (!esPrivilegiado && ticket.usuario_email !== email) {
            return res.status(403).json({ error: 'No tienes acceso a este ticket' });
        }

        // Consultar la entidad SQL relacionada según el tipo
        let entidadSQL = null;

        if (ticket.relacion_sql?.ref) {
            const { tipo, ref } = ticket.relacion_sql;

            if (tipo === 'NOTIFICATION') {
                // Notificación en MySQL
                const [rows] = await pool.execute(
                    `SELECT n.id, n.mensaje, nc.canal, ns.estado, n.enviada_en,
                            u.email AS usuario_email, u.nombre_completo
                     FROM notifications n
                     JOIN notification_channels nc ON nc.id = n.channel_id
                     JOIN notification_statuses ns ON ns.id = n.status_id
                     JOIN users u                  ON u.id  = n.user_id
                     WHERE n.id = ?`,
                    [ref]
                );
                entidadSQL = rows[0] || null;

            } else if (tipo === 'APPOINTMENT') {
                // Cita en MySQL
                const [rows] = await pool.execute(
                    `SELECT a.id, a.programada_en, a.ubicacion,
                            apst.estado, camp.nombre AS campana,
                            u.email AS usuario_email
                     FROM appointments a
                     JOIN users u                        ON u.id   = a.user_id
                     LEFT JOIN campaigns camp            ON camp.id = a.campaign_id
                     LEFT JOIN appointment_statuses apst ON apst.id = a.status_id
                     WHERE a.id = ?`,
                    [parseInt(ref)]
                );
                entidadSQL = rows[0] || null;

            } else if (tipo === 'CAMPAIGN') {
                // Campaña en MySQL
                const [rows] = await pool.execute(
                    `SELECT camp.id, camp.nombre, camp.fecha_inicio, camp.fecha_fin,
                            GROUP_CONCAT(c.nombre) AS ciudades
                     FROM campaigns camp
                     LEFT JOIN campaign_cities cc ON cc.campaign_id = camp.id
                     LEFT JOIN cities c           ON c.id = cc.city_id
                     WHERE camp.id = ?
                     GROUP BY camp.id`,
                    [parseInt(ref)]
                );
                if (rows[0]) {
                    entidadSQL = {
                        ...rows[0],
                        ciudades: rows[0].ciudades ? rows[0].ciudades.split(',') : [],
                    };
                }
            }
        }

        // Respuesta combinada Mongo + MySQL
        res.json({
            ticket: {
                ticket_id: ticket.ticket_id,
                asunto:    ticket.asunto,
                categoria: ticket.categoria,
                prioridad: ticket.prioridad,
                estado:    ticket.estado,
                tags:      ticket.tags,
                historial: ticket.historial,
                mensajes:  ticket.mensajes,
            },
            relacion_sql: {
                tipo:  ticket.relacion_sql?.tipo || null,
                ref:   ticket.relacion_sql?.ref  || null,
                datos: entidadSQL,
            }
        });

    } catch (err) {
        console.error('Error en endpoint híbrido:', err.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

module.exports = {
    listarTickets,
    obtenerTicket,
    crearTicket,
    cambiarEstadoTicket,
    obtenerTicketRelacionado,
};
