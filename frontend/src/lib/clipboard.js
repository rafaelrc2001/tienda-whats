/**
 * Copia texto al portapapeles.
 * Incluye respaldo con execCommand para contextos no seguros (http:// o file://),
 * donde la Clipboard API no está disponible.
 */
export function copiarTexto(texto) {
  if (!texto) return Promise.reject(new Error("vacío"));
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(texto);
  }
  return new Promise((resolve, reject) => {
    try {
      const ta = document.createElement("textarea");
      ta.value = texto;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      resolve();
    } catch (e) {
      reject(e);
    }
  });
}
