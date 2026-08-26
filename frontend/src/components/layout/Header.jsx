/**
 * Barra superior: menú, nombre del negocio, perfil y carrito.
 */
import { useTienda } from "../../context/TiendaContext";
import { Menu, ShoppingCart, Store, User } from "../../icons";

export default function Header() {
  const {
    esAdmin,
    irA,
    irACheckout,
    negocioNombre,
    sesion,
    setDrawerOpen,
    totalItems,
  } = useTienda();

  // El nombre del negocio llega con la hidratación; hasta entonces, o sin
  // sesión, se enseña el de la aplicación.
  const titulo = negocioNombre.trim() || sesion?.nombreTienda?.trim() || "Pedidos Tienda";

  return (
    <header style={{ background: "var(--headerBg)", color: "var(--headerInk)" }} className="px-4 py-4 relative z-10">
      <div className="max-w-3xl mx-auto flex items-center justify-between">
        {sesion ? (
          <button onClick={() => setDrawerOpen(true)} className="p-1.5 -ml-1.5 rounded-lg" aria-label="Abrir menú">
            <Menu size={24} />
          </button>
        ) : (
          <span className="w-8" />
        )}
        <div className="flex items-center gap-2">
          <Store size={19} style={{ color: "var(--primary)" }} />
          <span className="font-display text-lg tracking-tight truncate max-w-[55vw]">{titulo}</span>
        </div>
        <div className="flex items-center gap-3">
          {esAdmin && (
            <button onClick={() => irA("perfil")} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "var(--card)", border: "1px solid var(--border)" }} aria-label="Mi perfil">
              <User size={17} />
            </button>
          )}
          <button onClick={irACheckout} className="relative" aria-label="Carrito">
            <ShoppingCart size={22} />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center"
                style={{ background: "var(--primary)", color: "#fff" }}>{totalItems}</span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
