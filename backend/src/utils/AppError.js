/**
 * Error con código HTTP. Todo lo que se lance con esta clase llega al cliente
 * como una respuesta controlada; cualquier otro error se reporta como 500.
 */
export class AppError extends Error {
  constructor(mensaje, estado = 500, detalles = null) {
    super(mensaje);
    this.name = "AppError";
    this.estado = estado;
    this.detalles = detalles;
  }

  static peticionInvalida(mensaje, detalles) {
    return new AppError(mensaje, 400, detalles);
  }

  static noAutorizado(mensaje = "No autorizado") {
    return new AppError(mensaje, 401);
  }

  static prohibido(mensaje = "Acceso denegado") {
    return new AppError(mensaje, 403);
  }

  static noEncontrado(mensaje = "Recurso no encontrado") {
    return new AppError(mensaje, 404);
  }
}
