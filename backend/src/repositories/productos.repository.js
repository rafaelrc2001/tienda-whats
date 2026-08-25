/** Catálogo de productos. Se guarda entero porque la pantalla lo edita como tabla. */
import { crearAlmacen } from "./jsonStore.js";

export const productosRepository = crearAlmacen("productos", []);
