/**
 * Catálogo del negocio: carga del Excel y edición manual de cada producto.
 */
import { useTienda } from "../context/TiendaContext";
import { AlertCircle, Check, FileSpreadsheet, ImagePlus, Pencil, PlusCircle, Trash2 } from "../icons";
import CampoProducto from "../components/common/CampoProducto";

export default function ProductosView() {
  const {
    actualizarProducto,
    agregarProductoManual,
    eliminarProducto,
    fileInputRef,
    fileName,
    manejarArchivo,
    manejarImagenProducto,
    parseError,
    productos,
  } = useTienda();

  return (
    <div className="max-w-md mx-auto">
      <h1 className="font-display text-3xl mb-2">Productos</h1>
      <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
        Adjunta el Excel con <b>Categoría, Producto, Marca, Unidad, Precio venta, Precio costo y Proveedor</b>. Puedes editar cualquier dato o agregar productos a mano.
      </p>

      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-full rounded-2xl py-8 flex flex-col items-center gap-2 transition mb-3"
        style={{ background: "var(--card)", border: "2px dashed var(--border)" }}
      >
        <FileSpreadsheet size={26} style={{ color: "var(--primary)" }} />
        <span className="text-sm font-semibold">Adjuntar archivo Excel</span>
        <span className="text-xs" style={{ color: "var(--muted)" }}>.xlsx o .xls</span>
      </button>
      <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={manejarArchivo} />

      {fileName && !parseError && (
        <p className="text-xs mb-4 flex items-center gap-1.5" style={{ color: "var(--primary)" }}><Check size={13} /> {fileName} cargado</p>
      )}
      {parseError && (
        <p className="text-xs mb-4 flex items-center gap-1.5" style={{ color: "#B14A3A" }}><AlertCircle size={13} /> {parseError}</p>
      )}

      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold">{productos.length} producto(s)</p>
        <button onClick={agregarProductoManual} className="text-xs font-semibold flex items-center gap-1 px-3 py-1.5 rounded-lg" style={{ background: "var(--primary)", color: "#fff" }}>
          <PlusCircle size={13} /> Agregar producto
        </button>
      </div>

      <div className="space-y-3">
        {productos.map((p) => (
          <div key={p.id} className="rounded-xl p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold flex items-center gap-1" style={{ color: "var(--muted)" }}><Pencil size={11} /> Editable</span>
              <button onClick={() => eliminarProducto(p.id)} aria-label="Eliminar producto">
                <Trash2 size={15} style={{ color: "#B14A3A" }} />
              </button>
            </div>
            <div className="flex items-center gap-3 mb-2.5">
              {p.imagen ? (
                <img src={p.imagen} alt={p.producto || "producto"} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" style={{ border: "1px solid var(--border)" }} />
              ) : (
                <div className="w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--bg)", border: "1px dashed var(--border)" }}>
                  <ImagePlus size={18} style={{ color: "var(--muted)" }} />
                </div>
              )}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg cursor-pointer inline-block" style={{ border: "1px solid var(--border)", color: "var(--ink)" }}>
                  {p.imagen ? "Cambiar imagen" : "Subir imagen"}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => manejarImagenProducto(p.id, e.target.files?.[0])} />
                </label>
                {p.imagen && (
                  <button onClick={() => actualizarProducto(p.id, "imagen", "")} className="text-[11px]" style={{ color: "#B14A3A" }}>Quitar imagen</button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <CampoProducto label="Producto" span2 value={p.producto} onChange={(v) => actualizarProducto(p.id, "producto", v)} />
              <CampoProducto label="Categoría" value={p.categoria} onChange={(v) => actualizarProducto(p.id, "categoria", v)} />
              <CampoProducto label="Marca" value={p.marca} onChange={(v) => actualizarProducto(p.id, "marca", v)} />
              <CampoProducto label="Unidad" value={p.unidad} onChange={(v) => actualizarProducto(p.id, "unidad", v)} />
              <CampoProducto label="Proveedor" value={p.proveedor} onChange={(v) => actualizarProducto(p.id, "proveedor", v)} />
              <CampoProducto label="Precio venta" numero value={p.precioVenta} onChange={(v) => actualizarProducto(p.id, "precioVenta", v)} />
              <CampoProducto label="Precio costo" numero value={p.precioCosto} onChange={(v) => actualizarProducto(p.id, "precioCosto", v)} />
            </div>
          </div>
        ))}
      </div>

      {productos.length === 0 && (
        <div className="rounded-xl p-4 text-xs" style={{ background: "var(--card)", color: "var(--muted)", border: "1px solid var(--border)" }}>
          <p className="font-semibold mb-1" style={{ color: "var(--ink)" }}>Formato esperado</p>
          <table className="w-full font-mono-price text-[10px] mt-1">
            <thead><tr><th className="text-left">Categoria</th><th className="text-left">Producto</th><th className="text-left">Marca</th><th className="text-left">Unidad</th><th className="text-left">Precio venta</th><th className="text-left">Precio costo</th><th className="text-left">Proveedor</th></tr></thead>
            <tbody><tr><td>Frutas</td><td>Manzana</td><td>Andina</td><td>kg</td><td>4500</td><td>3200</td><td>Frutería SAS</td></tr></tbody>
          </table>
        </div>
      )}
    </div>
  );
}
