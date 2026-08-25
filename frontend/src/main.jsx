/** Punto de entrada del frontend: monta React y envuelve la app en el contexto. */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import { TiendaProvider } from "./context/TiendaContext";
import "./styles/index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <TiendaProvider>
      <App />
    </TiendaProvider>
  </StrictMode>
);
