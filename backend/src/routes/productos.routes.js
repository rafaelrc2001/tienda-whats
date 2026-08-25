import { Router } from "express";

import { productosController } from "../controllers/productos.controller.js";

export const productosRouter = Router();

productosRouter.get("/", productosController.listar);
productosRouter.put("/", productosController.reemplazar);
