/**
 * Puente con n8n, que es quien manda los WhatsApp de la aplicación.
 *
 * Hoy solo hay un mensaje: el código de activación que recibe alguien que quiere
 * abrir su tienda. La automatización todavía no está conectada, así que esto se
 * queda a medio camino a propósito:
 *
 * - Si hay `urlN8n` configurada, se llama al webhook de verdad.
 * - Si no, se simula el envío y el código se escribe en el log del servidor.
 *
 * En los dos casos la función devuelve lo mismo y nunca tumba el alta: que el
 * mensaje no salga es un problema de entrega, no una razón para no haber
 * generado el código. Quien llama decide qué contarle al dueño.
 */
import { config } from "../config/env.js";

/** Si n8n no contesta en este tiempo, se sigue adelante sin él. */
const MS_ESPERA = 5000;

/**
 * Manda el código de activación al WhatsApp indicado.
 *
 * @param {{telefono: string, codigo: string}} datos
 * @returns {Promise<{enviado: boolean, simulado: boolean}>}
 */
export async function enviarCodigoActivacion({ telefono, codigo }) {
  if (!config.activacion.urlN8n) {
    console.info(`[n8n] (simulado) código de activación para ${telefono}: ${codigo}`);
    return { enviado: true, simulado: true };
  }

  try {
    const res = await fetch(config.activacion.urlN8n, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telefono, codigo }),
      signal: AbortSignal.timeout(MS_ESPERA),
    });
    if (!res.ok) throw new Error(`respondió ${res.status}`);
    return { enviado: true, simulado: false };
  } catch (err) {
    console.warn(`[n8n] no se pudo mandar el código a ${telefono}:`, err.message);
    return { enviado: false, simulado: false };
  }
}
