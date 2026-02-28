-- ============================================================
-- PROYECTO: BUSINESS INTELLIGENCE - CONSULTAS ANALÍTICAS
-- ============================================================
-- Descripción:
-- Este archivo contiene las soluciones a los siguientes casos:
--
-- 1) Empresas con mayor facturación total y cantidad de contratos.
-- 2) Historial completo de contratos de un cliente específico.
-- 3) Servicios más contratados por categoría, ordenados por ingresos.
--
-- Todas las soluciones usan JOINs, funciones agregadas y GROUP BY.
-- ============================================================



-- ============================================================
-- 1 ANÁLISIS DE EMPRESAS
-- ============================================================
-- Requerimiento:
-- "Necesito saber qué empresas han generado mayor facturación total
--  y cuántos contratos tienen asociados."
--
-- Solución:
-- Se crea una vista que consolida contratos, transacciones
-- y servicios vendidos por empresa.
-- ============================================================

CREATE OR REPLACE VIEW vw_company_revenue AS

SELECT
    co.id AS company_id,                  -- ID de la empresa
    co.name AS company_name,              -- Nombre de la empresa
    co.tax_id,                            -- Identificación tributaria

    -- Total de contratos únicos asociados a la empresa
    COUNT(DISTINCT c.id) AS total_contracts,

    -- Total de transacciones únicas
    COUNT(DISTINCT t.id) AS total_transactions,

    -- Facturación total (cantidad * precio unitario)
    -- COALESCE reemplaza NULL por 0 si no hay ventas
    COALESCE(SUM(ts.quantity * ts.unit_price), 0) AS total_revenue

FROM companies co

-- Relaciona contratos con empresa
LEFT JOIN contracts c
       ON c.company_id = co.id

-- Relaciona transacciones con contratos
LEFT JOIN transactions t
       ON t.contract_id = c.id

-- Relaciona servicios vendidos con transacciones
LEFT JOIN transaction_services ts
       ON ts.transaction_id = t.id

-- Agrupa por empresa (necesario por SUM y COUNT)
GROUP BY co.id, co.name, co.tax_id

-- Ordena de mayor a menor facturación
ORDER BY total_revenue DESC;



-- ============================================================
-- 2 HISTORIAL COMPLETO DE CLIENTE
-- ============================================================
-- Requerimiento:
-- "Quiero ver el historial de contratos de un cliente específico,
--  detallando servicios y fecha de transacción."
--
-- Solución:
-- Vista que muestra todo el flujo:
-- Cliente → Contrato → Empresa → Transacción → Servicios
-- ============================================================

CREATE OR REPLACE VIEW vw_client_contract_history AS

SELECT
    cl.id AS client_id,                   -- ID del cliente
    cl.name AS client_name,               -- Nombre del cliente
    c.id AS contract_id,                  -- ID del contrato
    co.name AS company_name,              -- Empresa asociada
    t.id AS transaction_id,               -- ID de transacción
    t.transaction_date,                   -- Fecha de transacción
    t.invoice_number,                     -- Número de factura

    s.name AS service_name,               -- Servicio contratado
    s.category AS service_category,       -- Categoría del servicio

    ts.quantity,                          -- Cantidad vendida
    ts.unit_price,                        -- Precio unitario

    -- Total por línea (cálculo financiero)
    (ts.quantity * ts.unit_price) AS line_total

FROM clients cl

-- Se usa JOIN (INNER) porque solo queremos clientes con historial real
JOIN contracts c
     ON c.client_id = cl.id

JOIN companies co
     ON co.id = c.company_id

JOIN transactions t
     ON t.contract_id = c.id

JOIN transaction_services ts
     ON ts.transaction_id = t.id

JOIN services s
     ON s.id = ts.service_id

-- Ordenamos por cliente y fecha descendente
ORDER BY cl.id, t.transaction_date DESC;



-- Ejemplo de uso:
-- SELECT * FROM vw_client_contract_history
-- WHERE client_id = 10;



-- ============================================================
-- 3 SERVICIOS MÁS CONTRATADOS POR CATEGORÍA
-- ============================================================
-- Requerimiento:
-- "Genera un listado de los servicios más contratados
--  dentro de una categoría específica,
--  ordenados por ingresos generados."
--
-- Solución:
-- Vista que calcula:
-- - Veces contratado
-- - Total de unidades vendidas
-- - Total de ingresos generados
-- ============================================================

CREATE OR REPLACE VIEW vw_services_by_category_revenue AS

SELECT
    s.id AS service_id,                   -- ID del servicio
    s.name AS service_name,               -- Nombre del servicio
    s.category,                           -- Categoría del servicio

    -- Cuántas veces fue contratado
    COUNT(ts.id) AS times_contracted,

    -- Total de unidades vendidas
    SUM(ts.quantity) AS total_units_sold,

    -- Ingresos totales
    SUM(ts.quantity * ts.unit_price) AS total_revenue

FROM services s

-- LEFT JOIN permite mostrar servicios aunque no tengan ventas
LEFT JOIN transaction_services ts
       ON ts.service_id = s.id

-- Agrupamos por servicio
GROUP BY s.id, s.name, s.category

-- Ordenamos por categoría y luego por ingresos
ORDER BY s.category, total_revenue DESC;



-- Para consultar una categoría específica:
-- SELECT *
-- FROM vw_services_by_category_revenue
-- WHERE category = 'Consultoría'
-- ORDER BY total_revenue DESC;



-- ============================================================
-- 3 CONCLUSIÓN TÉCNICA
-- ============================================================
-- Estas soluciones demuestran:
--
-- ✔ Uso correcto de JOIN múltiples
-- ✔ Diferencia entre LEFT JOIN e INNER JOIN
-- ✔ Uso de funciones agregadas (SUM, COUNT)
-- ✔ Uso correcto de GROUP BY
-- ✔ Cálculo de métricas financieras
-- ✔ Diseño de vistas para análisis BI
--
-- Nivel: Intermedio - Avanzado
-- ============================================================