/** Catálogo de productos. */
import { productosService } from "../services/productos.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const productosController = {
  listar: asyncHandler(async (_req, res) => {
    res.json(await productosService.listar());
  }),

  /** Acepta tanto `{ productos: [...] }` como el arreglo pelado. */
  reemplazar: asyncHandler(async (req, res) => {
    const entrada = Array.isArray(req.body) ? req.body : req.body?.productos;
    res.json(await productosService.reemplazar(entrada));
  }),
};
