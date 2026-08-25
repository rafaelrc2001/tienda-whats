/** Lectura del catálogo de productos desde un archivo de Excel. */
import * as XLSX from "xlsx";
import { normalize, toNumber } from "./format";

/** Clasifica el encabezado de una columna del excel a un campo interno. */
export function classifyHeader(key) {
  const k = normalize(key);
  if (k.includes("categ")) return "categoria";
  if (k.includes("marca")) return "marca";
  if (k.includes("unidad")) return "unidad";
  if (k.includes("proveedor")) return "proveedor";
  if (k.includes("costo")) return "precioCosto";
  if (k.includes("venta") || (k.includes("precio") && !k.includes("costo"))) return "precioVenta";
  if (k.includes("produc") || k === "nombre") return "producto";
  return null;
}

/** Convierte las filas crudas de una hoja en productos del catálogo. */
export function filasAProductos(rows) {
  return rows
    .map((row, idx) => {
      const out = { categoria: "", producto: "", marca: "", unidad: "", precioVenta: 0, precioCosto: 0, proveedor: "", imagen: "" };
      Object.entries(row).forEach(([k, v]) => {
        const campo = classifyHeader(k);
        if (!campo) return;
        if (campo === "precioVenta" || campo === "precioCosto") out[campo] = toNumber(v);
        else out[campo] = String(v).trim();
      });
      out.categoria = out.categoria || "Otros";
      out.unidad = out.unidad || "unidad";
      out.id = `x_${Date.now()}_${idx}`;
      return out;
    })
    .filter((p) => p.producto);
}

/**
 * Lee un File de Excel y devuelve los productos de su primera hoja.
 * Rechaza con Error("vacio") o Error("sin_productos") si no hay nada aprovechable.
 */
export function leerProductosDeExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("lectura"));
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const wb = XLSX.read(data, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        if (!rows.length) throw new Error("vacio");

        const mapped = filasAProductos(rows);
        if (!mapped.length) throw new Error("sin_productos");
        resolve(mapped);
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsArrayBuffer(file);
  });
}
