/**
 * Rutas de entrada. Son las únicas que no llevan cabecera `X-Negocio`: es
 * justo aquí donde se averigua a qué tienda pertenece quien está entrando.
 */
import { Router } from "express";

import { accesoController } from "../controllers/acceso.controller.js";
import { exigirAdmin, resolverTienda } from "../middlewares/tienda.js";

export const accesoRouter = Router();

accesoRouter.post("/resolver", accesoController.resolver);
accesoRouter.post("/admin", accesoController.admin);
accesoRouter.post("/salir", accesoController.salir);

/** El alta vive aparte porque crea un recurso: la cuenta. */
export const cuentasRouter = Router();

cuentasRouter.post("/", accesoController.registrar);

// Alta en dos pasos, para quien llega sin cuenta: primero se pide el código al
// WhatsApp y después se canjea. Van aquí, y no en /acceso, porque las dos son
// parte de crear la cuenta.
cuentasRouter.post("/codigo", accesoController.solicitarCodigo);
cuentasRouter.post("/activar", accesoController.activar);

// Esta sí necesita saber de qué tienda hablamos, así que resuelve la tienda a
// mano: el router de cuentas se monta antes del middleware general.
cuentasRouter.put("/mi-cuenta", resolverTienda, exigirAdmin, accesoController.actualizarMiCuenta);
