/**
 * Barra flotante con el total del carrito; solo aparece en la tienda con productos dentro.
 */
import { useTienda } from "../../context/TiendaContext";
import { money } from "../../lib/format";
import { ChevronRight, ShoppingCart, Trash2 } from "../../icons";

export default function BarraCarrito() {
  const {
    clienteActivo,
    irACheckout,
    totalItems,
    totalPedido,
    vaciarCarrito,
    view,
  } = useTienda();

  if (view !== "catalogo" || !clienteActivo || totalItems === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 px-5 py-3.5 z-10" style={{ background: "var(--headerBg)", color: "var(--headerInk)", borderTop: "1px solid var(--border)" }}>
      <div className="max-w-3xl mx-auto flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm min-w-0">
          <ShoppingCart size={17} style={{ color: "var(--primary)", flexShrink: 0 }} />
          <span className="whitespace-nowrap">{totalItems} {totalItems === 1 ? "producto" : "productos"}</span>
          <span className="font-mono-price font-semibold whitespace-nowrap">{money(totalPedido)}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={vaciarCarrito} className="text-xs font-semibold px-2.5 py-2 rounded-lg flex items-center gap-1"
            style={{ border: "1px solid var(--border)", color: "var(--headerInk)" }}>
            <Trash2 size={13} /> Vaciar
          </button>
          <button onClick={irACheckout} className="text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5"
            style={{ background: "var(--primary)", color: "#fff" }}>
            Comprar ahora <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
