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

function normalizarProducto(p) {
  if (typeof p !== "object" || p === null) {
    throw AppError.peticionInvalida("Cada producto debe ser un objeto.");
  }
  return {
    id: texto(p.id) || nuevoId(),
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
  listar: () => productosRepository.leer(),

  /** Reemplaza el catálogo completo (es como lo edita la pantalla de Productos). */
  reemplazar(entrada) {
    const lista = exigirArreglo(entrada, "productos");
    return productosRepository.escribir(lista.map(normalizarProducto));
  },
};
