import { Router } from "express";

import { negocioController } from "../controllers/negocio.controller.js";

export const negocioRouter = Router();

negocioRouter.get("/", negocioController.obtener);
negocioRouter.put("/", negocioController.guardar);
