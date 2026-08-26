/**
 * Clientes.
 *
 * No hay una tabla de clientes: se derivan de los pedidos, igual que en el
 * frontend. Lo único que sí se guarda aparte es la última dirección de entrega
 * de cada teléfono, porque no se puede reconstruir a partir del histórico.
 *
 * Con los JSON, derivarlos obligaba a cargar todas las ventas en memoria y
 * agruparlas a mano; ahora esa cuenta la hace la base y solo viaja el resultado.
 */
import { direccionesRepository } from "../repositories/direcciones.repository.js";
import { pedidosRepository } from "../repositories/pedidos.repository.js";
import { AppError } from "../utils/AppError.js";
import { digits, esObjeto, exigirObjeto } from "../utils/validacion.js";

/** Coordenada válida o nada: media coordenada no sirve para abrir un mapa. */
function normalizarGps(gps) {
  if (!esObjeto(gps)) return null;
  const lat = Number(gps.lat);
  const lng = Number(gps.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

/** Forma con la que se guarda toda dirección, venga de donde venga. */
function normalizarDireccion(valor) {
  return {
    direccion: String(valor.direccion || "").trim(),
    gps: normalizarGps(valor.gps),
  };
}

/** El teléfono es la clave de la dirección: sin él no hay nada que buscar. */
function exigirTelefono(telefono) {
  const clave = digits(telefono);
  if (!clave) throw AppError.peticionInvalida("El teléfono no es válido.");
  return clave;
}

export const clientesService = {
  /** Un cliente por teléfono, con su total gastado y su último pedido. */
  listar: (idNegocio) => pedidosRepository.agruparPorCliente(idNegocio),

  obtenerDirecciones: (idNegocio) => direccionesRepository.listar(idNegocio),

  /** Guarda el mapa completo teléfono -> { direccion, gps }. */
  guardarDirecciones(idNegocio, entrada) {
    exigirObjeto(entrada, "direcciones");
    const limpio = {};
    for (const [telefono, valor] of Object.entries(entrada)) {
      const clave = digits(telefono);
      if (!clave || !esObjeto(valor)) continue;
      limpio[clave] = normalizarDireccion(valor);
    }
    return direccionesRepository.reemplazar(idNegocio, limpio);
  },

  /**
   * Dirección de un solo teléfono.
   *
   * Existe para el modo cliente: el comprador necesita recuperar la suya sin
   * poder descargar las direcciones de toda la clientela de la tienda.
   */
  obtenerDireccionDe(idNegocio, telefono) {
    return direccionesRepository.obtenerDe(idNegocio, exigirTelefono(telefono));
  },

  /** Guarda la dirección de un solo teléfono, sin tocar las demás. */
  guardarDireccionDe(idNegocio, telefono, valor) {
    const clave = exigirTelefono(telefono);
    return direccionesRepository.guardarDe(
      idNegocio,
      clave,
      normalizarDireccion(esObjeto(valor) ? valor : {})
    );
  },
};
