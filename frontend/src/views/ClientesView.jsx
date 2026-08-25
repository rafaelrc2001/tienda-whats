/**
 * Base de clientes, derivada de los pedidos ya confirmados.
 */
import { useTienda } from "../context/TiendaContext";
import { digits, money } from "../lib/format";
import { Users } from "../icons";

export default function ClientesView() {
  const {
    clientesDB,
  } = useTienda();

  return (
    <div className="max-w-md mx-auto">
      <h1 className="font-display text-3xl mb-2">Clientes</h1>
      <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>Se guarda un cliente automáticamente cada vez que termina un pedido.</p>

      {clientesDB.length === 0 ? (
        <div className="rounded-2xl p-8 text-center" style={{ background: "var(--card)", border: "1px dashed var(--border)" }}>
          <Users size={26} className="mx-auto mb-2" style={{ color: "var(--muted)" }} />
          <p className="text-sm font-semibold">Aún no hay clientes registrados</p>
        </div>
      ) : (
        <div className="space-y-2">
          {clientesDB.map((c) => (
            <div key={digits(c.telefono)} className="rounded-lg p-3 text-xs" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between mb-1">
                <p className="font-semibold text-sm">{c.nombre}</p>
                <span className="font-mono-price font-semibold">{money(c.total)}</span>
              </div>
              <p style={{ color: "var(--muted)" }}>{c.telefono} · {c.pedidos} pedido(s) · última compra {c.ultimaFecha}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
