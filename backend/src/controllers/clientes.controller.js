/** Clientes y sus direcciones de entrega. */
import { clientesService } from "../services/clientes.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const clientesController = {
  listar: asyncHandler(async (_req, res) => {
    res.json(await clientesService.listar());
  }),

  obtenerDirecciones: asyncHandler(async (_req, res) => {
    res.json(await clientesService.obtenerDirecciones());
  }),

  /** Acepta tanto `{ direcciones: {...} }` como el mapa pelado. */
  guardarDirecciones: asyncHandler(async (req, res) => {
    const entrada = req.body?.direcciones ?? req.body;
    res.json(await clientesService.guardarDirecciones(entrada));
  }),
};
