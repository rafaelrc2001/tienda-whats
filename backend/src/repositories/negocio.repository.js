/** Configuración del negocio: un único registro. */
import { crearAlmacen } from "./jsonStore.js";

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

export const negocioRepository = crearAlmacen("negocio", NEGOCIO_POR_DEFECTO);
