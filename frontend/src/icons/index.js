/**
 * Punto único de importación de iconos.
 *
 * El prototipo original recreaba a mano cada icono de lucide con un shim sobre la
 * librería vanilla (`makeIcon`). Con el bundler ya no hace falta: se importan
 * directamente desde `lucide-react` y el tree-shaking deja fuera los que no se usan.
 *
 * Importar siempre desde aquí (`@/icons`) y no desde `lucide-react`, para que
 * cambiar de set de iconos sea un solo archivo.
 */
export {
  AlertCircle,
  Apple,
  ArrowLeft,
  Beef,
  Calendar,
  CalendarClock,
  Candy,
  Check,
  ChevronRight,
  Clock,
  Copy,
  CreditCard,
  CupSoda,
  DollarSign,
  Droplet,
  FileSpreadsheet,
  Flame,
  ImagePlus,
  Landmark,
  LogOut,
  MapPin,
  Menu,
  MessageCircle,
  Milk,
  Minus,
  Moon,
  Package,
  Pencil,
  PenLine,
  Percent,
  Phone,
  Plus,
  PlusCircle,
  Receipt,
  ShoppingBag,
  ShoppingBasket,
  ShoppingCart,
  SlidersHorizontal,
  SprayCan,
  Store,
  TrendingUp,
  Trash2,
  Truck,
  Upload,
  User,
  UserCheck,
  Users,
  Users2,
  UtensilsCrossed,
  Wallet,
  Wheat,
  X,
  XCircle,
} from "lucide-react";

// En el código original el icono de imagen se llamaba `ImageIcon` para no chocar
// con el constructor `Image` del navegador. Mantenemos ese nombre.
export { Image as ImageIcon } from "lucide-react";
