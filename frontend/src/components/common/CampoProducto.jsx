/**
 * Campo de texto o número reutilizable para editar una fila del catálogo.
 * `numero` convierte el valor con toNumber antes de propagarlo; `span2` lo hace
 * ocupar las dos columnas de la rejilla de edición.
 */
import { toNumber } from "../../lib/format";

export default function CampoProducto({ label, value, onChange, span2, numero }) {
  return (
    <div className={span2 ? "col-span-2" : ""}>
      <label className="text-[10px] font-semibold block mb-1" style={{ color: "var(--muted)" }}>{label}</label>
      <input
        type={numero ? "number" : "text"}
        value={value}
        onChange={(e) => onChange(numero ? toNumber(e.target.value) : e.target.value)}
        className="w-full rounded-md px-2 py-1.5 text-xs outline-none"
        style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink)" }}
      />
    </div>
  );
}
