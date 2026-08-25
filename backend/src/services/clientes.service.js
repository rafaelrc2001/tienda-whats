/**
 * Clientes.
 *
 * No hay una tabla de clientes: se derivan de los pedidos, igual que en el
 * frontend. Lo único que sí se guarda aparte es la última dirección de entrega
 * de cada teléfono, porque no se puede reconstruir a partir del histórico.
 */
import { direccionesRepository } from "../repositories/direcciones.repository.js";
import { pedidosRepository } from "../repositories/pedidos.repository.js";
import { digits, esObjeto, exigirObjeto } from "../utils/validacion.js";

export const clientesService = {
  /** Un cliente por teléfono, con su total gastado y su último pedido. */
  async listar() {
    const pedidos = await pedidosRepository.leer();
    const map = new Map();

    for (const p of pedidos) {
      const clave = digits(p.telefono);
      const prev = map.get(clave) || {
        telefono: p.telefono,
        nombre: p.nombre,
        pedidos: 0,
        total: 0,
        ultimaFecha: p.fecha,
        ultimaFechaISO: p.fechaISO,
      };
      prev.nombre = p.nombre;
      prev.pedidos += 1;
      prev.total += p.total;
      if (new Date(p.fechaISO) >= new Date(prev.ultimaFechaISO)) {
        prev.ultimaFecha = p.fecha;
        prev.ultimaFechaISO = p.fechaISO;
      }
      map.set(clave, prev);
    }

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.ultimaFechaISO) - new Date(a.ultimaFechaISO)
    );
  },

  obtenerDirecciones: () => direccionesRepository.leer(),

  /** Guarda el mapa completo teléfono -> { direccion, gps }. */
  guardarDirecciones(entrada) {
    exigirObjeto(entrada, "direcciones");
    const limpio = {};
    for (const [telefono, valor] of Object.entries(entrada)) {
      const clave = digits(telefono);
      if (!clave || !esObjeto(valor)) continue;
      limpio[clave] = {
        direccion: String(valor.direccion || "").trim(),
        gps: esObjeto(valor.gps) ? { lat: Number(valor.gps.lat), lng: Number(valor.gps.lng) } : null,
      };
    }
    return direccionesRepository.escribir(limpio);
  },
};
