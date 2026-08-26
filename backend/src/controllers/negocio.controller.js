/** Configuración del negocio. */
import { negocioService } from "../services/negocio.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const negocioController = {
  obtener: asyncHandler(async (req, res) => {
    res.json(await negocioService.obtener(req.tienda.id));
  }),

  guardar: asyncHandler(async (req, res) => {
    res.json(await negocioService.guardar(req.tienda.id, req.body || {}));
  }),
};
