/**
 * Cliente HTTP del backend.
 *
 * Regla de oro: la tienda tiene que seguir funcionando aunque el backend esté
 * apagado. Por eso las llamadas de datos devuelven `null` (o el valor por
 * defecto) en vez de lanzar, y el contexto trata el backend como una caché
 * persistente, no como la fuente de la verdad durante la sesión.
 *
 * Las llamadas de `acceso` son la excepción: ahí sí se propaga el error, porque
 * la pantalla de entrada necesita distinguir "contraseña incorrecta" de
 * "servidor caído" y decir cuál de las dos ha pasado.
 *
 * Toda petición de datos viaja con la cabecera `X-Negocio`, que dice a qué
 * tienda va, y con el token de administrador si la sesión lo tiene.
 */
import { digits } from "./format";
import { leerSesion } from "./sesion";

const BASE = import.meta.env.VITE_API_URL || "/api";

let disponible = true;

/** ¿Se pudo hablar con el backend la última vez? Sirve para avisar en la interfaz. */
export const backendDisponible = () => disponible;

/** Cabeceras de la petición, tomadas de la sesión guardada. */
function cabeceras(extra) {
  const sesion = leerSesion();
  return {
    "Content-Type": "application/json",
    ...(sesion?.idNegocio ? { "X-Negocio": sesion.idNegocio } : {}),
    ...(sesion?.token ? { Authorization: `Bearer ${sesion.token}` } : {}),
    ...extra,
  };
}

/**
 * Petición que propaga el error con el mensaje que mandó el servidor.
 * Un 403 no significa que el backend esté caído, solo que no había permiso:
 * `disponible` mide conectividad, no autorización.
 */
async function pedir(ruta, opciones = {}) {
  const { headers, ...resto } = opciones;

  let res;
  try {
    res = await fetch(`${BASE}${ruta}`, { ...resto, headers: cabeceras(headers) });
  } catch {
    disponible = false;
    throw new Error("No se pudo conectar con el servidor.");
  }
  disponible = true;

  const texto = await res.text();
  let datos = null;
  try {
    datos = texto ? JSON.parse(texto) : null;
  } catch {
    datos = null;
  }

  if (!res.ok) throw new Error(datos?.error || `Error ${res.status}`);
  return datos;
}

/** Petición silenciosa: los fallos se registran y se devuelven como `null`. */
async function request(ruta, opciones = {}) {
  try {
    return await pedir(ruta, opciones);
  } catch (err) {
    console.warn(`[api] ${opciones.method || "GET"} ${ruta} falló:`, err.message);
    return null;
  }
}

const get = (ruta) => request(ruta);
const put = (ruta, body) => request(ruta, { method: "PUT", body: JSON.stringify(body) });
const post = (ruta, body) => request(ruta, { method: "POST", body: JSON.stringify(body) });

const postDuro = (ruta, body) =>
  pedir(ruta, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });

const putDuro = (ruta, body) => pedir(ruta, { method: "PUT", body: JSON.stringify(body) });

/** Ruta de la dirección de un teléfono concreto. */
const rutaDireccion = (telefono) => `/clientes/direcciones/${encodeURIComponent(digits(telefono))}`;

export const api = {
  /**
   * Entrada a una tienda. A diferencia del resto, estas llamadas lanzan si algo
   * va mal: quien las use tiene que enseñar el motivo por pantalla.
   */
  acceso: {
    /** Qué es lo escrito: `{tipo:"duenio"}`, `{tipo:"negocio",...}` o `{tipo:"desconocido"}`. */
    resolver: (valor) => postDuro("/acceso/resolver", { valor }),

    /** Teléfono + contraseña -> `{ token, idNegocio, nombreTienda }`. */
    admin: (telefono, password) => postDuro("/acceso/admin", { telefono, password }),

    /** Alta de tienda. Devuelve lo mismo que `admin`: entra directo. */
    registrar: (datos) => postDuro("/cuentas", datos),

    /**
     * Alta por código, en dos pasos. `solicitarCodigo` hace que n8n mande el
     * código al WhatsApp; `activar` lo canjea por la cuenta ya creada y su
     * sesión, igual que `admin`.
     */
    solicitarCodigo: (telefono) => postDuro("/cuentas/codigo", { telefono }),
    activar: ({ telefono, codigo }) => postDuro("/cuentas/activar", { telefono, codigo }),

    salir: () => postDuro("/acceso/salir"),
  },

  /**
   * Datos de la cuenta del dueño. Lanza igual que `acceso`: "Mi perfil" tiene que
   * poder decir que la contraseña actual no coincide.
   */
  cuenta: {
    actualizar: (datos) => putDuro("/cuentas/mi-cuenta", datos),
  },

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
    /** Mapa completo. Solo el administrador puede pedirlo. */
    obtener: () => get("/clientes/direcciones"),
    guardar: (direcciones) => put("/clientes/direcciones", { direcciones }),

    /** La de un solo teléfono: es lo que el comprador puede consultar y guardar. */
    obtenerDe: (telefono) => get(rutaDireccion(telefono)),
    guardarDe: (telefono, valor) => put(rutaDireccion(telefono), valor),
  },
};
