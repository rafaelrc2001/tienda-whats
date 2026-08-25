/** Última dirección conocida de cada cliente, indexada por teléfono (solo dígitos). */
import { crearAlmacen } from "./jsonStore.js";

export const direccionesRepository = crearAlmacen("direcciones", {});
