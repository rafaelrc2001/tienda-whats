/** Catálogo de productos. */
import { productosService } from "../services/productos.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const productosController = {
  listar: asyncHandler(async (req, res) => {
    res.json(await productosService.listar(req.tienda.id));
  }),

  /** Acepta tanto `{ productos: [...] }` como el arreglo pelado. */
  reemplazar: asyncHandler(async (req, res) => {
    const entrada = Array.isArray(req.body) ? req.body : req.body?.productos;
    res.json(await productosService.reemplazar(req.tienda.id, entrada));
  }),
};
