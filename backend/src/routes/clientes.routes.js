import { Router } from "express";

import { clientesController } from "../controllers/clientes.controller.js";
import { exigirAdmin } from "../middlewares/tienda.js";

export const clientesRouter = Router();

// Toda esta sección es del dueño: la lista de clientes de la tienda y el mapa
// completo de sus direcciones de entrega.
clientesRouter.get("/", exigirAdmin, clientesController.listar);
clientesRouter.get("/direcciones", exigirAdmin, clientesController.obtenerDirecciones);
clientesRouter.put("/direcciones", exigirAdmin, clientesController.guardarDirecciones);

// Excepción para el modo cliente: el comprador consulta y guarda SU dirección,
// que es la única que necesita, sin ver el resto del mapa.
clientesRouter.get("/direcciones/:telefono", clientesController.obtenerDireccion);
clientesRouter.put("/direcciones/:telefono", clientesController.guardarDireccion);
