/**
 * Configuración del negocio: cuenta, identidad, ubicación, datos bancarios,
 * horario y tema.
 */
import { useEffect, useState } from "react";

import { useTienda } from "../context/TiendaContext";
import { copiarTexto } from "../lib/clipboard";
import { DIAS, estaEnHorario, proximaAtencion } from "../lib/horario";
import { ICONO_SKIN, SKINS } from "../config/skins";
import { AlertCircle, Check, Clock, Copy, ImageIcon, Landmark, Lock, MapPin, Percent, Store, User } from "../icons";

const ESTILO_CAMPO = { border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink)" };
const ESTILO_CAJA = { background: "var(--card)", border: "1px solid var(--border)" };

function CampoCuenta({ etiqueta, ayuda, ...props }) {
  return (
    <div>
      <label className="text-[10px] font-semibold block mb-1" style={{ color: "var(--muted)" }}>{etiqueta}</label>
      <input {...props} className="w-full rounded-lg px-3 py-2.5 text-sm outline-none" style={ESTILO_CAMPO} />
      {ayuda && <p className="text-[11px] mt-1" style={{ color: "var(--muted)" }}>{ayuda}</p>}
    </div>
  );
}

/**
 * Datos de acceso del dueño.
 *
 * El nombre y el teléfono se guardan aquí y el servidor los refleja también en
 * la configuración del negocio: para el dueño son un solo dato. El ID del
 * negocio, en cambio, no se toca nunca — es lo que sus clientes tienen apuntado.
 */
function MiCuenta() {
  const { actualizarCuenta, negocioNombre, negocioTelefono, sesion } = useTienda();

  const [nombre, setNombre] = useState(negocioNombre);
  const [telefono, setTelefono] = useState(negocioTelefono);
  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [estado, setEstado] = useState({ error: "", ok: "" });
  const [guardando, setGuardando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  // los datos llegan con la hidratación, después del primer render
  useEffect(() => setNombre(negocioNombre), [negocioNombre]);
  useEffect(() => setTelefono(negocioTelefono), [negocioTelefono]);

  function copiarId() {
    copiarTexto(sesion.idNegocio).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  }

  async function guardar() {
    if (guardando) return;
    setGuardando(true);
    setEstado({ error: "", ok: "" });
    try {
      await actualizarCuenta({
        nombreTienda: nombre,
        telefono,
        ...(passwordNueva ? { passwordActual, passwordNueva } : {}),
      });
      setPasswordActual("");
      setPasswordNueva("");
      setEstado({ error: "", ok: "Datos guardados." });
    } catch (err) {
      setEstado({ error: err.message, ok: "" });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="rounded-2xl p-4 mb-6 space-y-3" style={ESTILO_CAJA}>
      <p className="text-xs font-semibold flex items-center gap-1.5"><User size={13} /> Mi cuenta</p>

      <div>
        <label className="text-[10px] font-semibold block mb-1" style={{ color: "var(--muted)" }}>ID del negocio</label>
        <div className="rounded-lg px-3 py-2.5 flex items-center justify-between gap-2" style={ESTILO_CAMPO}>
          <span className="text-sm font-semibold truncate">{sesion.idNegocio}</span>
          <button onClick={copiarId} className="text-[11px] font-semibold flex items-center gap-1 flex-shrink-0" style={{ color: "var(--primary)" }}>
            {copiado ? <><Check size={13} /> Copiado</> : <><Copy size={13} /> Copiar</>}
          </button>
        </div>
        <p className="text-[11px] mt-1" style={{ color: "var(--muted)" }}>
          Es lo que tus clientes escriben para entrar a tu tienda. No cambia aunque le cambies el nombre.
        </p>
      </div>

      <CampoCuenta
        etiqueta="Nombre de la tienda"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder="Ej: Abarrotes La Esquina"
      />

      <CampoCuenta
        etiqueta="Teléfono de WhatsApp"
        value={telefono}
        onChange={(e) => setTelefono(e.target.value)}
        placeholder="Ej: 573001234567"
        ayuda="Es tu usuario para entrar y el número al que llegan los pedidos."
      />

      <div className="pt-1 space-y-3" style={{ borderTop: "1px solid var(--border)" }}>
        <p className="text-[10px] font-semibold flex items-center gap-1.5 pt-2" style={{ color: "var(--muted)" }}>
          <Lock size={12} /> Cambiar contraseña (déjalo vacío si no quieres cambiarla)
        </p>
        <CampoCuenta
          etiqueta="Contraseña actual"
          type="password"
          value={passwordActual}
          onChange={(e) => setPasswordActual(e.target.value)}
          placeholder="Tu contraseña de ahora"
        />
        <CampoCuenta
          etiqueta="Contraseña nueva"
          type="password"
          value={passwordNueva}
          onChange={(e) => setPasswordNueva(e.target.value)}
          placeholder="Mínimo 4 caracteres"
        />
      </div>

      {estado.error && (
        <p className="text-xs flex items-center gap-1.5" style={{ color: "#B14A3A" }}><AlertCircle size={13} /> {estado.error}</p>
      )}
      {estado.ok && (
        <p className="text-xs flex items-center gap-1.5" style={{ color: "var(--primary)" }}><Check size={13} /> {estado.ok}</p>
      )}

      <button
        onClick={guardar}
        disabled={guardando || !nombre.trim() || !telefono.trim()}
        className="w-full rounded-lg px-3 py-2.5 text-sm font-semibold disabled:opacity-60"
        style={{ background: "var(--primary)", color: "var(--accentInk)" }}
      >
        {guardando ? "Guardando…" : "Guardar cambios"}
      </button>
    </div>
  );
}

export default function PerfilView() {
  const {
    bancoBeneficiario,
    bancoNombre,
    bancoNumeroCuenta,
    copiadoCuenta,
    copiarNumeroCuenta,
    horario,
    negocioUbicacion,
    obtenerUbicacionGPS,
    setBancoBeneficiario,
    setBancoNombre,
    setBancoNumeroCuenta,
    setHorario,
    setSkinId,
    skinId,
    ubicacionCargando,
    ubicacionError,
  } = useTienda();

  return (
    <div className="max-w-md mx-auto">
      <h1 className="font-display text-3xl mb-2">Mi perfil</h1>
      <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>Tus datos y la apariencia de la app.</p>

      <MiCuenta />

      <div className="rounded-2xl p-4 mb-6 space-y-3" style={ESTILO_CAJA}>
        <p className="text-xs font-semibold flex items-center gap-1.5"><Store size={13} /> Datos del negocio</p>

        <div>
          <label className="text-[10px] font-semibold block mb-1" style={{ color: "var(--muted)" }}>Ubicación del negocio</label>
          {negocioUbicacion ? (
            <div className="rounded-lg px-3 py-2.5 flex items-center justify-between" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              <p className="text-xs font-mono-price">{negocioUbicacion.lat.toFixed(5)}, {negocioUbicacion.lng.toFixed(5)}</p>
              <a href={`https://www.google.com/maps?q=${negocioUbicacion.lat},${negocioUbicacion.lng}`} target="_blank" rel="noreferrer"
                className="text-[11px] font-semibold underline flex-shrink-0" style={{ color: "var(--primary)" }}>Ver en el mapa</a>
            </div>
          ) : (
            <button onClick={obtenerUbicacionGPS} disabled={ubicacionCargando}
              className="w-full rounded-lg py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5"
              style={{ border: "1px solid var(--border)", color: "var(--ink)" }}>
              <MapPin size={13} /> {ubicacionCargando ? "Obteniendo ubicación..." : "Obtener ubicación GPS"}
            </button>
          )}
          {negocioUbicacion && (
            <button onClick={obtenerUbicacionGPS} className="text-[11px] font-semibold mt-1.5" style={{ color: "var(--muted)" }}>Actualizar ubicación</button>
          )}
          {ubicacionError && (
            <p className="text-xs mt-1.5 flex items-center gap-1.5" style={{ color: "#B14A3A" }}><AlertCircle size={13} /> {ubicacionError}</p>
          )}
        </div>
      </div>

      <div className="rounded-2xl p-4 mb-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <p className="text-xs font-semibold flex items-center gap-1.5 mb-3"><Clock size={13} /> Horario de servicio</p>

        <p className="text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted)" }}>Días con servicio</p>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {DIAS.map((d) => {
            const activo = horario.dias[d.key];
            return (
              <button key={d.key}
                onClick={() => setHorario((h) => ({ ...h, dias: { ...h.dias, [d.key]: !h.dias[d.key] } }))}
                className="w-10 h-9 rounded-lg text-xs font-semibold"
                style={activo ? { background: "var(--primary)", color: "#fff" } : { border: "1px solid var(--border)", color: "var(--muted)" }}>
                {d.label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <label className="text-[10px] font-semibold block mb-1" style={{ color: "var(--muted)" }}>Abre</label>
            <input type="time" value={horario.apertura} onChange={(e) => setHorario((h) => ({ ...h, apertura: e.target.value }))}
              className="w-full rounded-lg px-2 py-2 text-sm outline-none" style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink)" }} />
          </div>
          <div>
            <label className="text-[10px] font-semibold block mb-1" style={{ color: "var(--muted)" }}>Cierra</label>
            <input type="time" value={horario.cierre} onChange={(e) => setHorario((h) => ({ ...h, cierre: e.target.value }))}
              className="w-full rounded-lg px-2 py-2 text-sm outline-none" style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink)" }} />
          </div>
        </div>

        <p className="text-xs mb-3 flex items-center gap-1.5" style={estaEnHorario(horario) ? { color: "var(--primary)" } : { color: "#B14A3A" }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: estaEnHorario(horario) ? "var(--primary)" : "#B14A3A" }} />
          {estaEnHorario(horario) ? "Abierto ahora" : `Cerrado ahora · próxima atención ${proximaAtencion(horario).texto}`}
        </p>

        <button
          onClick={() => setHorario((h) => ({ ...h, atenderFuera: !h.atenderFuera }))}
          className="w-full flex items-center justify-between rounded-lg px-3 py-2.5 mb-2"
          style={{ border: "1px solid var(--border)" }}
        >
          <span className="text-xs font-semibold text-left">Atender pedidos fuera del horario de servicio</span>
          <span className="w-9 h-5 rounded-full relative flex-shrink-0" style={{ background: horario.atenderFuera ? "var(--primary)" : "var(--border)" }}>
            <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: horario.atenderFuera ? "18px" : "2px" }} />
          </span>
        </button>

        {horario.atenderFuera && (
          <div>
            <label className="text-[10px] font-semibold flex items-center gap-1 mb-1" style={{ color: "var(--muted)" }}><Percent size={10} /> Incremento al precio por atender fuera de horario</label>
            <div className="flex items-center gap-1.5">
              <input type="number" min="0" max="200" value={horario.recargo}
                onChange={(e) => setHorario((h) => ({ ...h, recargo: Number(e.target.value) || 0 }))}
                className="w-20 rounded-lg px-2 py-1.5 text-sm outline-none" style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink)" }} />
              <span className="text-sm font-semibold">%</span>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl p-4 mb-6 space-y-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <p className="text-xs font-semibold flex items-center gap-1.5"><Landmark size={13} /> Datos bancarios</p>
        <p className="text-[11px]" style={{ color: "var(--muted)" }}>Se muestran al cliente cuando elige pagar por transferencia.</p>
        <div>
          <label className="text-[10px] font-semibold block mb-1" style={{ color: "var(--muted)" }}>Banco</label>
          <input value={bancoNombre} onChange={(e) => setBancoNombre(e.target.value)} placeholder="Ej: Bancolombia"
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none" style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink)" }} />
        </div>
        <div>
          <label className="text-[10px] font-semibold block mb-1" style={{ color: "var(--muted)" }}>Beneficiario</label>
          <input value={bancoBeneficiario} onChange={(e) => setBancoBeneficiario(e.target.value)} placeholder="Nombre a quien está la cuenta"
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none" style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink)" }} />
        </div>
        <div>
          <label className="text-[10px] font-semibold block mb-1" style={{ color: "var(--muted)" }}>Número de tarjeta o cuenta</label>
          <div className="flex items-center gap-2">
            <input value={bancoNumeroCuenta} onChange={(e) => setBancoNumeroCuenta(e.target.value)} placeholder="Ej: 1234 5678 9012 3456"
              className="flex-1 rounded-lg px-3 py-2.5 text-sm outline-none font-mono-price" style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink)" }} />
            <button onClick={copiarNumeroCuenta} disabled={!bancoNumeroCuenta} className="flex-shrink-0 rounded-lg px-3 py-2.5 text-xs font-semibold flex items-center gap-1 disabled:opacity-40"
              style={{ border: "1px solid var(--border)", color: "var(--ink)" }}>
              <Copy size={13} /> {copiadoCuenta ? "¡Copiado!" : "Copiar"}
            </button>
          </div>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold flex items-center gap-1.5 mb-1"><ImageIcon size={13} /> Cambiar imagen (skin)</p>
        <p className="text-[11px] mb-3" style={{ color: "var(--muted)" }}>Elige el fondo que más se parezca a tu negocio.</p>
        <div className="grid grid-cols-2 gap-3">
          {SKINS.map((s) => {
            const IconoSkin = ICONO_SKIN[s.icono];
            return (
              <button key={s.id} onClick={() => setSkinId(s.id)} className="rounded-xl p-3 text-left transition"
                style={{ background: "var(--card)", border: s.id === skinId ? "2px solid var(--primary)" : "1px solid var(--border)" }}>
                <div className="flex mb-2 h-14 rounded-md overflow-hidden relative">
                  {s.foto ? (
                    <img src={s.foto} alt={s.nombre} className="w-full h-full object-cover" />
                  ) : (
                    <>
                      {s.swatch.map((c, i) => <div key={i} style={{ background: c, flex: 1 }} />)}
                      {IconoSkin && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <IconoSkin size={22} style={{ color: "#fff", filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.35))" }} />
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">{s.nombre}</span>
                  {s.id === skinId && <Check size={13} style={{ color: "var(--primary)" }} />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
