/**
 * Pasa a PostgreSQL los datos que quedaron en los archivos JSON.
 *
 * Solo hace falta una vez, y solo si la carpeta `data/` tiene tiendas dentro.
 * En una instalación nueva no hay nada que importar y el script lo dice y sale.
 *
 *     node scripts/importar-json.js            # lee backend/data
 *     node scripts/importar-json.js ../copia   # o la carpeta que se le diga
 *
 * Es reentrante: se puede ejecutar dos veces sin duplicar nada. Lo que ya
 * existe en la base se respeta —no se pisa con lo del archivo—, así que si algo
 * salió mal a mitad, basta con volver a lanzarlo.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { cerrarPool, enTransaccion } from "../src/db/pool.js";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CARPETA = path.resolve(RAIZ, process.argv[2] || "data");

const DIAS = ["lun", "mar", "mie", "jue", "vie", "sab", "dom"];

/** Lee un JSON; si no existe o está roto, devuelve el valor por defecto. */
async function leerJson(archivo, porDefecto) {
  try {
    return JSON.parse(await fs.readFile(archivo, "utf8"));
  } catch (err) {
    if (err.code !== "ENOENT") {
      console.warn(`  ! ${path.basename(archivo)} ilegible (${err.message}), se ignora`);
    }
    return porDefecto;
  }
}

const numero = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const texto = (v) => String(v ?? "").trim();
const digitos = (v) => String(v ?? "").replace(/\D/g, "");

/** Coordenada completa o nada. */
function gpsDe(valor) {
  const lat = Number(valor?.lat);
  const lng = Number(valor?.lng);
  return Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : [null, null];
}

async function importarNegocio(cliente, idNegocio, carpeta) {
  const n = await leerJson(path.join(carpeta, "negocio.json"), null);
  if (!n) return;

  const [lat, lng] = gpsDe(n.ubicacion);
  const horario = n.horario || {};
  const dias = horario.dias || {};

  await cliente.query(
    `UPDATE negocios SET
        nombre = $2, telefono = $3, ubicacion_lat = $4, ubicacion_lng = $5,
        banco_nombre = $6, banco_beneficiario = $7, banco_numero_cuenta = $8,
        skin_id = $9,
        horario_lun = $10, horario_mar = $11, horario_mie = $12, horario_jue = $13,
        horario_vie = $14, horario_sab = $15, horario_dom = $16,
        horario_apertura = $17, horario_cierre = $18,
        horario_atender_fuera = $19, horario_recargo = $20
      WHERE id_negocio = $1`,
    [
      idNegocio,
      texto(n.nombre),
      texto(n.telefono),
      lat,
      lng,
      texto(n.banco?.nombre),
      texto(n.banco?.beneficiario),
      texto(n.banco?.numeroCuenta),
      texto(n.skinId) || "mercado",
      ...DIAS.map((d) => Boolean(dias[d])),
      texto(horario.apertura) || "08:00",
      texto(horario.cierre) || "18:00",
      Boolean(horario.atenderFuera),
      numero(horario.recargo),
    ]
  );
}

async function importarProductos(cliente, idNegocio, carpeta) {
  const productos = await leerJson(path.join(carpeta, "productos.json"), []);
  if (!Array.isArray(productos) || !productos.length) return 0;

  const usados = new Set();
  let insertados = 0;

  for (const [i, p] of productos.entries()) {
    let id = texto(p?.id) || `p_import_${i}`;
    while (usados.has(id)) id = `${id}_${i}`;
    usados.add(id);

    const { rowCount } = await cliente.query(
      `INSERT INTO productos
         (id_negocio, id_producto, posicion, categoria, producto, marca, unidad,
          precio_venta, precio_costo, proveedor, imagen)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (id_negocio, id_producto) DO NOTHING`,
      [
        idNegocio,
        id,
        i,
        texto(p?.categoria) || "Otros",
        texto(p?.producto),
        texto(p?.marca),
        texto(p?.unidad) || "unidad",
        numero(p?.precioVenta),
        numero(p?.precioCosto),
        texto(p?.proveedor),
        texto(p?.imagen),
      ]
    );
    insertados += rowCount;
  }
  return insertados;
}

async function importarPedidos(cliente, idNegocio, carpeta) {
  const pedidos = await leerJson(path.join(carpeta, "pedidos.json"), []);
  if (!Array.isArray(pedidos)) return 0;

  let insertados = 0;

  for (const p of pedidos) {
    const fechaISO = Number.isNaN(Date.parse(p?.fechaISO)) ? new Date().toISOString() : p.fechaISO;

    const { rows } = await cliente.query(
      `INSERT INTO pedidos
         (id_negocio, id_pedido, nombre, telefono, total, utilidad, fecha, fecha_iso)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id_negocio, id_pedido) DO NOTHING
       RETURNING id`,
      [
        idNegocio,
        String(p?.id ?? Date.now()),
        texto(p?.nombre),
        texto(p?.telefono),
        numero(p?.total),
        numero(p?.utilidad),
        texto(p?.fecha) || new Date(fechaISO).toLocaleString("es-CO"),
        fechaISO,
      ]
    );

    // Sin fila devuelta, ese pedido ya estaba importado: sus renglones también.
    if (!rows[0]) continue;
    insertados += 1;

    for (const [i, item] of (Array.isArray(p?.items) ? p.items : []).entries()) {
      await cliente.query(
        `INSERT INTO pedido_items
           (pedido_id, posicion, id_producto, producto, categoria, unidad,
            cantidad, precio_venta, precio_costo)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          rows[0].id,
          i,
          texto(item?.id),
          texto(item?.producto),
          texto(item?.categoria),
          texto(item?.unidad) || "unidad",
          numero(item?.cantidad),
          numero(item?.precioVenta),
          numero(item?.precioCosto),
        ]
      );
    }
  }
  return insertados;
}

async function importarDirecciones(cliente, idNegocio, carpeta) {
  const mapa = await leerJson(path.join(carpeta, "direcciones.json"), {});
  let insertadas = 0;

  for (const [telefono, valor] of Object.entries(mapa || {})) {
    const clave = digitos(telefono);
    if (!clave) continue;
    const [lat, lng] = gpsDe(valor?.gps);

    const { rowCount } = await cliente.query(
      `INSERT INTO direcciones (id_negocio, telefono, direccion, gps_lat, gps_lng)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id_negocio, telefono) DO NOTHING`,
      [idNegocio, clave, texto(valor?.direccion), lat, lng]
    );
    insertadas += rowCount;
  }
  return insertadas;
}

async function importarTienda(cuenta) {
  const idNegocio = texto(cuenta?.idNegocio);
  const telefono = digitos(cuenta?.telefono);

  if (!idNegocio || !telefono || !cuenta?.passwordHash) {
    console.warn(`  ! cuenta incompleta, se salta: ${JSON.stringify(cuenta?.idNegocio)}`);
    return;
  }

  const carpeta = path.join(CARPETA, "tiendas", idNegocio);

  await enTransaccion(async (cliente) => {
    const { rowCount } = await cliente.query(
      `INSERT INTO cuentas
         (id_negocio, telefono, password_hash, nombre_tienda, estatus, creada_en)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6::timestamptz, now()))
       ON CONFLICT (id_negocio) DO NOTHING`,
      [
        idNegocio,
        telefono,
        cuenta.passwordHash,
        texto(cuenta.nombreTienda) || idNegocio,
        cuenta.estatus === "suspendido" ? "suspendido" : "activo",
        cuenta.creadaISO || null,
      ]
    );

    if (rowCount) {
      await cliente.query("INSERT INTO negocios (id_negocio) VALUES ($1)", [idNegocio]);
    }

    await importarNegocio(cliente, idNegocio, carpeta);
    const productos = await importarProductos(cliente, idNegocio, carpeta);
    const pedidos = await importarPedidos(cliente, idNegocio, carpeta);
    const direcciones = await importarDirecciones(cliente, idNegocio, carpeta);

    console.log(
      `  · ${idNegocio}: ${productos} productos, ${pedidos} pedidos, ${direcciones} direcciones` +
        (rowCount ? "" : " (la cuenta ya estaba)")
    );
  });
}

async function importarSesiones() {
  const sesiones = await leerJson(path.join(CARPETA, "sesiones.json"), {});
  const abiertas = Object.entries(sesiones || {});
  if (!abiertas.length) return;

  // Las sesiones cuya tienda no llegó a importarse se descartan solas: la
  // clave foránea las rechaza, y un token sin tienda no serviría de nada.
  let importadas = 0;
  for (const [token, sesion] of abiertas) {
    try {
      const { rowCount } = await enTransaccion((cliente) =>
        cliente.query(
          `INSERT INTO sesiones (token, id_negocio, creada_en)
           VALUES ($1, $2, COALESCE($3::timestamptz, now()))
           ON CONFLICT (token) DO NOTHING`,
          [token, sesion?.idNegocio, sesion?.creadaISO || null]
        )
      );
      importadas += rowCount;
    } catch {
      /* tienda inexistente: se ignora esa sesión */
    }
  }
  console.log(`  · ${importadas} sesiones abiertas conservadas`);
}

async function main() {
  console.log(`Importando desde ${CARPETA}`);

  const cuentas = await leerJson(path.join(CARPETA, "cuentas.json"), []);
  if (!Array.isArray(cuentas) || !cuentas.length) {
    console.log("No hay cuentas que importar: nada que hacer.");
    return;
  }

  for (const cuenta of cuentas) {
    await importarTienda(cuenta);
  }
  await importarSesiones();

  console.log(`Listo: ${cuentas.length} tiendas revisadas.`);
}

main()
  .catch((err) => {
    console.error("La importación falló:", err.message);
    process.exitCode = 1;
  })
  .finally(() => cerrarPool());
