/** Pedidos confirmados. Solo se agregan: son el histórico de ventas. */
import { crearAlmacen } from "./jsonStore.js";

export const pedidosRepository = crearAlmacen("pedidos", []);
