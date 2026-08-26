-- =====================================================================
--  Pedidos Tienda · esquema de PostgreSQL
-- ---------------------------------------------------------------------
--  Sustituye a los archivos JSON de `backend/data/`.
--
--  Uso:
--      createdb pedidos_tienda
--      psql -d pedidos_tienda -f backend/db/schema.sql
--
--  Es idempotente: se puede volver a ejecutar sin borrar nada.
--  Para empezar de cero, ejecutar antes `backend/db/reset.sql`.
--
--  Dos ideas que vienen del diseño anterior y se conservan:
--
--  - El `id_negocio` (un número: "482913") sigue siendo la llave
--    pública de la tienda. Antes era el nombre de una carpeta; aquí es la
--    clave foránea que aísla los datos de un negocio de los de otro.
--  - Cuenta y negocio son dos cosas distintas: la cuenta guarda el acceso
--    (teléfono y contraseña) y el negocio guarda la configuración que ve
--    el cliente. Nacen juntos, pero se editan desde pantallas distintas.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- Cuentas de los dueños
-- ---------------------------------------------------------------------
-- El teléfono de WhatsApp hace de nombre de usuario, por eso es UNIQUE.
-- Se guarda con solo dígitos: la normalización la hace `digits()` en la API.
CREATE TABLE IF NOT EXISTS cuentas (
    id_negocio    text        PRIMARY KEY,
    telefono      text        NOT NULL UNIQUE,
    password_hash text        NOT NULL,
    nombre_tienda text        NOT NULL,
    estatus       text        NOT NULL DEFAULT 'activo',
    creada_en     timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT cuentas_id_negocio_slug    CHECK (id_negocio ~ '^[a-z0-9-]+$'),
    CONSTRAINT cuentas_telefono_digitos   CHECK (telefono ~ '^[0-9]+$'),
    CONSTRAINT cuentas_estatus_valido     CHECK (estatus IN ('activo', 'suspendido'))
);

COMMENT ON TABLE  cuentas IS 'Dueños de tienda. Una cuenta = una tienda.';
COMMENT ON COLUMN cuentas.id_negocio IS 'Número público de la tienda; es lo que el cliente escribe para entrar. Las tiendas anteriores a este cambio conservan un slug.';

-- ---------------------------------------------------------------------
-- Configuración del negocio
-- ---------------------------------------------------------------------
-- Uno a uno con la cuenta (comparten clave primaria). El horario se guarda
-- desplegado en columnas en vez de como JSON: son siete banderas fijas y así
-- se pueden consultar ("qué tiendas abren el domingo") sin abrir un jsonb.
CREATE TABLE IF NOT EXISTS negocios (
    id_negocio            text    PRIMARY KEY
                                  REFERENCES cuentas (id_negocio)
                                  ON UPDATE CASCADE ON DELETE CASCADE,
    nombre                text    NOT NULL DEFAULT '',
    telefono              text    NOT NULL DEFAULT '',

    -- Ubicación del local. Las dos columnas van juntas o van las dos nulas.
    ubicacion_lat         double precision,
    ubicacion_lng         double precision,

    -- Datos de transferencia que se muestran al cerrar el pedido.
    banco_nombre          text    NOT NULL DEFAULT '',
    banco_beneficiario    text    NOT NULL DEFAULT '',
    banco_numero_cuenta   text    NOT NULL DEFAULT '',

    skin_id               text    NOT NULL DEFAULT 'mercado',

    -- Horario de atención.
    horario_lun           boolean NOT NULL DEFAULT true,
    horario_mar           boolean NOT NULL DEFAULT true,
    horario_mie           boolean NOT NULL DEFAULT true,
    horario_jue           boolean NOT NULL DEFAULT true,
    horario_vie           boolean NOT NULL DEFAULT true,
    horario_sab           boolean NOT NULL DEFAULT true,
    horario_dom           boolean NOT NULL DEFAULT false,
    horario_apertura      text    NOT NULL DEFAULT '08:00',
    horario_cierre        text    NOT NULL DEFAULT '18:00',
    horario_atender_fuera boolean NOT NULL DEFAULT false,
    horario_recargo       numeric(12, 2) NOT NULL DEFAULT 20,

    actualizado_en        timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT negocios_ubicacion_completa
        CHECK ((ubicacion_lat IS NULL) = (ubicacion_lng IS NULL))
);

COMMENT ON TABLE negocios IS 'Configuración que el cliente ve: nombre, horario, banco y skin.';

-- ---------------------------------------------------------------------
-- Sesiones de administrador
-- ---------------------------------------------------------------------
-- Una fila por token emitido. Al borrar la tienda se van con ella.
CREATE TABLE IF NOT EXISTS sesiones (
    token      text        PRIMARY KEY,
    id_negocio text        NOT NULL
                           REFERENCES cuentas (id_negocio)
                           ON UPDATE CASCADE ON DELETE CASCADE,
    creada_en  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sesiones_id_negocio_idx ON sesiones (id_negocio);
CREATE INDEX IF NOT EXISTS sesiones_creada_en_idx  ON sesiones (creada_en);

-- ---------------------------------------------------------------------
-- Catálogo de productos
-- ---------------------------------------------------------------------
-- `id_producto` es el id que genera la API ("p_1737...") y que viaja al
-- frontend como clave de React; no se toca. La clave primaria es la sustituta,
-- para que el mismo id pueda existir en dos tiendas sin chocar.
--
-- `posicion` conserva el orden del catálogo: la pantalla de Productos lo edita
-- como una tabla, y ese orden es el que acaba viendo el cliente.
CREATE TABLE IF NOT EXISTS productos (
    id           bigserial PRIMARY KEY,
    id_negocio   text      NOT NULL
                           REFERENCES cuentas (id_negocio)
                           ON UPDATE CASCADE ON DELETE CASCADE,
    id_producto  text      NOT NULL,
    posicion     integer   NOT NULL DEFAULT 0,
    categoria    text      NOT NULL DEFAULT 'Otros',
    producto     text      NOT NULL DEFAULT '',
    marca        text      NOT NULL DEFAULT '',
    unidad       text      NOT NULL DEFAULT 'unidad',
    precio_venta numeric(14, 2) NOT NULL DEFAULT 0,
    precio_costo numeric(14, 2) NOT NULL DEFAULT 0,
    proveedor    text      NOT NULL DEFAULT '',
    -- Las fotos viajan como data URI dentro del propio catálogo.
    imagen       text      NOT NULL DEFAULT '',

    CONSTRAINT productos_id_unico_por_tienda UNIQUE (id_negocio, id_producto)
);

CREATE INDEX IF NOT EXISTS productos_orden_idx ON productos (id_negocio, posicion, id);

-- ---------------------------------------------------------------------
-- Pedidos confirmados
-- ---------------------------------------------------------------------
-- Un pedido es inmutable: se inserta cuando el cliente lo manda por WhatsApp y
-- ya no se edita. `id_pedido` es el que trae el frontend (un `Date.now()`), y
-- es lo que permite que un reenvío no duplique la venta.
--
-- `total` y `utilidad` se guardan calculados a propósito: son el precio al que
-- se vendió ese día, y no deben moverse si mañana cambia el precio del producto.
CREATE TABLE IF NOT EXISTS pedidos (
    id         bigserial   PRIMARY KEY,
    id_negocio text        NOT NULL
                           REFERENCES cuentas (id_negocio)
                           ON UPDATE CASCADE ON DELETE CASCADE,
    id_pedido  text        NOT NULL,
    nombre     text        NOT NULL,
    telefono   text        NOT NULL,
    total      numeric(14, 2) NOT NULL DEFAULT 0,
    utilidad   numeric(14, 2) NOT NULL DEFAULT 0,
    -- Fecha ya formateada para mostrar ("25/8/2025, 3:04:11 p. m.").
    fecha      text        NOT NULL,
    fecha_iso  timestamptz NOT NULL,

    CONSTRAINT pedidos_id_unico_por_tienda UNIQUE (id_negocio, id_pedido)
);

CREATE INDEX IF NOT EXISTS pedidos_fecha_idx    ON pedidos (id_negocio, fecha_iso);
CREATE INDEX IF NOT EXISTS pedidos_telefono_idx ON pedidos (id_negocio, telefono);

-- Renglones del pedido. Copian nombre y precios del producto en el momento de
-- la venta, por lo mismo que arriba: son un recibo, no una vista del catálogo.
CREATE TABLE IF NOT EXISTS pedido_items (
    id           bigserial PRIMARY KEY,
    pedido_id    bigint    NOT NULL REFERENCES pedidos (id) ON DELETE CASCADE,
    posicion     integer   NOT NULL DEFAULT 0,
    id_producto  text      NOT NULL DEFAULT '',
    producto     text      NOT NULL DEFAULT '',
    categoria    text      NOT NULL DEFAULT '',
    unidad       text      NOT NULL DEFAULT 'unidad',
    cantidad     numeric(14, 3) NOT NULL DEFAULT 0,
    precio_venta numeric(14, 2) NOT NULL DEFAULT 0,
    precio_costo numeric(14, 2) NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS pedido_items_pedido_idx ON pedido_items (pedido_id, posicion, id);

-- ---------------------------------------------------------------------
-- Direcciones de entrega
-- ---------------------------------------------------------------------
-- Última dirección conocida de cada teléfono. No se puede reconstruir a partir
-- del histórico de pedidos, y por eso es lo único de clientes que sí se guarda.
CREATE TABLE IF NOT EXISTS direcciones (
    id_negocio     text NOT NULL
                        REFERENCES cuentas (id_negocio)
                        ON UPDATE CASCADE ON DELETE CASCADE,
    telefono       text NOT NULL,
    direccion      text NOT NULL DEFAULT '',
    gps_lat        double precision,
    gps_lng        double precision,
    actualizada_en timestamptz NOT NULL DEFAULT now(),

    PRIMARY KEY (id_negocio, telefono),
    CONSTRAINT direcciones_telefono_digitos CHECK (telefono ~ '^[0-9]+$'),
    CONSTRAINT direcciones_gps_completo     CHECK ((gps_lat IS NULL) = (gps_lng IS NULL))
);

COMMIT;
