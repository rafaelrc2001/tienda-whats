/**
 * Secciones del menú lateral "Mi Cuenta". El orden aquí es el orden en pantalla.
 *
 * `soloAdmin` marca lo que pertenece al dueño de la tienda. El modo cliente solo
 * ve "Tienda". Ocultarlo aquí es comodidad, no seguridad: quien de verdad corta
 * el paso es la API, que responde 403 a esas rutas sin token de administrador.
 */
import { DollarSign, ShoppingBag, SlidersHorizontal, Upload, Users } from "../icons";

export const MENU_ITEMS = [
  { key: "catalogo", label: "Tienda", icon: ShoppingBag },
  { key: "productos", label: "Productos", icon: Upload, soloAdmin: true },
  { key: "clientes", label: "Clientes", icon: Users, soloAdmin: true },
  { key: "perfil", label: "Mi perfil", icon: SlidersHorizontal, soloAdmin: true },
  { key: "finanzas", label: "Finanzas", icon: DollarSign, soloAdmin: true },
];

/** Secciones visibles según el modo de la sesión. */
export const menuPara = (esAdmin) => MENU_ITEMS.filter((item) => esAdmin || !item.soloAdmin);

/** ¿Esta sección es del dueño? La usa App para no renderizarla en modo cliente. */
export const esSoloAdmin = (key) => MENU_ITEMS.some((item) => item.key === key && item.soloAdmin);
