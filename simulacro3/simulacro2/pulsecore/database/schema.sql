-- ============================================================
-- PULSECORE - Script SQL para MySQL
-- Base de datos normalizada hasta Tercera Forma Normal (3FN)
-- Motor: MySQL 8+
-- Ejecutar: mysql -u root -p < database/schema.sql
-- ============================================================

-- Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS pulsecore CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE pulsecore;

-- Deshabilitar verificación de FK durante la limpieza
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS campaign_cities;
DROP TABLE IF EXISTS campaigns;
DROP TABLE IF EXISTS donors;
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS cities;
DROP TABLE IF EXISTS blood_types;
DROP TABLE IF EXISTS donor_levels;
DROP TABLE IF EXISTS appointment_statuses;
DROP TABLE IF EXISTS notification_channels;
DROP TABLE IF EXISTS notification_statuses;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- TABLAS DE CATÁLOGO
-- (evitan valores de texto repetidos y facilitan cambios globales)
-- ============================================================

-- Ciudades (normaliza user_city y campaign_city del CSV)
CREATE TABLE cities (
    id   INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- Tipos de sangre
CREATE TABLE blood_types (
    id   INT AUTO_INCREMENT PRIMARY KEY,
    tipo VARCHAR(5) NOT NULL UNIQUE   -- A+, AB-, O+, etc.
) ENGINE=InnoDB;

-- Niveles de donante
CREATE TABLE donor_levels (
    id    INT AUTO_INCREMENT PRIMARY KEY,
    nivel VARCHAR(20) NOT NULL UNIQUE  -- BRONZE, SILVER, GOLD
) ENGINE=InnoDB;

-- Roles del sistema
CREATE TABLE roles (
    id     INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(20) NOT NULL UNIQUE  -- ADMIN, AGENT, USER
) ENGINE=InnoDB;

-- Canales de comunicación
CREATE TABLE notification_channels (
    id    INT AUTO_INCREMENT PRIMARY KEY,
    canal VARCHAR(30) NOT NULL UNIQUE   -- EMAIL, SMS, WHATSAPP
) ENGINE=InnoDB;

-- Estados de notificación
CREATE TABLE notification_statuses (
    id     INT AUTO_INCREMENT PRIMARY KEY,
    estado VARCHAR(20) NOT NULL UNIQUE  -- SENT, PENDING, FAILED
) ENGINE=InnoDB;

-- Estados de cita
CREATE TABLE appointment_statuses (
    id     INT AUTO_INCREMENT PRIMARY KEY,
    estado VARCHAR(20) NOT NULL UNIQUE  -- SCHEDULED, RESCHEDULED, CANCELLED
) ENGINE=InnoDB;

-- ============================================================
-- USUARIOS
-- ============================================================
CREATE TABLE users (
    id                   INT AUTO_INCREMENT PRIMARY KEY,
    email                VARCHAR(150) NOT NULL UNIQUE,
    password_hash        VARCHAR(255) NOT NULL,
    nombre_completo      VARCHAR(150) NOT NULL,
    telefono             VARCHAR(20),
    city_id              INT,
    estado               ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    canal_preferido_id   INT,
    creado_en            DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (city_id)            REFERENCES cities(id),
    FOREIGN KEY (canal_preferido_id) REFERENCES notification_channels(id)
) ENGINE=InnoDB;

-- Relación N:M entre usuarios y roles
CREATE TABLE user_roles (
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- DONANTES
-- (Separado de users: los atributos de donante no dependen
--  de las credenciales de acceso → cumple 3FN)
-- ============================================================
CREATE TABLE donors (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL UNIQUE,
    blood_type_id   INT,
    donor_level_id  INT,
    ultima_donacion DATE,
    FOREIGN KEY (user_id)        REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (blood_type_id)  REFERENCES blood_types(id),
    FOREIGN KEY (donor_level_id) REFERENCES donor_levels(id)
) ENGINE=InnoDB;

-- ============================================================
-- CAMPAÑAS
-- ============================================================
CREATE TABLE campaigns (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    nombre      VARCHAR(200) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin    DATE NOT NULL,
    creado_en    DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Relación N:M entre campañas y ciudades
-- (Una campaña puede realizarse en varias ciudades)
CREATE TABLE campaign_cities (
    campaign_id INT NOT NULL,
    city_id     INT NOT NULL,
    PRIMARY KEY (campaign_id, city_id),
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (city_id)     REFERENCES cities(id)
) ENGINE=InnoDB;

-- ============================================================
-- CITAS
-- ============================================================
CREATE TABLE appointments (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    user_id       INT NOT NULL,
    campaign_id   INT,
    programada_en DATETIME,
    ubicacion     VARCHAR(200),
    status_id     INT,
    creado_en     DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)     REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
    FOREIGN KEY (status_id)   REFERENCES appointment_statuses(id)
) ENGINE=InnoDB;

-- ============================================================
-- NOTIFICACIONES
-- ============================================================
CREATE TABLE notifications (
    id             VARCHAR(20) PRIMARY KEY,   -- ej: NOTIF-000001
    user_id        INT NOT NULL,
    appointment_id INT,
    channel_id     INT,
    mensaje        TEXT,
    status_id      INT,
    enviada_en     DATETIME,
    FOREIGN KEY (user_id)        REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id),
    FOREIGN KEY (channel_id)     REFERENCES notification_channels(id),
    FOREIGN KEY (status_id)      REFERENCES notification_statuses(id)
) ENGINE=InnoDB;

-- ============================================================
-- DATOS INICIALES DE CATÁLOGOS
-- ============================================================

INSERT INTO cities (nombre) VALUES
    ('Bogota'),('Medellin'),('Sabaneta'),
    ('Envigado'),('Itagui'),('Bello'),('Cali');

INSERT INTO blood_types (tipo) VALUES
    ('A+'),('A-'),('B+'),('B-'),
    ('AB+'),('AB-'),('O+'),('O-');

INSERT INTO donor_levels (nivel) VALUES ('BRONZE'),('SILVER'),('GOLD');

INSERT INTO roles (nombre) VALUES ('ADMIN'),('AGENT'),('USER');

INSERT INTO notification_channels (canal) VALUES
    ('EMAIL'),('SMS'),('WHATSAPP'),('PUSH');

INSERT INTO notification_statuses (estado) VALUES
    ('SENT'),('PENDING'),('FAILED');

INSERT INTO appointment_statuses (estado) VALUES
    ('SCHEDULED'),('RESCHEDULED'),('CANCELLED');

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================
