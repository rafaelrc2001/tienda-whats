/**
 * Cliente HTTP del backend.
 *
 * Regla de oro: la tienda tiene que seguir funcionando aunque el backend esté
 * apagado. Por eso todas las llamadas devuelven `null` (o el valor por defecto)
 * en vez de lanzar, y el contexto trata el backend como una caché persistente,
 * no como la fuente de la verdad durante la sesión.
 */

const BASE = import.meta.env.VITE_API_URL || "/api";

let disponible = true;

/** ¿La última llamada al backend funcionó? Sirve para avisar en la interfaz. */
export const backendDisponible = () => disponible;

async function request(ruta, opciones = {}) {
  try {
    const res = await fetch(`${BASE}${ruta}`, {
      headers: { "Content-Type": "application/json" },
      ...opciones,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    disponible = true;
    return res.status === 204 ? null : await res.json();
  } catch (err) {
    disponible = false;
    console.warn(`[api] ${opciones.method || "GET"} ${ruta} falló:`, err.message);
    return null;
  }
}

const get = (ruta) => request(ruta);
const put = (ruta, body) => request(ruta, { method: "PUT", body: JSON.stringify(body) });
const post = (ruta, body) => request(ruta, { method: "POST", body: JSON.stringify(body) });

export const api = {
  /** Configuración del negocio: nombre, WhatsApp, ubicación, datos bancarios, horario, skin. */
  negocio: {
    obtener: () => get("/negocio"),
    guardar: (negocio) => put("/negocio", negocio),
  },

  /** Catálogo completo. Se guarda entero porque la pantalla lo edita como una tabla. */
  productos: {
    listar: () => get("/productos"),
    reemplazar: (productos) => put("/productos", { productos }),
  },

  /** Ventas confirmadas. Solo se agregan; alimentan clientes y finanzas. */
  pedidos: {
    listar: () => get("/pedidos"),
    crear: (pedido) => post("/pedidos", pedido),
  },

  /** Última dirección conocida de cada cliente, indexada por teléfono. */
  direcciones: {
    obtener: () => get("/clientes/direcciones"),
    guardar: (direcciones) => put("/clientes/direcciones", { direcciones }),
  },
};
