/**
 * Portada: lo primero que se ve al abrir la aplicación sin sesión.
 *
 * No hace nada más que dar entrada al sistema. Quien llega por el enlace de una
 * tienda no pasa por aquí: para ese la puerta es el propio enlace.
 */
import FondoMarca from "../components/layout/FondoMarca";
import { useTienda } from "../context/TiendaContext";
import { MARCA } from "../config/marca";
import { ShoppingCart } from "../icons";

export default function BienvenidaView() {
  const { comenzar } = useTienda();

  return (
    <FondoMarca>
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <h1 className="text-4xl sm:text-5xl font-semibold leading-tight tracking-wide">
          MI NEGOCIO
          <br />
          DIGITAL
        </h1>
        <ShoppingCart size={72} strokeWidth={1.25} className="mt-10" style={{ color: MARCA.tinta }} />
      </div>

      <div className="px-8 pb-16 flex justify-center">
        <button
          onClick={comenzar}
          className="rounded-md px-12 py-2.5 text-sm font-semibold tracking-[0.18em]"
          style={{ border: `1px solid ${MARCA.tinta}`, color: MARCA.tinta, background: "transparent" }}
        >
          INICIEMOS
        </button>
      </div>
    </FondoMarca>
  );
}
