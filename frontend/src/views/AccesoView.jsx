/**
 * Puerta de entrada al sistema, antes de estar dentro de ninguna tienda.
 *
 * Todo empieza en un solo campo, donde se escribe el ID de la tienda (para
 * comprar) o el WhatsApp del dueño (para administrarla). El servidor dice cuál
 * de los dos es y la pantalla sigue por un camino u otro:
 *
 * - **ID de negocio** -> entra directo como cliente, sin pedir nada más.
 * - **Teléfono conocido** -> pide la contraseña.
 * - **Número desconocido** -> el alta: se escribe por WhatsApp, llega un código
 *   y con ese código quedan hechas la cuenta y la tienda.
 *
 * El código lo manda n8n. Mientras esa parte se termina, el servidor usa uno
 * fijo y lo devuelve fuera de producción, que es lo que se enseña abajo como
 * "código de prueba".
 *
 * La identificación del comprador *dentro* de una tienda es otra pantalla:
 * [IdentificacionView](./IdentificacionView.jsx).
 */
import { useState } from "react";

import FondoMarca from "../components/layout/FondoMarca";
import { useTienda } from "../context/TiendaContext";
import { MARCA, MENSAJE_ALTA, WHATSAPP_ALTAS } from "../config/marca";
import { AlertCircle, Check, Lock, MessageCircle, Phone, Store } from "../icons";

/** El chat con el mensaje de interés ya escrito. */
const ENLACE_WHATSAPP = `https://wa.me/${WHATSAPP_ALTAS}?text=${encodeURIComponent(MENSAJE_ALTA)}`;

function Campo({ etiqueta, icono: Icono, ...props }) {
  return (
    <div>
      <label className="text-xs font-semibold flex items-center gap-1.5 mb-1.5" style={{ color: MARCA.texto }}>
        <Icono size={13} /> {etiqueta}
      </label>
      <input
        {...props}
        className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
        style={{ background: MARCA.campo, border: `1px solid ${MARCA.campoBorde}`, color: MARCA.texto }}
      />
    </div>
  );
}

function Boton({ children, color = MARCA.azul, ...props }) {
  return (
    <button
      {...props}
      className="w-full rounded-lg px-3 py-2.5 text-sm font-semibold disabled:opacity-50"
      style={{ background: color, color: "#FFFFFF" }}
    >
      {children}
    </button>
  );
}

/** Acción de segunda fila: va sobre el fondo oscuro, debajo de la tarjeta. */
function EnlaceOscuro({ children, ...props }) {
  return (
    <button {...props} className="w-full text-center text-sm py-1.5" style={{ color: MARCA.tinta }}>
      {children}
    </button>
  );
}

function Aviso({ children, color = MARCA.error, icono: Icono = AlertCircle }) {
  return (
    <div
      className="rounded-lg px-3 py-2.5 flex items-start gap-2 text-sm"
      style={{ background: MARCA.campo, border: `1px solid ${color}`, color }}
    >
      <Icono size={16} className="shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  );
}

/** Texto explicativo dentro de la tarjeta, sin color de alarma. */
function Nota({ children }) {
  return (
    <div
      className="rounded-lg px-3 py-2.5 text-sm"
      style={{ background: MARCA.campo, border: `1px solid ${MARCA.tarjetaBorde}`, color: MARCA.textoSuave }}
    >
      {children}
    </div>
  );
}

function Tarjeta({ children }) {
  return (
    <div
      className="rounded-2xl p-4 space-y-3"
      style={{ background: MARCA.tarjeta, border: `1px solid ${MARCA.tarjetaBorde}`, color: MARCA.texto }}
    >
      {children}
    </div>
  );
}

export default function AccesoView() {
  const {
    activarCuenta,
    entrarComoAdmin,
    entrarComoCliente,
    entrarConSesionAdmin,
    resolverAcceso,
    sesionMsg,
    solicitarCodigo,
  } = useTienda();

  // acceso -> alta -> codigo -> activada
  const [etapa, setEtapa] = useState("acceso");

  const [valor, setValor] = useState("");
  const [tipo, setTipo] = useState(null); // null | "duenio" | "desconocido"
  const [password, setPassword] = useState("");

  const [telAlta, setTelAlta] = useState("");
  const [codigo, setCodigo] = useState("");
  const [envio, setEnvio] = useState(null); // lo que contestó el servidor al pedir el código
  const [cuentaNueva, setCuentaNueva] = useState(null); // sesión recién creada, aún sin aplicar

  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  /** Cada vez que cambia lo escrito volvemos a empezar: lo resuelto ya no vale. */
  function escribir(texto) {
    setValor(texto);
    setTipo(null);
    setError("");
  }

  /** Corre una acción de red enseñando el error si lo hay. */
  async function intentar(accion) {
    if (cargando) return;
    setCargando(true);
    setError("");
    try {
      await accion();
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  function irAlAlta(telefono) {
    setTelAlta(telefono);
    setCodigo("");
    setEnvio(null);
    setError("");
    setEtapa("alta");
  }

  const resolver = () =>
    intentar(async () => {
      const texto = valor.trim();
      if (!texto) return;

      const r = await resolverAcceso(texto);
      if (r.tipo === "negocio") {
        entrarComoCliente(r); // el modo cliente no pide nada más
        return;
      }
      setTipo(r.tipo);
      // Un número que no conocemos es, casi siempre, alguien que viene a abrir
      // su tienda: se le lleva directo al alta.
      if (r.tipo === "desconocido") irAlAlta(texto);
    });

  const entrar = () => intentar(() => entrarComoAdmin(valor.trim(), password));

  const pedirCodigo = () =>
    intentar(async () => {
      const r = await solicitarCodigo(telAlta.trim());
      setEnvio(r);
      setCodigo("");
      setEtapa("codigo");
    });

  const confirmarCodigo = () =>
    intentar(async () => {
      const r = await activarCuenta({ telefono: telAlta.trim(), codigo: codigo.trim() });
      setCuentaNueva(r);
      setEtapa("activada");
    });

  const alPulsarEnter = (e, accion) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    accion();
  };

  return (
    <FondoMarca>
      <div className="flex-1 flex flex-col justify-center px-6 py-10">
        <div className="w-full max-w-sm mx-auto">
          {sesionMsg && (
            <p className="text-xs mb-4 flex items-center gap-1.5" style={{ color: MARCA.tintaSuave }}>
              <Check size={13} /> {sesionMsg}
            </p>
          )}

          {etapa === "acceso" && (
            <>
              <p className="text-sm mb-4" style={{ color: MARCA.tintaSuave }}>
                Escribe el ID de la tienda para comprar, o tu número de WhatsApp si eres el dueño.
              </p>

              <Tarjeta>
                <Campo
                  etiqueta="Teléfono de WhatsApp o ID del negocio"
                  icono={Store}
                  value={valor}
                  onChange={(e) => escribir(e.target.value)}
                  onBlur={resolver}
                  onKeyDown={(e) => alPulsarEnter(e, () => e.currentTarget.blur())}
                  placeholder="Ej: 482913 o 9211455847"
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

                {error && <Aviso>{error}</Aviso>}
              </Tarjeta>

              <div className="mt-6">
                <EnlaceOscuro onClick={() => irAlAlta(valor.trim())}>No tengo cuenta</EnlaceOscuro>
              </div>
            </>
          )}

          {etapa === "alta" && (
            <>
              <p className="text-sm mb-4" style={{ color: MARCA.tintaSuave }}>
                Para abrir tu tienda escríbenos por WhatsApp y te mandamos un código de activación.
              </p>

              <Tarjeta>
                {tipo === "desconocido" && (
                  <Nota>No encontramos ninguna tienda con eso. Si es tu número, puedes crear la tuya ahora.</Nota>
                )}

                <a
                  href={ENLACE_WHATSAPP}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full rounded-lg px-3 py-2.5 text-sm font-semibold flex items-center justify-center gap-2"
                  style={{ background: MARCA.whatsapp, color: "#0B2E19" }}
                >
                  <MessageCircle size={16} /> Escribir por WhatsApp
                </a>

                <Campo
                  etiqueta="Tu número de WhatsApp"
                  icono={Phone}
                  value={telAlta}
                  onChange={(e) => { setTelAlta(e.target.value); setError(""); }}
                  onKeyDown={(e) => alPulsarEnter(e, pedirCodigo)}
                  placeholder="Ej: 9211455847"
                  autoFocus
                />

                <Boton onClick={pedirCodigo} disabled={cargando || !telAlta.trim()}>
                  {cargando ? "Enviando…" : "Activar cuenta"}
                </Boton>

                {error && <Aviso>{error}</Aviso>}
              </Tarjeta>

              <div className="mt-6">
                <EnlaceOscuro onClick={() => { setEtapa("acceso"); setError(""); }}>Ya tengo cuenta</EnlaceOscuro>
              </div>
            </>
          )}

          {etapa === "codigo" && (
            <>
              <p className="text-sm mb-4" style={{ color: MARCA.tintaSuave }}>
                Te mandamos un código al <span className="font-semibold" style={{ color: MARCA.tinta }}>{telAlta}</span>.
                {envio?.minutosVigencia ? ` Vale ${envio.minutosVigencia} minutos.` : ""}
              </p>

              <Tarjeta>
                <Campo
                  etiqueta="Ingresa el código"
                  icono={Lock}
                  inputMode="numeric"
                  value={codigo}
                  onChange={(e) => { setCodigo(e.target.value); setError(""); }}
                  onKeyDown={(e) => alPulsarEnter(e, confirmarCodigo)}
                  placeholder="Ej: 123"
                  autoFocus
                />

                <Boton onClick={confirmarCodigo} disabled={cargando || !codigo.trim()}>
                  {cargando ? "Activando…" : "Confirmar código"}
                </Boton>

                {envio?.codigoDePrueba && (
                  <Nota>
                    Modo de prueba: el código es{" "}
                    <span className="font-semibold" style={{ color: MARCA.texto }}>{envio.codigoDePrueba}</span>.
                  </Nota>
                )}

                {error && <Aviso>{error}</Aviso>}
              </Tarjeta>

              <div className="mt-6 space-y-1">
                <EnlaceOscuro onClick={pedirCodigo} disabled={cargando}>Reenviar código</EnlaceOscuro>
                <EnlaceOscuro onClick={() => { setEtapa("alta"); setError(""); }}>Cambiar de número</EnlaceOscuro>
              </div>
            </>
          )}

          {etapa === "activada" && cuentaNueva && (
            <>
              <p className="text-sm mb-4" style={{ color: MARCA.tintaSuave }}>
                Listo, tu tienda ya existe.
              </p>

              <Tarjeta>
                <Aviso color={MARCA.ok} icono={Check}>
                  ¡Cuenta activada! El ID de tu tienda es{" "}
                  <span className="font-semibold">{cuentaNueva.idNegocio}</span>: es lo que van a escribir tus
                  clientes para entrar.
                </Aviso>

                <Nota>
                  Por ahora tu contraseña es el mismo código que acabas de usar. Cámbiala, y ponle nombre a la
                  tienda, desde <span className="font-semibold" style={{ color: MARCA.texto }}>Mi perfil</span>.
                </Nota>

                <Boton onClick={() => entrarConSesionAdmin(cuentaNueva)}>Entrar a mi tienda</Boton>
              </Tarjeta>
            </>
          )}
        </div>
      </div>
    </FondoMarca>
  );
}
