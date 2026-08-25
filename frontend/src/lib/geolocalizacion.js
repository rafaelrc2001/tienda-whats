/** Envuelve navigator.geolocation en una promesa con mensajes en español. */
export function obtenerCoordenadas() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Tu navegador no soporta geolocalización."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => reject(new Error("No pudimos obtener tu ubicación. Revisa los permisos del navegador."))
    );
  });
}

/** Enlace a Google Maps para un punto { lat, lng }. */
export const enlaceMapa = (gps) => `https://www.google.com/maps?q=${gps.lat},${gps.lng}`;
