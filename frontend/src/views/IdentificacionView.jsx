/**
 * Puerta de entrada de la tienda: el cliente se identifica con su teléfono.
 * Si el número ya compró antes entra solo; si es nuevo, se le pide el nombre.
 */
import { useTienda } from "../context/TiendaContext";
import { digits } from "../lib/format";
import { Phone, User, UserCheck } from "../icons";

export default function IdentificacionView() {
  const {
    intentarActivarNuevo,
    matchCliente,
    nombreForm,
    setNombreForm,
    setTelForm,
    telForm,
  } = useTienda();

  return (
    <div className="max-w-sm mx-auto pt-4">
      <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>Escribe tu número de WhatsApp para identificarte.</p>

      <div className="rounded-2xl p-4 space-y-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div>
          <label className="text-xs font-semibold flex items-center gap-1.5 mb-1.5"><Phone size={13} /> Teléfono (WhatsApp, con indicativo)</label>
          <input value={telForm} onChange={(e) => setTelForm(e.target.value)} placeholder="Ej: 573001234567"
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
            style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink)" }} />
        </div>

        {digits(telForm).length >= 7 && matchCliente && (
          <div className="rounded-lg px-3 py-2.5 flex items-center gap-2" style={{ background: "var(--bg)", border: "1px solid var(--primary)" }}>
            <UserCheck size={16} style={{ color: "var(--primary)" }} />
            <p className="text-sm">¡Hola de nuevo, <span className="font-semibold">{matchCliente.nombre}</span>!</p>
          </div>
        )}

        {digits(telForm).length >= 7 && !matchCliente && (
          <div>
            <label className="text-xs font-semibold flex items-center gap-1.5 mb-1.5"><User size={13} /> Nombre (cliente nuevo)</label>
            <input value={nombreForm} onChange={(e) => setNombreForm(e.target.value)}
              onBlur={intentarActivarNuevo}
              onKeyDown={(e) => { if (e.key === "Enter") { e.currentTarget.blur(); intentarActivarNuevo(); } }}
              placeholder="Ej: María Torres"
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
              style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink)" }} />
            <p className="text-[11px] mt-1.5" style={{ color: "var(--muted)" }}>Al terminar de escribir tu nombre entras directo a la tienda.</p>
          </div>
        )}
      </div>

    </div>
  );
}
