/**
 * Construcción de la aplicación Express.
 *
 * Se exporta la app ya armada, sin escuchar en ningún puerto: eso lo hace
 * server.js. Así se puede montar en pruebas sin abrir un socket.
 */
import fs from "node:fs";
import path from "node:path";

import cors from "cors";
import express from "express";
import morgan from "morgan";

import { config } from "./config/env.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { notFound } from "./middlewares/notFound.js";
import { apiRouter } from "./routes/index.js";

export function crearApp() {
  const app = express();

  app.disable("x-powered-by");

  // Las imágenes de productos viajan como data URI dentro del JSON, así que el
  // catálogo completo puede pesar bastante más que el límite por defecto (100kb).
  app.use(express.json({ limit: "25mb" }));

  app.use(
    cors({
      origin: config.corsOrigin.length ? config.corsOrigin : true,
    })
  );

  app.use(morgan(config.esProduccion ? "combined" : "dev"));

  app.use("/api", apiRouter);

  // En producción el mismo proceso sirve el build del frontend, si existe.
  if (fs.existsSync(config.staticDir)) {
    app.use(express.static(config.staticDir));
    app.get(/^\/(?!api\/).*/, (_req, res) => {
      res.sendFile(path.join(config.staticDir, "index.html"));
    });
  }

  app.use("/api", notFound);
  app.use(errorHandler);

  return app;
}
