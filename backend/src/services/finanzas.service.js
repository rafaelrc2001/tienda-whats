/**
 * Resumen de ventas para el panel de finanzas.
 *
 * Hoy el frontend calcula esto en memoria; tener el mismo cálculo en el servidor
 * permite consultarlo desde otro lado (un reporte, una app de escritorio) sin
 * descargar el histórico completo.
 *
 * Los cortes por día, semana y mes siguen hechos en JavaScript a propósito: usan
 * la hora local del proceso, y moverlos a SQL obligaría a fijar una zona horaria
 * en la base, que es una decisión distinta. De la base solo vienen las cabeceras
 * —fecha, total y utilidad—, sin los renglones, que aquí no se miran.
 */
import { pedidosRepository } from "../repositories/pedidos.repository.js";
import { digits } from "../utils/validacion.js";

/** Lunes de la semana a la que pertenece la fecha, a las 00:00. */
function inicioSemana(fecha) {
  const d = new Date(fecha);
  const dia = d.getDay(); // 0 = domingo
  d.setDate(d.getDate() + ((dia === 0 ? -6 : 1) - dia));
  d.setHours(0, 0, 0, 0);
  return d;
}

function enRango(pedido, desde, hasta) {
  const d = new Date(pedido.fechaISO);
  if (desde && d < desde) return false;
  if (hasta && d > hasta) return false;
  return true;
}

export const finanzasService = {
  /**
   * @param {string} idNegocio tienda de la que se calcula el resumen
   * @param {{desde?: string, hasta?: string}} rango fechas YYYY-MM-DD, ambas opcionales
   */
  async resumen(idNegocio, { desde, hasta } = {}) {
    const pedidos = await pedidosRepository.listarCabeceras(idNegocio);
    const limiteDesde = desde ? new Date(`${desde}T00:00:00`) : null;
    const limiteHasta = hasta ? new Date(`${hasta}T23:59:59`) : null;
    const filtrados = pedidos.filter((p) => enRango(p, limiteDesde, limiteHasta));

    const ahora = new Date();
    const hoy = ahora.toDateString();
    const iniSemana = inicioSemana(ahora);
    const finSemana = new Date(iniSemana);
    finSemana.setDate(finSemana.getDate() + 7);

    const porPeriodo = (periodo) => {
      const lista = pedidos.filter((p) => {
        const d = new Date(p.fechaISO);
        if (periodo === "dia") return d.toDateString() === hoy;
        if (periodo === "semana") return d >= iniSemana && d < finSemana;
        return d.getMonth() === ahora.getMonth() && d.getFullYear() === ahora.getFullYear();
      });
      return {
        ingresos: lista.reduce((s, p) => s + p.total, 0),
        utilidad: lista.reduce((s, p) => s + p.utilidad, 0),
        pedidos: lista.length,
      };
    };

    const porCliente = new Map();
    for (const p of filtrados) {
      const clave = digits(p.telefono) || p.nombre;
      const prev = porCliente.get(clave) || { nombre: p.nombre, telefono: p.telefono, pedidos: 0, total: 0 };
      prev.nombre = p.nombre;
      prev.pedidos += 1;
      prev.total += p.utilidad;
      porCliente.set(clave, prev);
    }

    return {
      rango: { desde: desde || null, hasta: hasta || null },
      totales: {
        ingresos: filtrados.reduce((s, p) => s + p.total, 0),
        utilidad: filtrados.reduce((s, p) => s + p.utilidad, 0),
        pedidos: filtrados.length,
      },
      resumenPorPeriodo: {
        dia: porPeriodo("dia"),
        semana: porPeriodo("semana"),
        mes: porPeriodo("mes"),
      },
      porCliente: Array.from(porCliente.values()).sort((a, b) => b.total - a.total),
    };
  },
};
