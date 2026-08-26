/**
 * Acceso a una tienda.
 *
 * Hay dos formas de entrar y solo una lleva contraseña:
 *
 * - **Administrador**: el dueño escribe su teléfono de WhatsApp y su clave. Si
 *   todo cuadra recibe un token que queda anotado en la tabla `sesiones`.
 * - **Cliente**: basta con escribir el `idNegocio`. No hay token porque no hay
 *   nada que autorizar: el modo cliente solo ve el catálogo.
 *
 * `resolver` es lo que permite que la pantalla de entrada tenga un único campo:
 * recibe lo que se haya escrito y dice si es un teléfono de dueño, un ID de
 * negocio o algo que no conocemos.
 */
import crypto from "node:crypto";

import bcrypt from "bcrypt";

import { sesionesRepository } from "../repositories/sesiones.repository.js";
import { AppError } from "../utils/AppError.js";
import { digits } from "../utils/validacion.js";
import { ESTATUS, cuentasService } from "./cuentas.service.js";

/** Tamaño del token de sesión, en bytes antes de pasarlo a hexadecimal. */
const BYTES_TOKEN = 32;

const nuevoToken = () => crypto.randomBytes(BYTES_TOKEN).toString("hex");

export const acceso = { admin: "admin", cliente: "cliente" };

export const accesoService = {
  /**
   * Averigua qué se escribió en el campo único de la pantalla de entrada.
   *
   * Nunca devuelve datos de la cuenta: como mucho, el nombre de la tienda
   * cuando lo escrito resulta ser un ID de negocio.
   *
   * @returns {Promise<{tipo: "duenio"} | {tipo: "negocio", idNegocio: string, nombreTienda: string} | {tipo: "desconocido"}>}
   */
  async resolver(valor) {
    const texto = String(valor || "").trim();
    if (!texto) return { tipo: "desconocido" };

    // Primero como teléfono de dueño. Una cuenta suspendida también responde
    // "duenio": así el dueño llega a la contraseña y recibe un mensaje que
    // explica que está suspendida, en vez de que le ofrezcamos crear una tienda.
    if (digits(texto) && (await cuentasService.buscarPorTelefono(texto))) {
      return { tipo: "duenio" };
    }

    // Después como ID de negocio. Una tienda suspendida no se puede abrir ni en
    // modo cliente, así que se responde como si no existiera.
    const cuenta = await cuentasService.buscarPorIdNegocio(texto.toLowerCase());
    if (cuenta && cuenta.estatus === ESTATUS.activo) {
      return { tipo: "negocio", idNegocio: cuenta.idNegocio, nombreTienda: cuenta.nombreTienda };
    }

    return { tipo: "desconocido" };
  },

  /**
   * Emite un token para una cuenta y lo anota en `sesiones`.
   * Lo usan tanto el login como el alta, que entra directo sin volver a pedir
   * la contraseña que se acaba de elegir.
   */
  async abrirSesion(cuenta) {
    const token = nuevoToken();
    await sesionesRepository.crear(token, cuenta.idNegocio);
    return { token, idNegocio: cuenta.idNegocio, nombreTienda: cuenta.nombreTienda };
  },

  /**
   * Abre sesión de administrador.
   *
   * La contraseña se comprueba antes que el estatus, para no confirmarle a un
   * desconocido que ese número tiene una cuenta suspendida.
   */
  async entrarComoAdmin(telefono, password) {
    const cuenta = await cuentasService.buscarPorTelefono(telefono);
    const correcta = cuenta
      ? await bcrypt.compare(String(password || ""), cuenta.passwordHash)
      : false;

    if (!correcta) throw AppError.noAutorizado("Teléfono o contraseña incorrectos.");

    if (cuenta.estatus !== ESTATUS.activo) {
      throw AppError.prohibido("Tu cuenta está suspendida y no puede entrar.");
    }

    return this.abrirSesion(cuenta);
  },

  /** Sesión asociada a un token, o `null` si el token no vale. */
  sesionDe(token) {
    if (typeof token !== "string" || !token) return Promise.resolve(null);
    return sesionesRepository.buscar(token);
  },

  /** Cierra la sesión. Un token que ya no existe no es un error. */
  async cerrarSesion(token) {
    if (typeof token !== "string" || !token) return;
    await sesionesRepository.borrar(token);
  },
};
