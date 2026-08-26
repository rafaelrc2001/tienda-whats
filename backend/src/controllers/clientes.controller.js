/** Clientes y sus direcciones de entrega. */
import { clientesService } from "../services/clientes.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const clientesController = {
  listar: asyncHandler(async (req, res) => {
    res.json(await clientesService.listar(req.tienda.id));
  }),

  obtenerDirecciones: asyncHandler(async (req, res) => {
    res.json(await clientesService.obtenerDirecciones(req.tienda.id));
  }),

  /** Acepta tanto `{ direcciones: {...} }` como el mapa pelado. */
  guardarDirecciones: asyncHandler(async (req, res) => {
    const entrada = req.body?.direcciones ?? req.body;
    res.json(await clientesService.guardarDirecciones(req.tienda.id, entrada));
  }),

  /** La dirección de un solo teléfono: lo que el comprador puede consultar. */
  obtenerDireccion: asyncHandler(async (req, res) => {
    res.json(await clientesService.obtenerDireccionDe(req.tienda.id, req.params.telefono));
  }),

  /** El cuerpo es la dirección misma: `{ direccion, gps }`. */
  guardarDireccion: asyncHandler(async (req, res) => {
    res.json(await clientesService.guardarDireccionDe(req.tienda.id, req.params.telefono, req.body));
  }),
};
