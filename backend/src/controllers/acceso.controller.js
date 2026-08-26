/** Entrada a una tienda: identificación, login de administrador y alta. */
import { accesoService } from "../services/acceso.service.js";
import { cuentaPublica, cuentasService } from "../services/cuentas.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { tokenDeCabecera } from "../utils/token.js";

export const accesoController = {
  /** Qué es lo que se escribió en el campo único de la pantalla de entrada. */
  resolver: asyncHandler(async (req, res) => {
    res.json(await accesoService.resolver(req.body?.valor));
  }),

  admin: asyncHandler(async (req, res) => {
    const { telefono, password } = req.body || {};
    res.json(await accesoService.entrarComoAdmin(telefono, password));
  }),

  /** Cerrar sesión siempre responde 204, exista o no el token. */
  salir: asyncHandler(async (req, res) => {
    await accesoService.cerrarSesion(tokenDeCabecera(req));
    res.status(204).end();
  }),

  /** Alta de cuenta. Entra directo: la contraseña se acaba de elegir. */
  registrar: asyncHandler(async (req, res) => {
    const cuenta = await cuentasService.registrar(req.body || {});
    res.status(201).json(await accesoService.abrirSesion(cuenta));
  }),

  /** Datos de la cuenta desde "Mi perfil". Nunca devuelve el hash. */
  actualizarMiCuenta: asyncHandler(async (req, res) => {
    const cuenta = await cuentasService.actualizarCuenta(req.tienda.id, req.body || {});
    res.json(cuentaPublica(cuenta));
  }),
};
