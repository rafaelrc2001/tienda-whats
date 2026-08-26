/**
 * Cuentas de los dueños.
 *
 * Una cuenta y su tienda nacen juntas: registrarse inserta la fila en `cuentas`
 * y la configuración inicial en `negocios`, ambas en la misma transacción. El
 * teléfono de WhatsApp hace de nombre de usuario y el `idNegocio` —un slug del
 * nombre de la tienda— es lo que los clientes escriben para entrar.
 */
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

/** Marcas diacríticas que deja sueltas `normalize("NFD")`. */
const DIACRITICOS = /[̀-ͯ]/g;

/**
 * Cuántas veces se reintenta el alta si otro registro simultáneo se queda con
 * el slug que habíamos elegido. Con dos ya sería mala suerte; cinco es de sobra.
 */
const INTENTOS_SLUG = 5;

export const ESTATUS = { activo: "activo", suspendido: "suspendido" };

/**
 * Parte del slug que sale del nombre, antes de resolver duplicados:
 * "Abarrotes María" -> "abarrotes-maria".
 */
export function slugBase(nombre) {
  const base = String(nombre || "")
    .normalize("NFD")
    .replace(DIACRITICOS, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!base) {
    throw AppError.peticionInvalida(
      "El nombre de la tienda debe tener al menos una letra o un número."
    );
  }
  return base;
}

/**
 * Convierte el nombre de la tienda en un identificador público libre.
 * Si el slug ya está ocupado se prueba con `-2`, `-3`, y así sucesivamente.
 *
 * @param {string} nombre       nombre de la tienda tal como lo escribió el dueño
 * @param {string[]} existentes ids ya en uso que empiezan por el mismo slug
 */
export function generarIdNegocio(nombre, existentes = []) {
  const base = slugBase(nombre);

  const usados = new Set(existentes);
  if (!usados.has(base)) return base;

  let sufijo = 2;
  while (usados.has(`${base}-${sufijo}`)) sufijo += 1;
  return `${base}-${sufijo}`;
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
   * La unicidad del teléfono y del slug la garantizan los índices UNIQUE de la
   * base, no una comprobación previa: entre el `SELECT` y el `INSERT` cabe otro
   * registro simultáneo, y ese hueco es justo lo que la restricción cierra.
   */
  async registrar({ telefono, password, nombreTienda } = {}) {
    const numero = exigirTelefono(telefono);
    const clave = exigirPassword(password);
    const nombre = exigirTexto(nombreTienda, "nombreTienda");

    const base = slugBase(nombre);
    const passwordHash = await bcrypt.hash(clave, COSTE_BCRYPT);

    for (let intento = 0; intento < INTENTOS_SLUG; intento += 1) {
      const ocupados = await cuentasRepository.idsNegocioConPrefijo(base);
      const idNegocio = generarIdNegocio(nombre, ocupados);

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
        // Otro alta se quedó con el slug entre nuestro SELECT y nuestro INSERT:
        // se vuelve a mirar cuáles están libres y se prueba con el siguiente.
        if (!esDuplicado(err, "cuentas_pkey")) throw err;
      }
    }

    throw AppError.peticionInvalida(
      "No se pudo reservar un ID para la tienda. Prueba con otro nombre."
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
