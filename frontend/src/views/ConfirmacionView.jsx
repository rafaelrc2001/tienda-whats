/**
 * Última pantalla: muestra el mensaje ya armado y lo envía por WhatsApp.
 * El pedido no queda registrado hasta que se pulsa enviar.
 */
import { useTienda } from "../context/TiendaContext";
import { AlertCircle, Check, MessageCircle, Pencil, ShoppingBag } from "../icons";

export default function ConfirmacionView() {
  const {
    abrirWhatsapp,
    editarPedido,
    enviarWhatsapp,
    irA,
    negocioTelefono,
    nuevoPedido,
    pedidoEnviado,
    pedidoFinal,
  } = useTienda();

  if (!pedidoFinal) return null;

  return (
    <div className="max-w-md mx-auto text-center">
      <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: pedidoEnviado ? "#25D366" : "var(--primary)", color: "#fff" }}>
        {pedidoEnviado ? <MessageCircle size={26} /> : <Check size={26} />}
      </div>
      <h1 className="font-display text-3xl mb-2">{pedidoEnviado ? "¡Pedido enviado!" : "¡Pedido listo!"}</h1>
      <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
        {pedidoEnviado
          ? "Tu pedido quedó registrado y se abrió WhatsApp con el mensaje. Termina de enviarlo desde ahí."
          : "Envía el pedido por WhatsApp para confirmarlo con la tienda."}
      </p>

      <div className="rounded-2xl p-4 text-left mb-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <p className="text-xs font-semibold mb-2 flex items-center gap-1.5"><MessageCircle size={13} /> Mensaje a enviar</p>
        <pre className="whitespace-pre-wrap text-xs font-mono-price leading-relaxed">{pedidoFinal.mensaje}</pre>
      </div>

      {!negocioTelefono && !pedidoEnviado && (
        <p className="text-xs mb-3 flex items-center gap-1.5 rounded-lg px-3 py-2 text-left" style={{ color: "#B5732B", background: "var(--card)", border: "1px solid var(--border)" }}>
          <AlertCircle size={13} /> Falta configurar el WhatsApp del negocio en Mi perfil para poder enviar el pedido.
          <button onClick={() => irA("perfil")} className="underline font-semibold flex-shrink-0" style={{ color: "var(--primary)" }}>Configurar</button>
        </p>
      )}

      {pedidoEnviado ? (
        <>
          <button onClick={nuevoPedido} className="w-full rounded-lg py-3 text-sm font-semibold flex items-center justify-center gap-1.5 mb-3"
            style={{ background: "var(--primary)", color: "#fff" }}>
            <ShoppingBag size={15} /> Empezar un pedido nuevo
          </button>
          <button onClick={abrirWhatsapp} className="w-full rounded-lg py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5"
            style={{ border: "1px solid var(--border)", color: "var(--ink)" }}>
            <MessageCircle size={14} /> Volver a abrir WhatsApp
          </button>
          <p className="text-[11px] mt-3" style={{ color: "var(--muted)" }}>Este pedido ya quedó registrado una sola vez en Clientes y Finanzas.</p>
        </>
      ) : (
        <>
          <button onClick={enviarWhatsapp} disabled={!negocioTelefono} className="w-full rounded-lg py-3 text-sm font-semibold flex items-center justify-center gap-1.5 mb-3 disabled:opacity-40"
            style={{ background: "#25D366", color: "#fff" }}>
            <MessageCircle size={16} /> Enviar por WhatsApp
          </button>
          <button onClick={editarPedido} className="w-full rounded-lg py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 mb-3"
            style={{ border: "1px solid var(--border)", color: "var(--ink)" }}>
            <Pencil size={14} /> Editar pedido
          </button>
          <button onClick={nuevoPedido} className="text-xs" style={{ color: "var(--muted)" }}>
            Cancelar y empezar un pedido nuevo
          </button>
        </>
      )}
    </div>
  );
}
