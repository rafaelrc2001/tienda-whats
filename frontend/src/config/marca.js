/**
 * Colores e identidad de la aplicación, no de la tienda.
 *
 * El resto del sistema se pinta con el skin que el negocio haya elegido, pero
 * las pantallas de entrada —la bienvenida y el acceso— son de antes: ahí todavía
 * no se sabe en qué tienda estamos, así que no hay skin del que tirar. Además,
 * usar los mismos tonos hacía que el fondo, la tarjeta y los campos salieran casi
 * del mismo color y no se distinguiera dónde había que escribir.
 *
 * De ahí esta paleta fija: carbón arriba, la onda azul abajo y encima una
 * tarjeta blanca que se ve a la primera.
 */
export const MARCA = {
  carbon: "#33373B",
  carbonSuave: "#3E4348",
  azul: "#2E7CB8",
  azulOscuro: "#24638F",

  /** Sobre el fondo oscuro. */
  tinta: "#FFFFFF",
  tintaSuave: "#C7CFD6",

  /** Dentro de la tarjeta blanca. */
  tarjeta: "#FFFFFF",
  tarjetaBorde: "#DCE3EA",
  campo: "#F5F7F9",
  campoBorde: "#C9D3DC",
  texto: "#1E2529",
  textoSuave: "#5E6B75",

  error: "#B14A3A",
  ok: "#2F7F52",
  whatsapp: "#25D366",
};

/** WhatsApp al que escribe quien quiere abrir una tienda y todavía no tiene cuenta. */
export const WHATSAPP_ALTAS = "529211455847";

/** Mensaje con el que llega ese primer contacto, ya escrito para no dar trabajo. */
export const MENSAJE_ALTA = "Hola, estoy interesado en crear una cuenta.";
