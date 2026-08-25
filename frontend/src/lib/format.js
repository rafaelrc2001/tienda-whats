/**
 * Utilidades de formato y normalización de texto/números.
 * Sin dependencias de React: se pueden usar en cualquier capa.
 */

/** Formatea un número como precio en pesos, sin decimales. */
export const money = (n) =>
  "$" + Number(n || 0).toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

/** Minúsculas, sin acentos y sin espacios sobrantes. Base de todas las comparaciones. */
export const normalize = (s) =>
  String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

/** Deja solo los dígitos de una cadena (se usa para comparar teléfonos). */
export const digits = (s) => String(s || "").replace(/\D/g, "");

/** Convierte a número tolerando "$", puntos de miles y coma decimal. */
export const toNumber = (v) =>
  Number(String(v ?? "").replace(/[^0-9.,]/g, "").replace(",", ".")) || 0;

/** "25/08 14:30" a partir de un Date. */
export const fechaHoraCorta = (d) =>
  `${d.toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit" })} ${d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}`;

/** Fecha de hoy como YYYY-MM-DD en horario local (para los <input type="date">). */
export const hoyISO = () => new Date().toLocaleDateString("sv-SE");

/** Convierte un hex "#RRGGBB" a rgba() con la transparencia indicada. */
export function hexToRgba(hex, alpha) {
  const h = String(hex || "#000000").replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
