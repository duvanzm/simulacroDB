# 🩸 PulseCore – CRUDZASO

Sistema de gestión de donantes, campañas, citas y tickets de soporte.

---

## Cómo correr el proyecto

### 1. Requisitos previos

- Node.js 18+
- MySQL 8+
- MongoDB 6+

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
# Editar .env con tus datos de conexión
```

### 4. Crear la base de datos en MySQL

```bash
mysql -u root -p < database/schema.sql
```

Esto crea la base de datos `pulsecore`, todas las tablas y los datos iniciales de catálogo.

### 5. Insertar usuarios admin y agente por defecto

```bash
mysql -u root -p pulsecore < database/seed.sql
```

### 6. Importar el CSV (600 registros)

Copiar el archivo `Pulse_Core.csv` a la raíz del proyecto y ejecutar:

```bash
npm run seed
```

### 7. Iniciar el servidor

```bash
# Producción
npm start

# Desarrollo (con auto-reload)
npm run dev
```

Abrir en el navegador: `http://localhost:3000/pages/login.html`

---

## Credenciales de prueba

| Email | Contraseña | Rol |
|---|---|---|
| admin@pulsecore.com | admin123 | ADMIN |
| agente@pulsecore.com | agente123 | AGENT |
| (usuarios del CSV) | últimos 4 dígitos del teléfono | USER |

---

## Estructura del proyecto

```
pulsecore/
├── backend/
│   ├── config/
│   │   ├── db_mysql.js      # Pool de conexión MySQL (mysql2/promise)
│   │   └── db_mongo.js      # Conexión MongoDB
│   ├── middleware/
│   │   └── auth.js          # JWT + verificación de roles
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── usersController.js
│   │   ├── campaignsController.js
│   │   ├── appointmentsController.js
│   │   └── ticketsController.js  ← incluye el endpoint híbrido
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── index.js
│   └── server.js
├── database/
│   ├── schema.sql    # DDL completo MySQL, normalizado hasta 3FN
│   ├── seed.sql      # Usuarios admin/agente por defecto
│   └── seed.js       # Importador del CSV a MySQL + MongoDB
├── frontend/
│   ├── css/estilos.css
│   └── pages/
│       ├── login.html
│       ├── register.html
│       ├── dashboard.html
│       └── ticket-detalle.html
├── .env.example
└── package.json
```

---

## Decisiones técnicas

### MySQL2 vs PostgreSQL

Se usa **mysql2/promise** (sin ORM) con las siguientes diferencias de sintaxis clave respecto a PostgreSQL:

| Concepto | PostgreSQL | MySQL2 |
|---|---|---|
| Placeholders | `$1, $2, $3` | `?, ?, ?` |
| Resultados | `result.rows` | `const [rows] = await pool.execute(...)` |
| ID del INSERT | `RETURNING id` | `result.insertId` |
| Agrupar | `ARRAY_AGG(col)` | `GROUP_CONCAT(col)` → string con comas |
| Ignorar duplicado | `ON CONFLICT DO NOTHING` | `INSERT IGNORE` |
| Auto-increment | `SERIAL` | `INT AUTO_INCREMENT` |
| Motor de tablas | — | `ENGINE=InnoDB` (soporte FK y transacciones) |

### SQL vs NoSQL

**MySQL** gestiona toda la información estructurada y relacional: usuarios, donantes, campañas, citas y notificaciones. Requieren integridad referencial, transacciones y JOINs complejos.

**MongoDB** gestiona los tickets de soporte porque cada ticket tiene historial de eventos y mensajes con estructura variable que crece en el tiempo. El embedding de historial y mensajes dentro del documento evita múltiples queries en lecturas frecuentes.

### Normalización SQL (3FN)

- **1FN:** Se eliminaron grupos repetidos. Las ciudades de campaña y los tags de ticket eran listas en una celda del CSV.
- **2FN:** Se eliminaron dependencias parciales. Tipo de sangre, nivel y última donación dependen del donante, no del usuario → tabla `donors` separada.
- **3FN:** Se eliminaron dependencias transitivas. Ciudades, tipos de sangre, niveles, canales y estados son tablas catálogo independientes.

### Autenticación

- JWT firmado con HS256, expiración de 8 horas
- El payload lleva `{ id, email, nombre, roles[] }`
- `verificarToken`: valida el token en cada request protegida
- `soloRoles(...roles)`: fábrica de middleware que verifica el rol

### Endpoint híbrido `/tickets/:id/related`

1. Consulta MongoDB → obtiene el ticket y su `relacion_sql.ref`
2. Según el tipo (`NOTIFICATION`, `APPOINTMENT`, `CAMPAIGN`), consulta MySQL
3. Devuelve un JSON combinado con los datos de ambas fuentes

---

## Diagrama ERD (simplificado)

```
users ──── user_roles ──── roles
  │
  ├── donors ──── blood_types
  │          └── donor_levels
  │
  ├── appointments ──── appointment_statuses
  │     └── campaigns ──── campaign_cities ──── cities
  │
  └── notifications ──── notification_channels
                    └─── notification_statuses
```

## Modelo MongoDB – Colección tickets

```json
{
  "ticket_id": "TCK-000001",
  "asunto": "string",
  "categoria": "ACCOUNT | APPOINTMENTS | CAMPAIGNS | NOTIFICATIONS | OTHER",
  "prioridad": "P1 | P2 | P3 | P4",
  "estado": "OPEN | IN_PROGRESS | RESOLVED | CLOSED",
  "tags": ["string"],
  "usuario_email": "string",
  "relacion_sql": { "tipo": "NOTIFICATION | APPOINTMENT | CAMPAIGN", "ref": "string" },
  "historial": [{ "tipo_evento": "string", "ocurrido_en": "Date", "descripcion": "string" }],
  "mensajes":  [{ "autor_tipo": "USER|AGENT|SYSTEM", "autor_nombre": "string", "cuerpo": "string", "enviado_en": "Date" }],
  "creado_en": "Date",
  "actualizado_en": "Date"
}
```

**Justificación embedding:** El ticket es la unidad de lectura principal. Historial y mensajes siempre se leen junto con el ticket, por lo que incluirlos en el documento evita queries adicionales. La referencia SQL se maneja por **referencing** (solo se guarda el tipo y el ID) porque esos datos pueden cambiar y deben consultarse desde la fuente de verdad.

### Roles y permisos

| Acción | USER | AGENT | ADMIN |
|---|---|---|---|
| Ver perfil propio | ✅ | ✅ | ✅ |
| Ver todos los usuarios | ❌ | ❌ | ✅ |
| Ver campañas | ✅ | ✅ | ✅ |
| Crear campañas | ❌ | ❌ | ✅ |
| Ver/crear citas propias | ✅ | ✅ | ✅ |
| Ver todas las citas | ❌ | ✅ | ✅ |
| Crear tickets | ✅ | ✅ | ✅ |
| Ver tickets propios | ✅ | ✅ | ✅ |
| Ver todos los tickets | ❌ | ✅ | ✅ |
| Cambiar estado ticket | ❌ | ✅ | ✅ |
