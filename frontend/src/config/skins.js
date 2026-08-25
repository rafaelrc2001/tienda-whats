/**
 * Skins (temas visuales) que el negocio puede elegir en "Mi perfil".
 *
 * Cada skin define las variables CSS que se inyectan en el contenedor raíz.
 * Los que traen `foto` usan una imagen de fondo real (archivos en assets/fondos),
 * que en el prototipo original venían embebidas como base64 dentro del HTML.
 */
import fondoVerduleria from "../assets/fondos/verduleria.jpg";
import fondoCarniceria from "../assets/fondos/carniceria.jpg";
import fondoTienda from "../assets/fondos/tienda.jpg";
import fondoTaqueria from "../assets/fondos/taqueria.jpg";
import fondoTortilleria from "../assets/fondos/tortilleria.jpg";
import { Droplet, Flame, Moon, ShoppingBasket, UtensilsCrossed } from "../icons";

/** Iconos que un skin puede declarar en su campo `icono`. */
export const ICONO_SKIN = { Moon, Flame, ShoppingBasket, UtensilsCrossed, Droplet };

export const SKINS = [
  {
    id: "mercado", nombre: "Mercado Verde",
    bg: "#FBF8F2", card: "#FFFFFF", border: "#E9E4D8", ink: "#1F2B22", muted: "#6B7568",
    primary: "#2F6B4F", primaryDark: "#255A41", accent: "#E8A33D", accentInk: "#1F2B22",
    headerBg: "#E7F0E4", headerInk: "#16281B", swatch: ["#2F6B4F", "#E8A33D", "#FBF8F2"],
  },
  {
    id: "citrico", nombre: "Cítrico",
    bg: "#FFFBF0", card: "#FFFFFF", border: "#F3DFB0", ink: "#3A2A0E", muted: "#8A7550",
    primary: "#E8792E", primaryDark: "#C4611F", accent: "#F4C430", accentInk: "#3A2A0E",
    headerBg: "#FFF3DC", headerInk: "#3A2A0E", swatch: ["#E8792E", "#F4C430", "#FFFBF0"],
  },
  {
    id: "oceano", nombre: "Océano",
    bg: "#F3F8FA", card: "#FFFFFF", border: "#CFE3EA", ink: "#12303B", muted: "#5E7A85",
    primary: "#2E6488", primaryDark: "#204A65", accent: "#5FBFC0", accentInk: "#0D2E33",
    headerBg: "#E3EFF3", headerInk: "#12303B", swatch: ["#2E6488", "#5FBFC0", "#F3F8FA"],
  },
  {
    id: "noche", nombre: "Noche",
    bg: "#181B1E", card: "#22262A", border: "#33383D", ink: "#F2F1EC", muted: "#9AA0A6",
    primary: "#3FA66A", primaryDark: "#2F7F52", accent: "#D9C441", accentInk: "#181B1E",
    headerBg: "#1F2327", headerInk: "#F2F1EC", swatch: ["#22262A", "#3FA66A", "#D9C441"], icono: "Moon",
  },
  {
    id: "abarrotes", nombre: "Abarrotes",
    bg: "#F7F8FB", card: "#FFFFFF", border: "#D9E0EC", ink: "#152238", muted: "#5C6B85",
    primary: "#1F4E8C", primaryDark: "#173C6B", accent: "#D64545", accentInk: "#FFFFFF",
    headerBg: "#E4EAF5", headerInk: "#152238", swatch: ["#1F4E8C", "#D64545", "#F4C430"], icono: "ShoppingBasket",
  },
  {
    id: "antojitos", nombre: "Antojitos",
    bg: "#FFF7FA", card: "#FFFFFF", border: "#F6D6E3", ink: "#3A1030", muted: "#8A6178",
    primary: "#C2255C", primaryDark: "#9E1E4A", accent: "#8BC53F", accentInk: "#22300F",
    headerBg: "#FBE3ED", headerInk: "#3A1030", swatch: ["#C2255C", "#8BC53F", "#F4C430"], icono: "UtensilsCrossed",
  },
  {
    id: "agua", nombre: "Agua y garrafones",
    bg: "#F2FBFD", card: "#FFFFFF", border: "#CDEBF1", ink: "#0D2E38", muted: "#547E88",
    primary: "#0E7C9E", primaryDark: "#0B617C", accent: "#7FD8E8", accentInk: "#0D2E38",
    headerBg: "#DEF3F7", headerInk: "#0D2E38", swatch: ["#0E7C9E", "#7FD8E8", "#F2FBFD"], icono: "Droplet",
  },
  // ---- fondos con foto real, subidos por el negocio ----
  {
    id: "verduleria", nombre: "Verdulería",
    bg: "#FAFBF6", card: "#FFFFFF", border: "#DCE8D4", ink: "#1E3320", muted: "#5F7A63",
    primary: "#3F8F4F", primaryDark: "#2F6E3B", accent: "#D2483C", accentInk: "#FFFFFF",
    headerBg: "#E8F1E3", headerInk: "#1E3320", foto: fondoVerduleria,
  },
  {
    id: "carniceria", nombre: "Carnicería",
    bg: "#FBF6F5", card: "#FFFFFF", border: "#EAD2CF", ink: "#3A1210", muted: "#8A5C57",
    primary: "#8C1F2B", primaryDark: "#6E1721", accent: "#E0752B", accentInk: "#FFFFFF",
    headerBg: "#F3E1DE", headerInk: "#3A1210", foto: fondoCarniceria,
  },
  {
    id: "tienda", nombre: "Tienda",
    bg: "#FBF8F3", card: "#FFFFFF", border: "#E7DCC9", ink: "#2E2113", muted: "#7A6A52",
    primary: "#7A4B23", primaryDark: "#5D3A1B", accent: "#E8B93D", accentInk: "#2E2113",
    headerBg: "#F0E6D5", headerInk: "#2E2113", foto: fondoTienda,
  },
  {
    id: "taqueria", nombre: "Taquería",
    bg: "#FFFBF0", card: "#FFFFFF", border: "#F3DFB0", ink: "#3A1E14", muted: "#8A6A57",
    primary: "#C0392B", primaryDark: "#9E2E22", accent: "#1F9E96", accentInk: "#FFFFFF",
    headerBg: "#FCEFC7", headerInk: "#3A1E14", foto: fondoTaqueria,
  },
  {
    id: "tortilleria", nombre: "Tortillería",
    bg: "#FBF7F0", card: "#FFFFFF", border: "#EADFC6", ink: "#2E2313", muted: "#7C6C53",
    primary: "#A66A2E", primaryDark: "#835324", accent: "#E8B23D", accentInk: "#2E2313",
    headerBg: "#F1E6D3", headerInk: "#2E2313", foto: fondoTortilleria,
  },
];

/** Skin por defecto cuando el negocio todavía no eligió ninguno. */
export const SKIN_POR_DEFECTO = SKINS[0].id;

/** Busca un skin por id, cayendo al primero si el id no existe. */
export const skinPorId = (id) => SKINS.find((s) => s.id === id) || SKINS[0];
