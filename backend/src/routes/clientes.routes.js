import { Router } from "express";

import { clientesController } from "../controllers/clientes.controller.js";

export const clientesRouter = Router();

clientesRouter.get("/", clientesController.listar);
clientesRouter.get("/direcciones", clientesController.obtenerDirecciones);
clientesRouter.put("/direcciones", clientesController.guardarDirecciones);
