/**
 * Armazón de la aplicación: tema, header, menú lateral y el enrutado simple
 * entre vistas. Toda la lógica vive en el contexto; aquí solo se decide qué
 * pantalla se muestra.
 */
import BarraCarrito from "./components/carrito/BarraCarrito";
import ModalHorario from "./components/common/ModalHorario";
import DrawerMenu from "./components/layout/DrawerMenu";
import FondoMarca from "./components/layout/FondoMarca";
import Header from "./components/layout/Header";
import { useTienda } from "./context/TiendaContext";
import { MARCA } from "./config/marca";
import { hexToRgba } from "./lib/format";
import { Check } from "./icons";
import AccesoView from "./views/AccesoView";
import BienvenidaView from "./views/BienvenidaView";
import CatalogoView from "./views/CatalogoView";
import CheckoutView from "./views/CheckoutView";
import ClientesView from "./views/ClientesView";
import ConfirmacionView from "./views/ConfirmacionView";
import FinanzasView from "./views/FinanzasView";
import IdentificacionView from "./views/IdentificacionView";
import PerfilView from "./views/PerfilView";
import ProductosView from "./views/ProductosView";

/** Variables CSS que consumen todas las pantallas, derivadas del skin activo. */
function estiloTema(theme) {
  return {
    "--bg": theme.bg,
    "--card": theme.card,
    "--border": theme.border,
    "--ink": theme.ink,
    "--muted": theme.muted,
    "--primary": theme.primary,
    "--primaryDark": theme.primaryDark,
    "--accent": theme.accent,
    "--accentInk": theme.accentInk,
    "--headerBg": theme.headerBg,
    "--headerInk": theme.headerInk,
    background: "var(--bg)",
    color: "var(--ink)",
    minHeight: "100vh",
    fontFamily: "'Public Sans', ui-sans-serif, system-ui",
    position: "relative",
    overflow: "hidden",
    // los skins con foto llevan la imagen atenuada con el color de fondo del tema
    ...(theme.foto
      ? {
          backgroundImage: `linear-gradient(${hexToRgba(theme.bg, 0.88)}, ${hexToRgba(theme.bg, 0.88)}), url(${theme.foto})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
          backgroundRepeat: "no-repeat",
        }
      : {}),
  };
}

/**
 * Espera de la entrada por enlace. Se enseña en lugar de la pantalla de acceso
 * mientras se comprueba la tienda que nombra la URL: quien abre el link de una
 * tienda no debe ver de refilón un formulario que no va a usar.
 */
function AbriendoTienda() {
  return (
    <FondoMarca>
      <p className="flex-1 flex items-center justify-center text-sm" style={{ color: MARCA.tintaSuave }}>
        Abriendo la tienda...
      </p>
    </FondoMarca>
  );
}

export default function App() {
  const {
    bienvenidaVista,
    clienteActivo,
    entrandoPorEnlace,
    esAdmin,
    sesion,
    sesionMsg,
    theme,
    view,
  } = useTienda();

  /**
   * Antes de entrar a ninguna tienda la aplicación es otra cosa: pantalla
   * completa, colores de la marca y sin barra ni menú, porque todavía no hay
   * negocio del que sacar ni el tema ni las secciones.
   */
  if (!sesion) {
    if (entrandoPorEnlace) return <AbriendoTienda />;
    return bienvenidaVista ? <AccesoView /> : <BienvenidaView />;
  }

  /**
   * Las secciones del dueño no se renderizan en modo cliente ni aunque el `view`
   * llegue forzado. Es el espejo del `exigirAdmin` del backend: aquí se evita la
   * pantalla, allí se corta el dato.
   */
  const verSiEsAdmin = (key, pantalla) => (esAdmin && view === key ? pantalla : null);

  return (
    <div style={estiloTema(theme)}>
      <Header />
      <DrawerMenu />

      <main className="max-w-3xl mx-auto px-5 py-8 pb-28 relative z-0">
        {sesionMsg && (
          <div className="rounded-lg px-3 py-2 text-xs mb-5 flex items-center gap-1.5" style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--muted)" }}>
            <Check size={13} /> {sesionMsg}
          </div>
        )}

        {view === "catalogo" && (clienteActivo ? <CatalogoView /> : <IdentificacionView />)}
        {view === "checkout" && <CheckoutView />}
        {view === "confirmacion" && <ConfirmacionView />}
        {verSiEsAdmin("productos", <ProductosView />)}
        {verSiEsAdmin("clientes", <ClientesView />)}
        {verSiEsAdmin("perfil", <PerfilView />)}
        {verSiEsAdmin("finanzas", <FinanzasView />)}
      </main>

      <BarraCarrito />
      <ModalHorario />
    </div>
  );
}
