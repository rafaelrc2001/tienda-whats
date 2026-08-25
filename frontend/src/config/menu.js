/** Secciones del menú lateral "Mi Cuenta". El orden aquí es el orden en pantalla. */
import { DollarSign, ShoppingBag, SlidersHorizontal, Upload, Users } from "../icons";

export const MENU_ITEMS = [
  { key: "catalogo", label: "Tienda", icon: ShoppingBag },
  { key: "productos", label: "Productos", icon: Upload },
  { key: "clientes", label: "Clientes", icon: Users },
  { key: "perfil", label: "Mi perfil", icon: SlidersHorizontal },
  { key: "finanzas", label: "Finanzas", icon: DollarSign },
];
