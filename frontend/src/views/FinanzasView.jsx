/**
 * Ingresos y utilidad real (venta - costo) por período, por pedido y por cliente.
 */
import { useTienda } from "../context/TiendaContext";
import { fechaHoraCorta, money } from "../lib/format";
import { AlertCircle, Calendar, Receipt, TrendingUp, Users2, Wallet } from "../icons";

export default function FinanzasView() {
  const {
    clientesDesde,
    clientesHasta,
    finanzas,
    ingresosDesde,
    ingresosHasta,
    ingresosPedidosFiltrados,
    pedidosDesde,
    pedidosFiltrados,
    pedidosHasta,
    periodoFinanzas,
    porClienteFiltrado,
    setClientesDesde,
    setClientesHasta,
    setIngresosDesde,
    setIngresosHasta,
    setPedidosDesde,
    setPedidosHasta,
    setPeriodoFinanzas,
  } = useTienda();

  return (
    <div className="max-w-md mx-auto">
      <h1 className="font-display text-3xl mb-2">Finanzas</h1>
      <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
        La utilidad se calcula con el precio de costo y el precio de venta de cada producto vendido.
      </p>
      {finanzas.sinCosto && (
        <p className="text-xs mb-4 flex items-center gap-1.5 rounded-lg px-3 py-2" style={{ color: "#B5732B", background: "var(--card)", border: "1px solid var(--border)" }}>
          <AlertCircle size={13} /> Algunos productos no tienen precio de costo; para ellos la utilidad se calcula como si costaran $0.
        </p>
      )}

      {/* ingresos y utilidad por periodo (día / semana / mes) */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold flex items-center gap-1.5"><Wallet size={13} /> Ingresos y utilidad</p>
          <div className="flex gap-1">
            {[["dia", "Día"], ["semana", "Semana"], ["mes", "Mes"]].map(([val, label]) => (
              <button key={val} onClick={() => setPeriodoFinanzas(val)}
                className="text-[11px] px-2.5 py-1 rounded-full font-semibold"
                style={periodoFinanzas === val ? { background: "var(--primary)", color: "#fff" } : { border: "1px solid var(--border)", color: "var(--muted)" }}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl p-4" style={{ background: "var(--primary)", color: "#fff" }}>
            <p className="text-[11px] opacity-80 flex items-center gap-1"><TrendingUp size={11} /> Ingresos</p>
            <p className="font-mono-price text-2xl font-semibold mt-1">{money(finanzas.resumenPorPeriodo[periodoFinanzas].ingresos)}</p>
          </div>
          <div className="rounded-2xl p-4" style={{ background: "var(--accent)", color: "var(--accentInk)" }}>
            <p className="text-[11px] opacity-80">Utilidad bruta</p>
            <p className="font-mono-price text-2xl font-semibold mt-1">{money(finanzas.resumenPorPeriodo[periodoFinanzas].utilidad)}</p>
            <p className="text-[10px] opacity-70 mt-0.5">Falta restar gastos</p>
          </div>
        </div>
        <p className="text-[11px] mt-2" style={{ color: "var(--muted)" }}>
          {periodoFinanzas === "dia" ? "Hoy" : periodoFinanzas === "semana" ? "Esta semana (lunes a domingo)" : "Este mes"} · {finanzas.resumenPorPeriodo[periodoFinanzas].pedidos} pedido(s)
        </p>
      </section>

      {/* ingresos del día: tabla con selector de rango de fechas */}
      <section className="mb-6">
        <p className="text-xs font-semibold flex items-center gap-1.5 mb-2"><TrendingUp size={13} /> Ingresos del día</p>

        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1">
            <label className="text-[10px] font-semibold block mb-1" style={{ color: "var(--muted)" }}>Desde</label>
            <div className="relative">
              <Calendar size={13} className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--muted)" }} />
              <input type="date" value={ingresosDesde} onChange={(e) => setIngresosDesde(e.target.value)}
                className="w-full rounded-lg pl-7 pr-2 py-2 text-xs outline-none" style={{ border: "1px solid var(--border)", background: "var(--card)", color: "var(--ink)" }} />
            </div>
          </div>
          <div className="flex-1">
            <label className="text-[10px] font-semibold block mb-1" style={{ color: "var(--muted)" }}>Hasta</label>
            <div className="relative">
              <Calendar size={13} className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--muted)" }} />
              <input type="date" value={ingresosHasta} onChange={(e) => setIngresosHasta(e.target.value)}
                className="w-full rounded-lg pl-7 pr-2 py-2 text-xs outline-none" style={{ border: "1px solid var(--border)", background: "var(--card)", color: "var(--ink)" }} />
            </div>
          </div>
        </div>

        {ingresosPedidosFiltrados.length === 0 ? (
          <p className="text-xs" style={{ color: "var(--muted)" }}>No hay pedidos en ese rango de fechas.</p>
        ) : (
          <div className="rounded-xl overflow-x-auto" style={{ border: "1px solid var(--border)" }}>
            <table className="w-full text-[11px]" style={{ borderCollapse: "collapse", minWidth: 300 }}>
              <thead>
                <tr style={{ background: "var(--card)" }}>
                  <th className="text-left px-2 py-2 font-semibold" style={{ color: "var(--muted)" }}>Cliente</th>
                  <th className="text-left px-2 py-2 font-semibold" style={{ color: "var(--muted)", width: 92 }}>Fecha y hora</th>
                  <th className="text-right px-2 py-2 font-semibold" style={{ color: "var(--muted)" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {ingresosPedidosFiltrados.map((p) => {
                  const d = new Date(p.fechaISO);
                  return (
                    <tr key={p.id} style={{ borderTop: "1px solid var(--border)" }}>
                      <td className="px-2 py-2 font-mono-price whitespace-nowrap">{p.nombre}</td>
                      <td className="px-2 py-2 font-mono-price whitespace-nowrap" style={{ width: 92 }}>{fechaHoraCorta(d)}</td>
                      <td className="px-2 py-2 font-mono-price text-right whitespace-nowrap font-semibold">{money(p.total)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: "1px solid var(--border)", background: "var(--card)" }}>
                  <td className="px-2 py-2 font-semibold" colSpan={2}>Total</td>
                  <td className="px-2 py-2 text-right font-mono-price font-semibold">{money(ingresosPedidosFiltrados.reduce((s, p) => s + p.total, 0))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      {/* utilidad por pedido: tabla (fecha y hora fusionadas) */}
      <section className="mb-6">
        <p className="text-xs font-semibold flex items-center gap-1.5 mb-2"><Receipt size={13} /> Utilidad por pedido</p>

        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1">
            <label className="text-[10px] font-semibold block mb-1" style={{ color: "var(--muted)" }}>Desde</label>
            <div className="relative">
              <Calendar size={13} className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--muted)" }} />
              <input type="date" value={pedidosDesde} onChange={(e) => setPedidosDesde(e.target.value)}
                className="w-full rounded-lg pl-7 pr-2 py-2 text-xs outline-none" style={{ border: "1px solid var(--border)", background: "var(--card)", color: "var(--ink)" }} />
            </div>
          </div>
          <div className="flex-1">
            <label className="text-[10px] font-semibold block mb-1" style={{ color: "var(--muted)" }}>Hasta</label>
            <div className="relative">
              <Calendar size={13} className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--muted)" }} />
              <input type="date" value={pedidosHasta} onChange={(e) => setPedidosHasta(e.target.value)}
                className="w-full rounded-lg pl-7 pr-2 py-2 text-xs outline-none" style={{ border: "1px solid var(--border)", background: "var(--card)", color: "var(--ink)" }} />
            </div>
          </div>
          {(pedidosDesde || pedidosHasta) && (
            <button onClick={() => { setPedidosDesde(""); setPedidosHasta(""); }} className="self-end text-[11px] font-semibold px-2.5 py-2 rounded-lg" style={{ color: "var(--muted)", border: "1px solid var(--border)" }}>
              Limpiar
            </button>
          )}
        </div>

        {pedidosFiltrados.length === 0 ? (
          <p className="text-xs" style={{ color: "var(--muted)" }}>No hay pedidos en ese rango de fechas.</p>
        ) : (
          <div className="rounded-xl overflow-x-auto" style={{ border: "1px solid var(--border)" }}>
            <table className="w-full text-[11px]" style={{ borderCollapse: "collapse", minWidth: 340 }}>
              <thead>
                <tr style={{ background: "var(--card)" }}>
                  <th className="text-left px-2 py-2 font-semibold" style={{ color: "var(--muted)" }}>Cliente</th>
                  <th className="text-left px-2 py-2 font-semibold" style={{ color: "var(--muted)", width: 92 }}>Fecha y hora</th>
                  <th className="text-right px-2 py-2 font-semibold" style={{ color: "var(--muted)" }}>Venta</th>
                  <th className="text-right px-2 py-2 font-semibold" style={{ color: "var(--muted)" }}>Utilidad</th>
                </tr>
              </thead>
              <tbody>
                {pedidosFiltrados.map((p) => {
                  const d = new Date(p.fechaISO);
                  return (
                    <tr key={p.id} style={{ borderTop: "1px solid var(--border)" }}>
                      <td className="px-2 py-2 font-mono-price whitespace-nowrap">{p.nombre}</td>
                      <td className="px-2 py-2 font-mono-price whitespace-nowrap" style={{ width: 92 }}>{fechaHoraCorta(d)}</td>
                      <td className="px-2 py-2 font-mono-price text-right whitespace-nowrap">{money(p.total)}</td>
                      <td className="px-2 py-2 font-mono-price text-right whitespace-nowrap font-semibold" style={{ color: "var(--primary)" }}>{money(p.utilidad)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: "1px solid var(--border)", background: "var(--card)" }}>
                  <td className="px-2 py-2 font-semibold" colSpan={2}>Total</td>
                  <td className="px-2 py-2 text-right font-mono-price font-semibold">{money(pedidosFiltrados.reduce((s, p) => s + p.total, 0))}</td>
                  <td className="px-2 py-2 text-right font-mono-price font-semibold" style={{ color: "var(--primary)" }}>{money(pedidosFiltrados.reduce((s, p) => s + p.utilidad, 0))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      {/* utilidad por cliente: tabla con selector de rango de fechas */}
      <section>
        <p className="text-xs font-semibold flex items-center gap-1.5 mb-2"><Users2 size={13} /> Utilidad por cliente</p>

        <div className="mb-3">
          <p className="text-[11px] font-semibold mb-1.5 flex items-center gap-1" style={{ color: "var(--muted)" }}>
            <Calendar size={12} /> Filtrar por rango de fechas
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="text-[10px] font-semibold block mb-1" style={{ color: "var(--muted)" }}>Desde</label>
              <div className="relative">
                <Calendar size={13} className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--muted)" }} />
                <input type="date" value={clientesDesde} onChange={(e) => setClientesDesde(e.target.value)}
                  className="w-full rounded-lg pl-7 pr-2 py-2 text-xs outline-none" style={{ border: "1px solid var(--border)", background: "var(--card)", color: "var(--ink)" }} />
              </div>
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-semibold block mb-1" style={{ color: "var(--muted)" }}>Hasta</label>
              <div className="relative">
                <Calendar size={13} className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--muted)" }} />
                <input type="date" value={clientesHasta} onChange={(e) => setClientesHasta(e.target.value)}
                  className="w-full rounded-lg pl-7 pr-2 py-2 text-xs outline-none" style={{ border: "1px solid var(--border)", background: "var(--card)", color: "var(--ink)" }} />
              </div>
            </div>
          </div>
          {(clientesDesde || clientesHasta) && (
            <button onClick={() => { setClientesDesde(""); setClientesHasta(""); }} className="text-[11px] font-semibold mt-2 px-3 py-1.5 rounded-lg" style={{ color: "var(--primary)", border: "1px solid var(--border)" }}>
              Limpiar filtro de fechas
            </button>
          )}
        </div>

        {porClienteFiltrado.length === 0 ? (
          <p className="text-xs" style={{ color: "var(--muted)" }}>No hay pedidos en ese rango de fechas.</p>
        ) : (
          <div className="rounded-xl overflow-x-auto" style={{ border: "1px solid var(--border)" }}>
            <table className="w-full text-[11px]" style={{ borderCollapse: "collapse", minWidth: 340 }}>
              <thead>
                <tr style={{ background: "var(--card)" }}>
                  <th className="text-left px-2.5 py-2 font-semibold" style={{ color: "var(--muted)" }}>Cliente</th>
                  <th className="text-right px-2.5 py-2 font-semibold" style={{ color: "var(--muted)" }}>N.º pedidos</th>
                  <th className="text-right px-2.5 py-2 font-semibold" style={{ color: "var(--muted)" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {porClienteFiltrado.map((c) => (
                  <tr key={c.telefono || c.nombre} style={{ borderTop: "1px solid var(--border)" }}>
                    <td className="px-2.5 py-2 font-mono-price whitespace-nowrap">{c.nombre}</td>
                    <td className="px-2.5 py-2 font-mono-price text-right whitespace-nowrap">{c.pedidos}</td>
                    <td className="px-2.5 py-2 font-mono-price text-right whitespace-nowrap font-semibold" style={{ color: "var(--primary)" }}>{money(c.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
