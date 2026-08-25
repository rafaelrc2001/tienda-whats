/**
 * Resumen del carrito y datos de entrega y pago antes de confirmar.
 */
import { useTienda } from "../context/TiendaContext";
import { money } from "../lib/format";
import { AlertCircle, ArrowLeft, ChevronRight, Clock, Copy, Landmark, MapPin, PenLine, Receipt, ShoppingCart, Store, Truck } from "../icons";

export default function CheckoutView() {
  const {
    bancoBeneficiario,
    bancoNombre,
    bancoNumeroCuenta,
    checkoutError,
    clienteActivo,
    comentarios,
    copiadoCuenta,
    copiarNumeroCuenta,
    direccion,
    direccionGps,
    direccionGpsCargando,
    direccionGpsError,
    entrega,
    finalizarPedido,
    horario,
    itemsCarrito,
    obtenerUbicacionDireccion,
    pago,
    recargoAplicado,
    recargoMonto,
    setComentarios,
    setDireccion,
    setDireccionGps,
    setEntrega,
    setPago,
    setView,
    totalConRecargo,
    totalItems,
  } = useTienda();

  return (
    <div className="max-w-md mx-auto">
      <button onClick={() => setView("catalogo")} className="text-xs flex items-center gap-1 mb-4" style={{ color: "var(--muted)" }}>
        <ArrowLeft size={13} /> Volver a la tienda
      </button>
      <h1 className="font-display text-3xl mb-1">Finalizar pedido</h1>

      {!clienteActivo || totalItems === 0 ? (
        <div className="rounded-2xl p-8 text-center mt-4" style={{ background: "var(--card)", border: "1px dashed var(--border)" }}>
          <ShoppingCart size={26} className="mx-auto mb-2" style={{ color: "var(--muted)" }} />
          <p className="text-sm font-semibold mb-1">{!clienteActivo ? "Falta identificarte" : "Tu carrito está vacío"}</p>
          <button onClick={() => setView("catalogo")} className="text-xs font-semibold px-4 py-2 rounded-lg mt-2" style={{ background: "var(--primary)", color: "#fff" }}>
            Ir a la tienda
          </button>
        </div>
      ) : (
        <>
          <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>
            Pedido para <span className="font-semibold">{clienteActivo.nombre}</span> · {clienteActivo.telefono}
          </p>

          <div className="rounded-2xl p-4 mb-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <p className="text-xs font-semibold mb-2 flex items-center gap-1.5"><Receipt size={13} /> Resumen del pedido</p>
            <div className="space-y-1.5">
              {itemsCarrito.map((i) => (
                <div key={i.id} className="flex justify-between text-xs font-mono-price">
                  <span style={{ color: "var(--muted)" }}>{i.cantidad} {i.unidad} · {i.producto}</span>
                  <span>{money(i.precioVenta * i.cantidad)}</span>
                </div>
              ))}
            </div>
            {recargoAplicado && (
              <div className="flex justify-between text-xs font-mono-price mt-1.5 pt-1.5" style={{ borderTop: "1px dashed var(--border)", color: "#B5732B" }}>
                <span>Recargo fuera de horario (+{horario.recargo}%)</span>
                <span>{money(recargoMonto)}</span>
              </div>
            )}
            <div className="mt-3 pt-2 flex justify-between text-sm font-semibold" style={{ borderTop: "1px dashed var(--border)" }}>
              <span>Total</span><span className="font-mono-price">{money(totalConRecargo)}</span>
            </div>
          </div>

          {recargoAplicado && (
            <p className="text-xs mb-4 flex items-center gap-1.5 rounded-lg px-3 py-2" style={{ color: "#B5732B", background: "var(--card)", border: "1px solid var(--border)" }}>
              <Clock size={13} /> Este pedido se está haciendo fuera del horario de servicio, por eso incluye el recargo.
            </p>
          )}

          <p className="text-xs font-semibold mb-2">Entrega</p>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button onClick={() => setEntrega("recoger")} className="rounded-lg px-3 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5"
              style={entrega === "recoger" ? { background: "var(--primary)", color: "#fff", border: "1px solid var(--primary)" } : { border: "1px solid var(--border)" }}>
              <Store size={14} /> Recoger en tienda
            </button>
            <button onClick={() => setEntrega("domicilio")} className="rounded-lg px-3 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5"
              style={entrega === "domicilio" ? { background: "var(--primary)", color: "#fff", border: "1px solid var(--primary)" } : { border: "1px solid var(--border)" }}>
              <Truck size={14} /> Domicilio
            </button>
          </div>

          {entrega === "domicilio" && (
            <div className="mb-4">
              <label className="text-xs font-semibold flex items-center gap-1.5 mb-1.5"><MapPin size={13} /> Dirección de entrega</label>
              <input value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder="Calle, número, barrio, referencia"
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none mb-2"
                style={{ border: "1px solid var(--border)", background: "var(--card)", color: "var(--ink)" }} />

              {direccionGps ? (
                <div className="rounded-lg px-3 py-2.5 flex items-center justify-between" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  <p className="text-xs font-mono-price">{direccionGps.lat.toFixed(5)}, {direccionGps.lng.toFixed(5)}</p>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a href={`https://www.google.com/maps?q=${direccionGps.lat},${direccionGps.lng}`} target="_blank" rel="noreferrer"
                      className="text-[11px] font-semibold underline" style={{ color: "var(--primary)" }}>Ver mapa</a>
                    <button onClick={() => setDireccionGps(null)} className="text-[11px] font-semibold" style={{ color: "#B14A3A" }}>Quitar</button>
                  </div>
                </div>
              ) : (
                <button onClick={obtenerUbicacionDireccion} disabled={direccionGpsCargando}
                  className="w-full rounded-lg py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5"
                  style={{ border: "1px solid var(--border)", color: "var(--ink)" }}>
                  <MapPin size={13} /> {direccionGpsCargando ? "Obteniendo ubicación..." : "Obtener ubicación GPS"}
                </button>
              )}
              {direccionGpsError && (
                <p className="text-xs mt-1.5 flex items-center gap-1.5" style={{ color: "#B14A3A" }}><AlertCircle size={13} /> {direccionGpsError}</p>
              )}
            </div>
          )}

          <p className="text-xs font-semibold mb-2">Forma de pago</p>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[["efectivo", "Efectivo"], ["transferencia", "Transferencia"], ["tarjeta", "Tarjeta"]].map(([val, label]) => (
              <button key={val} onClick={() => setPago(val)} className="rounded-lg px-2 py-2.5 text-xs font-semibold"
                style={pago === val ? { background: "var(--accent)", color: "var(--accentInk)", border: "1px solid var(--accent)" } : { border: "1px solid var(--border)" }}>
                {label}
              </button>
            ))}
          </div>

          {pago === "transferencia" && (
            <div className="rounded-xl p-3.5 mb-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <p className="text-xs font-semibold mb-2 flex items-center gap-1.5"><Landmark size={13} /> Datos para transferir</p>
              {bancoNumeroCuenta ? (
                <div className="space-y-1.5 text-xs">
                  {bancoNombre && <p><span style={{ color: "var(--muted)" }}>Banco:</span> <span className="font-semibold">{bancoNombre}</span></p>}
                  {bancoBeneficiario && <p><span style={{ color: "var(--muted)" }}>Beneficiario:</span> <span className="font-semibold">{bancoBeneficiario}</span></p>}
                  <div className="flex items-center justify-between rounded-lg px-2.5 py-2 mt-1.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                    <span className="font-mono-price font-semibold">{bancoNumeroCuenta}</span>
                    <button onClick={copiarNumeroCuenta} className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-md flex-shrink-0" style={{ background: "var(--primary)", color: "#fff" }}>
                      <Copy size={12} /> {copiadoCuenta ? "¡Copiado!" : "Copiar"}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs" style={{ color: "var(--muted)" }}>El negocio aún no configuró sus datos bancarios en Mi perfil.</p>
              )}
            </div>
          )}

          <label className="text-xs font-semibold flex items-center gap-1.5 mb-1.5"><PenLine size={13} /> Comentarios (opcional)</label>
          <textarea value={comentarios} onChange={(e) => setComentarios(e.target.value)} rows={3}
            placeholder="Ej: sin cebolla, dejar en portería, llamar al llegar..."
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none mb-4"
            style={{ border: "1px solid var(--border)", background: "var(--card)", color: "var(--ink)" }} />

          {checkoutError && (
            <p className="text-xs mb-3 flex items-center gap-1.5" style={{ color: "#B14A3A" }}><AlertCircle size={13} /> {checkoutError}</p>
          )}

          <button onClick={finalizarPedido} className="w-full rounded-lg py-3 text-sm font-semibold flex items-center justify-center gap-1.5"
            style={{ background: "var(--ink)", color: "var(--bg)" }}>
            Confirmar pedido <ChevronRight size={15} />
          </button>
        </>
      )}
    </div>
  );
}
