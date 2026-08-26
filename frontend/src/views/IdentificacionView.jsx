/**
 * Puerta de entrada, en dos etapas.
 *
 * 1. **Sin sesión**: un único campo donde se escribe el teléfono de WhatsApp del
 *    dueño o el ID del negocio. El servidor dice cuál de los dos es y la
 *    pantalla se adapta: pide contraseña, entra como cliente, o propone crear
 *    una tienda nueva si no reconoce nada.
 * 2. **Ya dentro de una tienda**: el comprador se identifica con su teléfono,
 *    igual que siempre. Si ya compró antes entra solo; si es nuevo, se le pide
 *    el nombre.
 */
import { useState } from "react";

import { useTienda } from "../context/TiendaContext";
import { digits } from "../lib/format";
import { AlertCircle, Lock, Phone, Store, User, UserCheck } from "../icons";

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

function Aviso({ children }) {
  return (
    <div className="rounded-lg px-3 py-2.5 flex items-start gap-2 text-sm" style={{ background: "var(--bg)", border: "1px solid #B14A3A", color: "#B14A3A" }}>
      <AlertCircle size={16} className="shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  );
}

function Boton({ children, ...props }) {
  return (
    <button
      {...props}
      className="w-full rounded-lg px-3 py-2.5 text-sm font-semibold disabled:opacity-60"
      style={{ background: "var(--primary)", color: "var(--accentInk)" }}
    >
      {children}
    </button>
  );
}

/** Etapa 1: elegir tienda y modo de entrada. */
function Acceso() {
  const { entrarComoAdmin, entrarComoCliente, registrarTienda, resolverAcceso } = useTienda();

  const [valor, setValor] = useState("");
  const [tipo, setTipo] = useState(null); // null | "duenio" | "negocio" | "desconocido"
  const [password, setPassword] = useState("");
  const [nombreTienda, setNombreTienda] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  /** Cada vez que cambia lo escrito volvemos a empezar: lo resuelto ya no vale. */
  function escribir(texto) {
    setValor(texto);
    setTipo(null);
    setError("");
  }

  async function resolver() {
    const texto = valor.trim();
    if (!texto || cargando) return;
    setCargando(true);
    setError("");
    try {
      const r = await resolverAcceso(texto);
      if (r.tipo === "negocio") {
        entrarComoCliente(r); // entra directo: el modo cliente no pide nada más
        return;
      }
      setTipo(r.tipo);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  async function intentar(accion) {
    if (cargando) return;
    setCargando(true);
    setError("");
    try {
      await accion();
    } catch (err) {
      setError(err.message);
      setCargando(false);
    }
  }

  const entrar = () => intentar(() => entrarComoAdmin(valor.trim(), password));
  const crear = () =>
    intentar(() => registrarTienda({ telefono: valor.trim(), password, nombreTienda }));

  const alPulsarEnter = (e, accion) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    accion();
  };

  return (
    <div className="max-w-sm mx-auto pt-4">
      <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
        Escribe el ID de la tienda para comprar, o tu número de WhatsApp si eres el dueño.
      </p>

      <div className="rounded-2xl p-4 space-y-3" style={ESTILO_CAJA}>
        <Campo
          etiqueta="Teléfono de WhatsApp o ID del negocio"
          icono={Store}
          value={valor}
          onChange={(e) => escribir(e.target.value)}
          onBlur={resolver}
          onKeyDown={(e) => alPulsarEnter(e, () => e.currentTarget.blur())}
          placeholder="Ej: 482913 o 573001234567"
          autoFocus
        />

        {tipo === "duenio" && (
          <>
            <Campo
              etiqueta="Contraseña"
              icono={Lock}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => alPulsarEnter(e, entrar)}
              placeholder="Tu contraseña"
              autoFocus
            />
            <Boton onClick={entrar} disabled={cargando || !password}>
              {cargando ? "Entrando…" : "Entrar como administrador"}
            </Boton>
          </>
        )}

        {tipo === "desconocido" && (
          <>
            <div className="rounded-lg px-3 py-2.5 text-sm" style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--muted)" }}>
              No encontramos ninguna tienda con eso. Si es tu número de WhatsApp, puedes crear la tuya ahora.
            </div>
            <Campo
              etiqueta="Nombre de la tienda"
              icono={Store}
              value={nombreTienda}
              onChange={(e) => setNombreTienda(e.target.value)}
              placeholder="Ej: Abarrotes María"
            />
            <Campo
              etiqueta="Contraseña"
              icono={Lock}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => alPulsarEnter(e, crear)}
              placeholder="Mínimo 4 caracteres"
            />
            <Boton onClick={crear} disabled={cargando || !nombreTienda.trim() || !password}>
              {cargando ? "Creando…" : "Crear mi tienda"}
            </Boton>
          </>
        )}

        {error && <Aviso>{error}</Aviso>}
      </div>
    </div>
  );
}

/** Etapa 2: el comprador se identifica dentro de la tienda. */
function IdentificacionComprador() {
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

export default function IdentificacionView() {
  const { sesion } = useTienda();
  return sesion ? <IdentificacionComprador /> : <Acceso />;
}
