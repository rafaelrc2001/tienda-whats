-- =====================================================================
--  Borra todo el esquema de Pedidos Tienda.
--
--  Ojo: se lleva los datos por delante. Es para desarrollo, para volver a
--  empezar limpio antes de ejecutar `schema.sql`:
--
--      psql -d pedidos_tienda -f backend/db/reset.sql
--      psql -d pedidos_tienda -f backend/db/schema.sql
-- =====================================================================

BEGIN;

DROP TABLE IF EXISTS pedido_items CASCADE;
DROP TABLE IF EXISTS pedidos      CASCADE;
DROP TABLE IF EXISTS productos    CASCADE;
DROP TABLE IF EXISTS direcciones  CASCADE;
DROP TABLE IF EXISTS sesiones     CASCADE;
DROP TABLE IF EXISTS negocios     CASCADE;
DROP TABLE IF EXISTS cuentas      CASCADE;

COMMIT;
