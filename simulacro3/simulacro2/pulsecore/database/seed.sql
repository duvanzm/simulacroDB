-- ============================================================
-- PULSECORE - Seed de usuarios por defecto (MySQL)
-- Ejecutar DESPUÉS de schema.sql
-- ============================================================

USE pulsecore;

-- Usuario administrador por defecto (password: admin123)
INSERT INTO users (email, password_hash, nombre_completo, telefono, city_id, estado, canal_preferido_id)
VALUES (
    'admin@pulsecore.com',
    '$2b$10$K.0HwpsoPDBrsCy0QkTNFe8xD7GJe5PQC4oXbWtTk3wJH6KF1TXJG',
    'Administrador PulseCore',
    '3000000000',
    (SELECT id FROM cities WHERE nombre = 'Medellin'),
    'ACTIVE',
    (SELECT id FROM notification_channels WHERE canal = 'EMAIL')
);

INSERT INTO user_roles (user_id, role_id)
VALUES (
    (SELECT id FROM users WHERE email = 'admin@pulsecore.com'),
    (SELECT id FROM roles WHERE nombre = 'ADMIN')
);

-- Agente de soporte por defecto (password: agente123)
INSERT INTO users (email, password_hash, nombre_completo, telefono, city_id, estado, canal_preferido_id)
VALUES (
    'agente@pulsecore.com',
    '$2b$10$K.0HwpsoPDBrsCy0QkTNFe8xD7GJe5PQC4oXbWtTk3wJH6KF1TXJG',
    'Agente Soporte',
    '3001111111',
    (SELECT id FROM cities WHERE nombre = 'Bogota'),
    'ACTIVE',
    (SELECT id FROM notification_channels WHERE canal = 'EMAIL')
);

INSERT INTO user_roles (user_id, role_id)
VALUES (
    (SELECT id FROM users WHERE email = 'agente@pulsecore.com'),
    (SELECT id FROM roles WHERE nombre = 'AGENT')
);
