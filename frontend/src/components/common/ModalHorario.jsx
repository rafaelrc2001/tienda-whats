/**
 * Aviso de fuera de horario: deja programar el pedido o aceptar el recargo.
 */
import { useTienda } from "../../context/TiendaContext";
import { DIAS, cruzaMedianoche, proximaAtencion } from "../../lib/horario";
import { CalendarClock, XCircle } from "../../icons";

export default function ModalHorario() {
  const {
    comprarConRecargo,
    horario,
    showHorarioModal,
    programarParaProximoHorario,
    setShowHorarioModal,
  } = useTienda();

  if (!showHorarioModal) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-0 sm:p-5" style={{ background: "rgba(0,0,0,0.45)" }}>
      <div className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-5" style={{ background: "var(--card)", color: "var(--ink)" }}>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "var(--bg)" }}>
            <XCircle size={20} style={{ color: "#B14A3A" }} />
          </div>
          <h2 className="font-display text-xl">Fuera de horario de servicio</h2>
        </div>
        <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
          Estamos cerrados en este momento. Atendemos {DIAS.filter((d) => horario.dias[d.key]).map((d) => d.label).join(", ")} de {horario.apertura} a {horario.cierre}{cruzaMedianoche(horario) ? " del día siguiente" : ""}.
          Nuestra próxima atención es {proximaAtencion(horario).texto}.{horario.atenderFuera ? " ¡Pero es posible comprar ahora!" : ""}
        </p>

        <button onClick={programarParaProximoHorario} className="w-full rounded-lg py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 mb-2"
          style={{ background: "var(--primary)", color: "#fff" }}>
          <CalendarClock size={15} /> Programar para {proximaAtencion(horario).texto}
        </button>

        {horario.atenderFuera && (
          <button onClick={comprarConRecargo} className="w-full rounded-lg py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 mb-2"
            style={{ background: "var(--accent)", color: "var(--accentInk)" }}>
            Comprar ahora
          </button>
        )}

        <button onClick={() => setShowHorarioModal(false)} className="w-full text-xs py-1.5" style={{ color: "var(--muted)" }}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
