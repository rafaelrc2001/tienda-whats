/**
 * Cuentas de los dueños.
 *
 * Una cuenta y su tienda nacen juntas: registrarse inserta la fila en `cuentas`
 * y la configuración inicial en `negocios`, ambas en la misma transacción. El
 * teléfono de WhatsApp hace de nombre de usuario y el `idNegocio` —un número de
 * seis dígitos— es lo que los clientes escriben para entrar.
 */
import crypto from "node:crypto";

import bcrypt from "bcrypt";

import { esDuplicado } from "../db/pool.js";
import { cuentasRepository } from "../repositories/cuentas.repository.js";
import { AppError } from "../utils/AppError.js";
import { digits, exigirTexto } from "../utils/validacion.js";

/** Coste del hash. Diez rondas es el equilibrio habitual entre seguridad y tiempo. */
const COSTE_BCRYPT = 10;

/** Un teléfono más corto que esto no es un número de WhatsApp con indicativo. */
const TELEFONO_MINIMO = 7;

/** Longitud mínima de contraseña. Corta, pero evita las de un solo carácter. */
const PASSWORD_MINIMA = 4;

/**
 * Cuántos dígitos tiene el ID de una tienda.
 *
 * Seis, y no más, porque el ID está pensado para dictarse por teléfono. Y seis,
 * y no siete, por una razón que sostiene toda la pantalla de entrada: ahí hay un
 * solo campo, donde se escribe o el teléfono del dueño o el ID de la tienda, y
 * `TELEFONO_MINIMO` es 7. Mientras un ID sea más corto que cualquier teléfono
 * válido, los dos nunca se pueden confundir. Si se toca uno de los dos números,
 * hay que volver a mirar el otro.
 */
const DIGITOS_ID = 6;

/** 100000 y 999999: el rango de seis dígitos, sin ceros a la izquierda. */
const ID_MINIMO = 10 ** (DIGITOS_ID - 1);
const ID_MAXIMO = 10 ** DIGITOS_ID - 1;

/**
 * Cuántas veces se reintenta el alta si el número sorteado ya estaba dado. Con
 * 900 000 combinaciones, dos intentos ya serían mala suerte; cinco es de sobra.
 */
const INTENTOS_ID = 5;

export const ESTATUS = { activo: "activo", suspendido: "suspendido" };

/**
 * Un identificador público para una tienda nueva.
 *
 * Se sortea en vez de ir en orden a propósito: un contador diría cuántas tiendas
 * hay y dejaría asomarse a la de al lado probando el número siguiente.
 *
 * No comprueba si está libre, y no es un olvido: entre esa comprobación y el
 * INSERT cabe otra alta. De la unicidad responde la clave primaria de `cuentas`,
 * que es el único sitio donde la respuesta no se queda vieja. Quien llama
 * reintenta cuando el INSERT choca.
 */
export function generarIdNegocio() {
  return String(crypto.randomInt(ID_MINIMO, ID_MAXIMO + 1));
}

/** Lo que se puede devolver de una cuenta sin filtrar el hash de la contraseña. */
export const cuentaPublica = (cuenta) => ({
  telefono: cuenta.telefono,
  nombreTienda: cuenta.nombreTienda,
  idNegocio: cuenta.idNegocio,
  estatus: cuenta.estatus,
  creadaISO: cuenta.creadaISO,
});

/** Valida el teléfono y lo deja en la forma en que se guarda: solo dígitos. */
function exigirTelefono(telefono) {
  const numero = digits(telefono);
  if (numero.length < TELEFONO_MINIMO) {
    throw AppError.peticionInvalida("El teléfono de WhatsApp no es válido.");
  }
  return numero;
}

function exigirPassword(password, campo = "password") {
  const clave = exigirTexto(password, campo);
  if (clave.length < PASSWORD_MINIMA) {
    throw AppError.peticionInvalida(
      `La contraseña debe tener al menos ${PASSWORD_MINIMA} caracteres.`
    );
  }
  return clave;
}

export const cuentasService = {
  /** @returns {Promise<object|null>} */
  buscarPorTelefono(telefono) {
    const clave = digits(telefono);
    if (!clave) return Promise.resolve(null);
    return cuentasRepository.buscarPorTelefono(clave);
  },

  /** @returns {Promise<object|null>} */
  buscarPorIdNegocio(idNegocio) {
    if (!idNegocio) return Promise.resolve(null);
    return cuentasRepository.buscarPorIdNegocio(idNegocio);
  },

  /**
   * Da de alta una cuenta y su tienda.
   *
   * La unicidad del teléfono y del ID la garantizan las restricciones de la
   * base, no una comprobación previa: entre el `SELECT` y el `INSERT` cabe otro
   * registro simultáneo, y ese hueco es justo lo que la restricción cierra.
   */
  async registrar({ telefono, password, nombreTienda } = {}) {
    const numero = exigirTelefono(telefono);
    const clave = exigirPassword(password);
    const nombre = exigirTexto(nombreTienda, "nombreTienda");

    const passwordHash = await bcrypt.hash(clave, COSTE_BCRYPT);

    for (let intento = 0; intento < INTENTOS_ID; intento += 1) {
      const idNegocio = generarIdNegocio();

      try {
        return await cuentasRepository.crear({
          idNegocio,
          telefono: numero,
          passwordHash,
          nombreTienda: nombre,
        });
      } catch (err) {
        if (esDuplicado(err, "cuentas_telefono_key")) {
          throw AppError.peticionInvalida("Ese teléfono ya tiene una tienda registrada.");
        }
        // El número sorteado ya estaba dado: se sortea otro y se vuelve a probar.
        if (!esDuplicado(err, "cuentas_pkey")) throw err;
      }
    }

    throw AppError.peticionInvalida(
      "No se pudo reservar un ID para la tienda. Vuelve a intentarlo."
    );
  },

  /**
   * Cambia los datos de la cuenta desde "Mi perfil".
   *
   * El nombre y el teléfono se reflejan también en la configuración del
   * negocio: son un solo dato para el dueño. El `idNegocio` nunca cambia, para
   * no invalidar el ID que los clientes ya tienen apuntado.
   */
  async actualizarCuenta(idNegocio, { telefono, nombreTienda, passwordActual, passwordNueva } = {}) {
    const cuenta = await cuentasRepository.buscarPorIdNegocio(idNegocio);
    if (!cuenta) throw AppError.noEncontrado("Esa tienda no existe.");

    const numero = exigirTelefono(telefono ?? cuenta.telefono);
    const nombre = exigirTexto(nombreTienda ?? cuenta.nombreTienda, "nombreTienda");

    let { passwordHash } = cuenta;
    if (passwordNueva) {
      const correcta = await bcrypt.compare(String(passwordActual || ""), cuenta.passwordHash);
      if (!correcta) throw AppError.noAutorizado("La contraseña actual no coincide.");
      passwordHash = await bcrypt.hash(exigirPassword(passwordNueva, "passwordNueva"), COSTE_BCRYPT);
    }

    try {
      return await cuentasRepository.actualizar(idNegocio, {
        telefono: numero,
        nombreTienda: nombre,
        passwordHash,
      });
    } catch (err) {
      if (esDuplicado(err, "cuentas_telefono_key")) {
        throw AppError.peticionInvalida("Ese teléfono ya lo usa otra tienda.");
      }
      throw err;
    }
  },
};
