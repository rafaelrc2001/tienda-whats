/**
 * Menú lateral "Mi Cuenta" con la navegación entre secciones.
 */
import { useTienda } from "../../context/TiendaContext";
import { MENU_ITEMS } from "../../config/menu";
import { LogOut, X } from "../../icons";

export default function DrawerMenu() {
  const {
    cerrarSesion,
    drawerOpen,
    irA,
    setDrawerOpen,
    view,
  } = useTienda();

  return (
    <>
      {/* capa oscura: al tocarla se cierra el menú */}
      {drawerOpen && (
        <div onClick={() => setDrawerOpen(false)} className="fixed inset-0 z-20" style={{ background: "rgba(0,0,0,0.35)" }} />
      )}

      <aside
        className="fixed top-0 left-0 h-full w-72 max-w-[82%] z-30 transition-transform duration-300 ease-out overflow-y-auto flex flex-col"
        style={{ background: "var(--headerBg)", color: "var(--headerInk)", transform: drawerOpen ? "translateX(0)" : "translateX(-105%)" }}
      >
        <div className="px-5 pt-6 pb-4 flex items-center justify-between">
          <span className="font-display text-3xl font-semibold">Mi Cuenta</span>
          <button onClick={() => setDrawerOpen(false)} className="p-1" aria-label="Cerrar menú"><X size={20} /></button>
        </div>
        <nav className="flex-1">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const activo = view === item.key;
            return (
              <button
                key={item.key}
                onClick={() => irA(item.key)}
                className="w-full flex items-center justify-between px-5 py-4 text-left"
                style={{ borderTop: "1px solid rgba(0,0,0,0.08)", background: activo ? "rgba(0,0,0,0.06)" : "transparent" }}
              >
                <span className="font-display text-xl font-semibold">{item.label}</span>
                <Icon size={22} style={{ color: "var(--primary)" }} />
              </button>
            );
          })}
        </nav>
        <button
          onClick={cerrarSesion}
          className="w-full flex items-center justify-between px-5 py-4 text-left"
          style={{ borderTop: "1px solid rgba(0,0,0,0.08)" }}
        >
          <span className="font-display text-xl font-semibold" style={{ color: "#B14A3A" }}>Cerrar sesión</span>
          <LogOut size={20} style={{ color: "#B14A3A" }} />
        </button>
      </aside>
    </>
  );
}
