/**
 * Barra superior: menú, nombre del negocio, perfil y carrito.
 */
import { useTienda } from "../../context/TiendaContext";
import { Menu, ShoppingCart, Store, User } from "../../icons";

export default function Header() {
  const {
    irA,
    irACheckout,
    negocioNombre,
    setDrawerOpen,
    totalItems,
  } = useTienda();

  return (
    <header style={{ background: "var(--headerBg)", color: "var(--headerInk)" }} className="px-4 py-4 relative z-10">
      <div className="max-w-3xl mx-auto flex items-center justify-between">
        <button onClick={() => setDrawerOpen(true)} className="p-1.5 -ml-1.5 rounded-lg" aria-label="Abrir menú">
          <Menu size={24} />
        </button>
        <div className="flex items-center gap-2">
          <Store size={19} style={{ color: "var(--primary)" }} />
          <span className="font-display text-lg tracking-tight truncate max-w-[55vw]">{negocioNombre.trim() || "Pedidos Tienda"}</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => irA("perfil")} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "var(--card)", border: "1px solid var(--border)" }} aria-label="Mi perfil">
            <User size={17} />
          </button>
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
