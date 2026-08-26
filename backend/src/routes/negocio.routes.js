import { Router } from "express";

import { negocioController } from "../controllers/negocio.controller.js";
import { exigirAdmin } from "../middlewares/tienda.js";

export const negocioRouter = Router();

// El cliente necesita leer la configuración: nombre, horario, banco y skin.
negocioRouter.get("/", negocioController.obtener);
negocioRouter.put("/", exigirAdmin, negocioController.guardar);
