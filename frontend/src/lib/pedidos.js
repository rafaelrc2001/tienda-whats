/** Armado del pedido: texto para WhatsApp, etiquetas y cálculo de utilidad. */
import { digits, money } from "./format";
import { enlaceMapa } from "./geolocalizacion";

export const ETIQUETA_PAGO = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  tarjeta: "Tarjeta contra entrega",
};

/** Utilidad real del pedido: (venta - costo) por unidad, más el recargo cobrado. */
export function utilidadDeItems(items, recargoMonto = 0) {
  return items.reduce((s, i) => s + (i.precioVenta - i.precioCosto) * i.cantidad, 0) + recargoMonto;
}

/** Texto de la forma de entrega tal como se le muestra al negocio. */
export function textoEntrega(entrega, direccion) {
  return entrega === "recoger" ? "Recoger en tienda" : `Entrega a domicilio — ${direccion.trim()}`;
}

/**
 * Mensaje de WhatsApp con el pedido completo, en el formato que el negocio ya conoce.
 * Las líneas nulas se descartan, así que los datos opcionales simplemente no aparecen.
 */
export function armarMensajePedido({
  nombre,
  telefono,
  items,
  entregaTexto,
  pagoTexto,
  comentarios,
  gps = null,
  recargoPorcentaje = 0,
  recargoMonto = 0,
  total,
}) {
  const lineas = items.map(
    (i) => `• ${i.cantidad} ${i.unidad} — ${i.producto} (${money(i.precioVenta)} c/u) = ${money(i.precioVenta * i.cantidad)}`
  );

  return [
    `¡Hola! Soy *${nombre}* 👋`,
    `*Mi teléfono:* ${telefono}`,
    ``,
    `Quiero hacer el siguiente pedido:`,
    ...lineas,
    recargoMonto ? `Recargo por atención fuera de horario (+${recargoPorcentaje}%): ${money(recargoMonto)}` : null,
    ``,
    `*Total: ${money(total)}*`,
    ``,
    `*Entrega:* ${entregaTexto}`,
    gps ? `Ubicación: ${enlaceMapa(gps)}` : null,
    `*Forma de pago:* ${pagoTexto}`,
    comentarios.trim() ? `*Comentarios:* ${comentarios.trim()}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

/** URL de wa.me con el mensaje ya codificado. Devuelve null si falta el número. */
export function enlaceWhatsapp(telefonoNegocio, mensaje) {
  const numero = digits(telefonoNegocio);
  if (!numero || !mensaje) return null;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}
