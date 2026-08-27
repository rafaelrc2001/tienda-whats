/**
 * El comprador se identifica dentro de una tienda ya abierta.
 *
 * Se pide el teléfono y nada más: si ya compró antes entra solo, y si es nuevo
 * se le pide el nombre y entra al terminar de escribirlo. No hay botón porque no
 * hay nada que confirmar.
 *
 * Elegir *qué* tienda se abre es la pantalla de antes:
 * [AccesoView](./AccesoView.jsx).
 */
import { useTienda } from "../context/TiendaContext";
import { digits } from "../lib/format";
import { Phone, User, UserCheck } from "../icons";

const ESTILO_CAJA = { background: "var(--card)", border: "1px solid var(--border)" };
const ESTILO_CAMPO = { border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink)" };

function Campo({ etiqueta, icono: Icono, ...props }) {
  return (
    <div>
      <label className="text-xs font-semibold flex items-center gap-1.5 mb-1.5">
        <Icono size={13} /> {etiqueta}
      </label>
      <input {...props} className="w-full rounded-lg px-3 py-2.5 text-sm outline-none" style={ESTILO_CAMPO} />
    </div>
  );
}

export default function IdentificacionView() {
  const {
    intentarActivarNuevo,
    matchCliente,
    nombreForm,
    sesion,
    setNombreForm,
    setTelForm,
    telForm,
  } = useTienda();

  const suficiente = digits(telForm).length >= 7;

  return (
    <div className="max-w-sm mx-auto pt-4">
      <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
        Estás en <span className="font-semibold" style={{ color: "var(--ink)" }}>{sesion.nombreTienda}</span>.
        Escribe tu número de WhatsApp para identificarte.
      </p>

      <div className="rounded-2xl p-4 space-y-3" style={ESTILO_CAJA}>
        <Campo
          etiqueta="Teléfono (WhatsApp, con indicativo)"
          icono={Phone}
          value={telForm}
          onChange={(e) => setTelForm(e.target.value)}
          placeholder="Ej: 573001234567"
        />

        {suficiente && matchCliente && (
          <div className="rounded-lg px-3 py-2.5 flex items-center gap-2" style={{ background: "var(--bg)", border: "1px solid var(--primary)" }}>
            <UserCheck size={16} style={{ color: "var(--primary)" }} />
            <p className="text-sm">¡Hola de nuevo, <span className="font-semibold">{matchCliente.nombre}</span>!</p>
          </div>
        )}

        {suficiente && !matchCliente && (
          <div>
            <Campo
              etiqueta="Nombre (cliente nuevo)"
              icono={User}
              value={nombreForm}
              onChange={(e) => setNombreForm(e.target.value)}
              onBlur={intentarActivarNuevo}
              onKeyDown={(e) => { if (e.key === "Enter") { e.currentTarget.blur(); intentarActivarNuevo(); } }}
              placeholder="Ej: María Torres"
            />
            <p className="text-[11px] mt-1.5" style={{ color: "var(--muted)" }}>
              Al terminar de escribir tu nombre entras directo a la tienda.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
