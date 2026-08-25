/** Reglas de dominio de los productos: icono, paleta y creación de filas vacías. */
import { normalize } from "./format";
import { Apple, Beef, Candy, CupSoda, Milk, Package, SprayCan, Wheat } from "../icons";

/** Icono representativo de una categoría, adivinado por su nombre. */
export function iconForCategoria(cat) {
  const c = normalize(cat);
  if (/(fruta|verdura|vegetal)/.test(c)) return Apple;
  if (/(bebida|jugo|gaseosa|soda|licor)/.test(c)) return CupSoda;
  if (/(lacte|leche|queso|yogur)/.test(c)) return Milk;
  if (/(pan|panaderia|repost)/.test(c)) return Wheat;
  if (/(carne|pollo|res|cerdo|pescad)/.test(c)) return Beef;
  if (/(limpieza|aseo|hogar)/.test(c)) return SprayCan;
  if (/(dulce|snack|golosin|confit)/.test(c)) return Candy;
  return Package;
}

const PALETAS_CATEGORIA = [
  { bg: "#EAF2E7", ink: "#2F6B4F" },
  { bg: "#FCEFD9", ink: "#B5732B" },
  { bg: "#F1E7F5", ink: "#7A4E8C" },
  { bg: "#E4EEF6", ink: "#2E6488" },
  { bg: "#FCE6E2", ink: "#B14A3A" },
  { bg: "#EEF0DA", ink: "#5E6B2E" },
];

/**
 * Color estable para una categoría: el mismo nombre siempre devuelve el mismo par
 * de colores, sin necesidad de guardarlo en ningún lado.
 */
export function paletteForCategoria(cat) {
  let hash = 0;
  const c = normalize(cat);
  for (let i = 0; i < c.length; i++) hash = (hash * 31 + c.charCodeAt(i)) >>> 0;
  return PALETAS_CATEGORIA[hash % PALETAS_CATEGORIA.length];
}

/** Fila de producto en blanco, lista para editarse a mano. */
export function productoVacio() {
  return {
    id: `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    categoria: "",
    producto: "",
    marca: "",
    unidad: "",
    precioVenta: 0,
    precioCosto: 0,
    proveedor: "",
    imagen: "",
  };
}
