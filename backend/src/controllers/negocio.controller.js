/** Configuración del negocio. */
import { negocioService } from "../services/negocio.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const negocioController = {
  obtener: asyncHandler(async (_req, res) => {
    res.json(await negocioService.obtener());
  }),

  guardar: asyncHandler(async (req, res) => {
    res.json(await negocioService.guardar(req.body || {}));
  }),
};
