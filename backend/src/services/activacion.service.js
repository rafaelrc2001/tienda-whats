/**
 * Alta de tienda por código de activación.
 *
 * Es el camino que sigue quien todavía no tiene cuenta: escribe su WhatsApp,
 * recibe un código, lo teclea y con eso quedan hechas su cuenta y su tienda.
 *
 * El código lo entrega n8n; aquí solo se genera, se guarda un rato y se
 * comprueba. Mientras la automatización no esté conectada, `config.activacion
 * .codigoFijo` deja siempre el mismo (123 en desarrollo) para poder recorrer el
 * flujo completo sin recibir ningún mensaje.
 *
 * Los códigos pendientes viven en memoria y no en la base a propósito: duran
 * quince minutos y no vale la pena una tabla para eso. La contrapartida es que
 * reiniciar el servidor los olvida y hay que pedir otro, que es exactamente lo
 * que uno espera de un código de un solo uso.
 */
import crypto from "node:crypto";

import { config } from "../config/env.js";
import { AppError } from "../utils/AppError.js";
import { cuentasService, exigirTelefono } from "./cuentas.service.js";
import { enviarCodigoActivacion } from "./n8n.service.js";

/** Cuántos dígitos tiene un código generado de verdad. */
const DIGITOS_CODIGO = 6;

/**
 * Intentos antes de invalidar el código. Con seis dígitos y cinco tiros, dar
 * con uno a ciegas es imposible; y al dueño le sobran cinco para teclearlo bien.
 */
const INTENTOS_MAXIMOS = 5;

/** Nombre con el que nace la tienda. El dueño lo cambia en "Mi perfil". */
const NOMBRE_PROVISIONAL = "Mi negocio";

/** telefono -> { codigo, expiraEn, intentos } */
const pendientes = new Map();

const ahora = () => Date.now();

const generarCodigo = () =>
  String(crypto.randomInt(0, 10 ** DIGITOS_CODIGO)).padStart(DIGITOS_CODIGO, "0");

/** Quita de la memoria los códigos que ya caducaron. */
function limpiarCaducados() {
  const t = ahora();
  for (const [telefono, pendiente] of pendientes) {
    if (pendiente.expiraEn <= t) pendientes.delete(telefono);
  }
}

/** El código vigente de un teléfono, o `null` si no hay o ya caducó. */
function pendienteDe(telefono) {
  const pendiente = pendientes.get(telefono);
  if (!pendiente) return null;
  if (pendiente.expiraEn <= ahora()) {
    pendientes.delete(telefono);
    return null;
  }
  return pendiente;
}

export const activacionService = {
  /**
   * Genera un código para ese WhatsApp y se lo pasa a n8n para que lo mande.
   *
   * Pedirlo otra vez sustituye al anterior: quien no recibió el mensaje vuelve a
   * darle al botón y el código viejo deja de valer en el momento.
   *
   * Que el teléfono ya tenga tienda sí se dice claro, y no es una fuga: para
   * saberlo basta con escribir el número en la pantalla de entrada, que ya
   * responde pidiendo la contraseña. Callarlo aquí solo dejaría a un dueño
   * despistado esperando un mensaje que no va a llegar.
   */
  async solicitarCodigo(telefono) {
    const numero = exigirTelefono(telefono);

    if (await cuentasService.buscarPorTelefono(numero)) {
      throw AppError.peticionInvalida(
        "Ese número ya tiene una tienda. Entra con tu contraseña."
      );
    }

    limpiarCaducados();

    const codigo = config.activacion.codigoFijo || generarCodigo();
    const minutos = config.activacion.minutosVigencia;

    pendientes.set(numero, {
      codigo,
      expiraEn: ahora() + minutos * 60_000,
      intentos: 0,
    });

    const { enviado, simulado } = await enviarCodigoActivacion({ telefono: numero, codigo });

    return {
      enviado,
      minutosVigencia: minutos,
      /**
       * Con un código fijo no hay nada que proteger —es el mismo para todos y
       * está en la configuración—, así que fuera de producción se devuelve para
       * poder probar el alta sin mirar el log del servidor.
       */
      ...(config.activacion.codigoFijo && !config.esProduccion ? { codigoDePrueba: codigo, simulado } : {}),
    };
  },

  /**
   * Comprueba el código y, si cuadra, crea la cuenta y su tienda.
   *
   * La contraseña queda siendo el propio código: el dueño entra con él y lo
   * cambia desde "Mi perfil" cuando quiera. Por eso no pasa por el mínimo de
   * caracteres del alta normal, donde sí lo elige a mano.
   */
  async activar({ telefono, codigo, nombreTienda } = {}) {
    const numero = exigirTelefono(telefono);
    const escrito = String(codigo || "").trim();

    const pendiente = pendienteDe(numero);
    if (!pendiente) {
      throw AppError.peticionInvalida(
        "No hay ningún código pendiente para ese número, o ya caducó. Pide uno nuevo."
      );
    }

    if (escrito !== pendiente.codigo) {
      pendiente.intentos += 1;
      if (pendiente.intentos >= INTENTOS_MAXIMOS) {
        pendientes.delete(numero);
        throw AppError.peticionInvalida(
          "Demasiados intentos fallidos. Pide un código nuevo."
        );
      }
      throw AppError.peticionInvalida("El código no es correcto.");
    }

    // Se consume antes de crear la cuenta: si el alta falla, el código ya no
    // vale y se pide otro. Reusarlo no arreglaría nada y sí abriría la puerta a
    // dos altas con el mismo.
    pendientes.delete(numero);

    const passwordHash = await cuentasService.hashDePassword(escrito);

    return cuentasService.crear({
      telefono: numero,
      passwordHash,
      nombreTienda: String(nombreTienda || "").trim() || NOMBRE_PROVISIONAL,
    });
  },
};
