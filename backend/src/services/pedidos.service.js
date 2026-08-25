/**
 * Pedidos confirmados.
 *
 * Un pedido es inmutable: se registra cuando el cliente lo envía por WhatsApp y
 * a partir de ahí alimenta la base de clientes y las finanzas. Por eso solo hay
 * listar y crear.
 */
import { pedidosRepository } from "../repositories/pedidos.repository.js";
import { AppError } from "../utils/AppError.js";
import { exigirTexto, numeroOCero } from "../utils/validacion.js";

function normalizarItem(i) {
  return {
    id: String(i?.id ?? ""),
    producto: String(i?.producto ?? ""),
    categoria: String(i?.categoria ?? ""),
    unidad: String(i?.unidad ?? "unidad"),
    cantidad: numeroOCero(i?.cantidad),
    precioVenta: numeroOCero(i?.precioVenta),
    precioCosto: numeroOCero(i?.precioCosto),
  };
}

function normalizarPedido(entrada) {
  if (typeof entrada !== "object" || entrada === null) {
    throw AppError.peticionInvalida("El pedido debe ser un objeto.");
  }
  const nombre = exigirTexto(entrada.nombre, "nombre");
  const telefono = exigirTexto(entrada.telefono, "telefono");
  if (!Array.isArray(entrada.items) || entrada.items.length === 0) {
    throw AppError.peticionInvalida("El pedido no tiene productos.");
  }

  const fechaISO = entrada.fechaISO && !Number.isNaN(Date.parse(entrada.fechaISO))
    ? entrada.fechaISO
    : new Date().toISOString();

  return {
    id: entrada.id ?? Date.now(),
    nombre,
    telefono,
    total: numeroOCero(entrada.total),
    utilidad: numeroOCero(entrada.utilidad),
    fecha: String(entrada.fecha || new Date(fechaISO).toLocaleString("es-CO")),
    fechaISO,
    items: entrada.items.map(normalizarItem),
  };
}

export const pedidosService = {
  listar: () => pedidosRepository.leer(),

  /**
   * Registra una venta. Ignora en silencio un id repetido: el frontend puede
   * reintentar el envío si se cerró la pestaña de WhatsApp, y esa segunda
   * llamada no debe duplicar la venta.
   */
  async crear(entrada) {
    const pedido = normalizarPedido(entrada);
    let guardado = pedido;
    await pedidosRepository.actualizar((lista) => {
      const existente = lista.find((p) => String(p.id) === String(pedido.id));
      if (existente) {
        guardado = existente;
        return lista;
      }
      return [...lista, pedido];
    });
    return guardado;
  },
};
