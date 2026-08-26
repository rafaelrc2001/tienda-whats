import { Router } from "express";

import { productosController } from "../controllers/productos.controller.js";
import { exigirAdmin } from "../middlewares/tienda.js";

export const productosRouter = Router();

// El catálogo es lo que el cliente viene a ver; editarlo es cosa del dueño.
productosRouter.get("/", productosController.listar);
productosRouter.put("/", exigirAdmin, productosController.reemplazar);
