/**
 * Fondo de las pantallas de entrada: carbón arriba, onda azul abajo.
 *
 * Lo comparten la bienvenida y el acceso, para que pasar de una a otra no
 * parezca cambiar de aplicación: lo único que se mueve es lo que va encima.
 *
 * La onda es un SVG estirado (`preserveAspectRatio="none"`), así que se adapta a
 * cualquier ancho sin recortarse. Ocupa poco más de un tercio de la pantalla,
 * que es donde queda en el diseño.
 */
import { MARCA } from "../../config/marca";

function Onda() {
  return (
    <svg
      className="absolute inset-x-0 bottom-0 w-full h-[42%] min-h-[220px]"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M0,44 C10,45 20,2 41,7 C60,12 72,50 100,46 L100,100 L0,100 Z"
        fill={MARCA.azul}
      />
    </svg>
  );
}

export default function FondoMarca({ children }) {
  return (
    <div
      className="min-h-screen relative overflow-hidden flex flex-col"
      style={{
        background: MARCA.carbon,
        color: MARCA.tinta,
        fontFamily: "'Public Sans', ui-sans-serif, system-ui",
      }}
    >
      <Onda />
      <div className="relative z-10 flex-1 flex flex-col">{children}</div>
    </div>
  );
}
