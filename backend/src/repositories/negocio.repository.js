/**
 * Configuración del negocio: una fila por tienda.
 *
 * La tabla guarda el horario desplegado en columnas, pero la API sigue hablando
 * del objeto anidado de siempre (`{ ubicacion, banco, horario: { dias } }`).
 * Traducir entre las dos formas es todo lo que hace este archivo, y es la razón
 * de que ni el servicio ni el frontend se hayan enterado del cambio de almacén.
 */
import { primeraFila } from "../db/pool.js";

/** Los siete días, en el orden en que los pinta la pantalla de configuración. */
export const DIAS = ["lun", "mar", "mie", "jue", "vie", "sab", "dom"];

/** Estado inicial de un negocio que todavía no se ha configurado. */
export const NEGOCIO_POR_DEFECTO = {
  nombre: "",
  telefono: "",
  ubicacion: null,
  banco: { nombre: "", beneficiario: "", numeroCuenta: "" },
  skinId: "mercado",
  horario: {
    dias: { lun: true, mar: true, mie: true, jue: true, vie: true, sab: true, dom: false },
    apertura: "08:00",
    cierre: "18:00",
    atenderFuera: false,
    recargo: 20,
  },
};

const clonarPorDefecto = () => JSON.parse(JSON.stringify(NEGOCIO_POR_DEFECTO));

/** Fila de `negocios` -> el objeto anidado que espera el frontend. */
const aNegocio = (fila) => ({
  nombre: fila.nombre,
  telefono: fila.telefono,
  ubicacion:
    fila.ubicacion_lat === null ? null : { lat: fila.ubicacion_lat, lng: fila.ubicacion_lng },
  banco: {
    nombre: fila.banco_nombre,
    beneficiario: fila.banco_beneficiario,
    numeroCuenta: fila.banco_numero_cuenta,
  },
  skinId: fila.skin_id,
  horario: {
    dias: Object.fromEntries(DIAS.map((d) => [d, fila[`horario_${d}`]])),
    apertura: fila.horario_apertura,
    cierre: fila.horario_cierre,
    atenderFuera: fila.horario_atender_fuera,
    recargo: fila.horario_recargo,
  },
});

const COLUMNAS = `nombre, telefono, ubicacion_lat, ubicacion_lng,
                  banco_nombre, banco_beneficiario, banco_numero_cuenta, skin_id,
                  ${DIAS.map((d) => `horario_${d}`).join(", ")},
                  horario_apertura, horario_cierre, horario_atender_fuera, horario_recargo`;

export const negocioRepository = {
  /**
   * Configuración de una tienda.
   *
   * Devuelve los valores por defecto si todavía no hay fila, igual que hacía el
   * almacén de archivos cuando el JSON no existía.
   */
  async obtener(idNegocio) {
    const fila = await primeraFila(
      `SELECT ${COLUMNAS} FROM negocios WHERE id_negocio = $1`,
      [idNegocio]
    );
    return fila ? aNegocio(fila) : clonarPorDefecto();
  },

  /**
   * Reemplaza la configuración completa.
   *
   * Espera el objeto ya normalizado por el servicio, y lo devuelve tal como
   * quedó guardado.
   */
  async guardar(idNegocio, negocio) {
    const { ubicacion, banco, horario } = negocio;

    const fila = await primeraFila(
      `INSERT INTO negocios (id_negocio, ${COLUMNAS})
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9,
               $10, $11, $12, $13, $14, $15, $16,
               $17, $18, $19, $20)
       ON CONFLICT (id_negocio) DO UPDATE SET
           nombre                = EXCLUDED.nombre,
           telefono              = EXCLUDED.telefono,
           ubicacion_lat         = EXCLUDED.ubicacion_lat,
           ubicacion_lng         = EXCLUDED.ubicacion_lng,
           banco_nombre          = EXCLUDED.banco_nombre,
           banco_beneficiario    = EXCLUDED.banco_beneficiario,
           banco_numero_cuenta   = EXCLUDED.banco_numero_cuenta,
           skin_id               = EXCLUDED.skin_id,
           horario_lun           = EXCLUDED.horario_lun,
           horario_mar           = EXCLUDED.horario_mar,
           horario_mie           = EXCLUDED.horario_mie,
           horario_jue           = EXCLUDED.horario_jue,
           horario_vie           = EXCLUDED.horario_vie,
           horario_sab           = EXCLUDED.horario_sab,
           horario_dom           = EXCLUDED.horario_dom,
           horario_apertura      = EXCLUDED.horario_apertura,
           horario_cierre        = EXCLUDED.horario_cierre,
           horario_atender_fuera = EXCLUDED.horario_atender_fuera,
           horario_recargo       = EXCLUDED.horario_recargo,
           actualizado_en        = now()
       RETURNING ${COLUMNAS}`,
      [
        idNegocio,
        negocio.nombre,
        negocio.telefono,
        ubicacion?.lat ?? null,
        ubicacion?.lng ?? null,
        banco.nombre,
        banco.beneficiario,
        banco.numeroCuenta,
        negocio.skinId,
        ...DIAS.map((d) => horario.dias[d]),
        horario.apertura,
        horario.cierre,
        horario.atenderFuera,
        horario.recargo,
      ]
    );

    return aNegocio(fila);
  },
};
