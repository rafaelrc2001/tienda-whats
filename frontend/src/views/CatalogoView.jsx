/**
 * Vitrina de productos agrupados por categoría, con los controles del carrito.
 */
import { useTienda } from "../context/TiendaContext";
import { money } from "../lib/format";
import { iconForCategoria, paletteForCategoria } from "../lib/productos";
import { Minus, Package, Plus } from "../icons";

export default function CatalogoView() {
  const {
    cambiarCantidad,
    cambiarIdentidad,
    cart,
    categorias,
    clienteActivo,
    irA,
    productos,
  } = useTienda();

  return (
    <div>
      <h1 className="font-display text-3xl mb-1">Tienda</h1>
      <p className="text-xs mb-6" style={{ color: "var(--muted)" }}>
        Pedido para <span className="font-semibold">{clienteActivo.nombre}</span> · {clienteActivo.telefono}{" "}
        <button onClick={cambiarIdentidad} className="underline" style={{ color: "var(--primary)" }}>cambiar</button>
      </p>

      {productos.filter((p) => p.producto.trim()).length === 0 && (
        <div className="rounded-2xl p-8 text-center" style={{ background: "var(--card)", border: "1px dashed var(--border)" }}>
          <Package size={26} className="mx-auto mb-2" style={{ color: "var(--muted)" }} />
          <p className="text-sm font-semibold mb-1">Todavía no hay productos</p>
          <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>Ve a Productos y adjunta tu Excel para armar el catálogo.</p>
          <button onClick={() => irA("productos")} className="text-xs font-semibold px-4 py-2 rounded-lg" style={{ background: "var(--primary)", color: "#fff" }}>
            Ir a Productos
          </button>
        </div>
      )}

      {categorias.map(([cat, items]) => {
        const CatIcon = iconForCategoria(cat);
        return (
          <section key={cat} className="mb-8">
            <h2 className="font-display text-lg mb-3 flex items-center gap-2">
              <CatIcon size={17} style={{ color: "var(--primary)" }} /> {cat}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {items.map((p) => {
                const pal = paletteForCategoria(cat);
                const ProdIcon = iconForCategoria(cat);
                const cant = cart[p.id]?.cantidad || 0;
                return (
                  <div key={p.id} className="relative ticket-notch rounded-xl overflow-hidden flex flex-col"
                    style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                    {p.imagen ? (
                      <img src={p.imagen} alt={p.producto} className="h-20 w-full object-cover" />
                    ) : (
                      <div style={{ background: pal.bg }} className="h-20 flex items-center justify-center">
                        <ProdIcon size={30} style={{ color: pal.ink }} />
                      </div>
                    )}
                    <div style={{ borderTop: "1px dashed var(--border)" }} />
                    <div className="p-2.5 flex flex-col gap-1.5 flex-1">
                      <div className="min-h-[2.2em]">
                        <p className="text-xs font-semibold leading-tight line-clamp-2">{p.producto}</p>
                        {p.marca && <p className="text-[10px] leading-tight" style={{ color: "var(--muted)" }}>{p.marca}</p>}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono-price text-sm font-semibold">{money(p.precioVenta)}</span>
                        <span className="text-[10px]" style={{ color: "var(--muted)" }}>/{p.unidad}</span>
                      </div>
                      <div className="mt-auto flex items-center justify-between pt-1.5">
                        <button onClick={() => cambiarCantidad(p, -1)} disabled={cant === 0}
                          className="w-6 h-6 rounded-full flex items-center justify-center disabled:opacity-30"
                          style={{ border: "1px solid var(--border)" }}>
                          <Minus size={12} />
                        </button>
                        <span className="font-mono-price text-sm w-5 text-center">{cant}</span>
                        <button onClick={() => cambiarCantidad(p, 1)}
                          className="w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ background: "var(--primary)", color: "#fff" }}>
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
