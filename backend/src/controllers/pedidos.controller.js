/** Pedidos confirmados. */
import { finanzasService } from "../services/finanzas.service.js";
import { pedidosService } from "../services/pedidos.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const pedidosController = {
  listar: asyncHandler(async (_req, res) => {
    res.json(await pedidosService.listar());
  }),

  crear: asyncHandler(async (req, res) => {
    res.status(201).json(await pedidosService.crear(req.body));
  }),

  resumen: asyncHandler(async (req, res) => {
    const { desde, hasta } = req.query;
    res.json(await finanzasService.resumen({ desde, hasta }));
  }),
};
