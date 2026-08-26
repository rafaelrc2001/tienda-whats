/**
 * Catálogo de productos.
 *
 * El catálogo puede venir de un Excel o de la edición manual, así que aquí se
 * normaliza cada fila: los precios siempre numéricos, los textos siempre string
 * y un id garantizado para que el frontend pueda usarlo como clave de React.
 */
import { productosRepository } from "../repositories/productos.repository.js";
import { AppError } from "../utils/AppError.js";
import { exigirArreglo, numeroOCero } from "../utils/validacion.js";

const texto = (v) => String(v ?? "").trim();

let contador = 0;
const nuevoId = () => `p_${Date.now()}_${(contador++).toString(36)}`;

/**
 * Deja una fila del catálogo con la forma que espera la base.
 *
 * `usados` acumula los ids ya vistos en este mismo envío: el id es único por
 * tienda, así que un Excel pegado dos veces o una fila duplicada a mano no
 * pueden colarse con el id repetido. Al que choca se le da uno nuevo.
 */
function normalizarProducto(p, usados) {
  if (typeof p !== "object" || p === null) {
    throw AppError.peticionInvalida("Cada producto debe ser un objeto.");
  }

  let id = texto(p.id) || nuevoId();
  while (usados.has(id)) id = nuevoId();
  usados.add(id);

  return {
    id,
    categoria: texto(p.categoria) || "Otros",
    producto: texto(p.producto),
    marca: texto(p.marca),
    unidad: texto(p.unidad) || "unidad",
    precioVenta: numeroOCero(p.precioVenta),
    precioCosto: numeroOCero(p.precioCosto),
    proveedor: texto(p.proveedor),
    imagen: texto(p.imagen),
  };
}

export const productosService = {
  listar: (idNegocio) => productosRepository.listar(idNegocio),

  /** Reemplaza el catálogo completo (es como lo edita la pantalla de Productos). */
  reemplazar(idNegocio, entrada) {
    const lista = exigirArreglo(entrada, "productos");
    const usados = new Set();
    return productosRepository.reemplazar(
      idNegocio,
      lista.map((p) => normalizarProducto(p, usados))
    );
  },
};
