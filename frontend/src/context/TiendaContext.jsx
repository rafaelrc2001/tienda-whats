/**
 * Estado y acciones de toda la tienda.
 *
 * En el prototipo original esto vivía dentro del componente `App`, junto con las
 * ~900 líneas de JSX de todas las pantallas. Aquí queda separado: el contexto es
 * el "cerebro" (estado + reglas de negocio del lado cliente) y cada vista solo
 * consume lo que necesita con `useTienda()`.
 *
 * El backend actúa como almacenamiento persistente, no como fuente de la verdad
 * durante la sesión: si la API no responde, la app sigue funcionando en memoria
 * exactamente igual que el prototipo.
 */
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

import { api } from "../lib/api";
import { copiarTexto } from "../lib/clipboard";
import { enlaceDeTienda, fijarUrlDeTienda, slugDeUrl } from "../lib/enlaceTienda";
import { leerProductosDeExcel } from "../lib/excel";
import { filtrarPorRango, inicioSemana } from "../lib/fechas";
import { digits, hoyISO } from "../lib/format";
import { obtenerCoordenadas } from "../lib/geolocalizacion";
import { HORARIO_INICIAL, estaEnHorario, proximaAtencion } from "../lib/horario";
import {
  ETIQUETA_PAGO,
  armarMensajePedido,
  enlaceWhatsapp,
  textoEntrega,
  utilidadDeItems,
} from "../lib/pedidos";
import { productoVacio } from "../lib/productos";
import { MODO, borrarSesion, guardarSesion, leerSesion } from "../lib/sesion";
import { SKIN_POR_DEFECTO, skinPorId } from "../config/skins";

const TiendaContext = createContext(null);

/** Acceso al estado de la tienda. Falla claro si se usa fuera del proveedor. */
export function useTienda() {
  const ctx = useContext(TiendaContext);
  if (!ctx) throw new Error("useTienda() debe usarse dentro de <TiendaProvider>");
  return ctx;
}

export function TiendaProvider({ children }) {
  // ---------- acceso ----------
  // Sin sesión no hay tienda: la aplicación no llama a la API de datos y la
  // pantalla de entrada es lo único que se muestra.
  const [sesion, setSesion] = useState(() => leerSesion());
  const esAdmin = sesion?.modo === MODO.admin;

  // La portada ("MI NEGOCIO DIGITAL") es lo primero que se ve al abrir la
  // aplicación sin sesión, y se queda hasta que se pulsa INICIEMOS. Al cerrar
  // sesión se vuelve a ella: es la puerta del sistema, no un adorno del arranque.
  const [bienvenidaVista, setBienvenidaVista] = useState(false);

  // La URL puede nombrar la tienda (`/abarrote-sjuan`). Mientras se comprueba
  // contra el servidor no se enseña la pantalla de entrada: el comprador que
  // abre el enlace no tiene por qué ver un formulario que no va a usar.
  const [entrandoPorEnlace, setEntrandoPorEnlace] = useState(() => slugDeUrl() !== null);

  /** El enlace que el dueño reparte. Vacío mientras no hay tienda. */
  const enlaceTienda = enlaceDeTienda(sesion?.idNegocio);

  // ---------- navegación ----------
  const [view, setView] = useState("catalogo");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sesionMsg, setSesionMsg] = useState("");

  // ---------- identidad y tema del negocio ----------
  const [skinId, setSkinId] = useState(SKIN_POR_DEFECTO);
  const theme = skinPorId(skinId);

  const [negocioNombre, setNegocioNombre] = useState("");
  const [negocioTelefono, setNegocioTelefono] = useState("");
  const [negocioUbicacion, setNegocioUbicacion] = useState(null); // { lat, lng }
  const [ubicacionError, setUbicacionError] = useState("");
  const [ubicacionCargando, setUbicacionCargando] = useState(false);

  // datos bancarios, para mostrarlos cuando el cliente paga por transferencia
  const [bancoNombre, setBancoNombre] = useState("");
  const [bancoBeneficiario, setBancoBeneficiario] = useState("");
  const [bancoNumeroCuenta, setBancoNumeroCuenta] = useState("");
  const [copiadoCuenta, setCopiadoCuenta] = useState(false);

  // ---------- datos ----------
  const [pedidos, setPedidos] = useState([]); // ventas confirmadas
  const [productos, setProductos] = useState([]);
  const [fileName, setFileName] = useState("");
  const [parseError, setParseError] = useState("");
  const fileInputRef = useRef(null);

  const [cart, setCart] = useState({});

  // ---------- identificación del cliente ----------
  const [clienteActivo, setClienteActivo] = useState(null); // { nombre, telefono }
  const [telForm, setTelForm] = useState("");
  const [nombreForm, setNombreForm] = useState("");

  // ---------- checkout ----------
  const [entrega, setEntrega] = useState("recoger");
  const [direccion, setDireccion] = useState("");
  const [direccionGps, setDireccionGps] = useState(null); // punto de entrega de este pedido
  const [direccionGpsError, setDireccionGpsError] = useState("");
  const [direccionGpsCargando, setDireccionGpsCargando] = useState(false);
  const [direccionesClientes, setDireccionesClientes] = useState({}); // telefono -> { direccion, gps }
  const [pago, setPago] = useState("efectivo");
  const [comentarios, setComentarios] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const [pedidoFinal, setPedidoFinal] = useState(null);
  const [pedidoEnviado, setPedidoEnviado] = useState(false); // impide registrar dos veces la misma venta

  // ---------- horario de servicio ----------
  const [horario, setHorario] = useState(HORARIO_INICIAL);
  const [showHorarioModal, setShowHorarioModal] = useState(false);
  const [recargoAplicado, setRecargoAplicado] = useState(false);
  const [horarioResuelto, setHorarioResuelto] = useState(false);

  // ---------- carga inicial desde el backend ----------
  // `hidratado` evita que el primer render (con el estado vacío) sobrescriba en la
  // API lo que todavía no habíamos terminado de leer.
  const [hidratado, setHidratado] = useState(false);

  useEffect(() => {
    if (!sesion) return undefined;

    let vigente = true;
    (async () => {
      // El histórico de ventas y el mapa de direcciones son del administrador;
      // en modo cliente ni se piden, porque la API responde 403.
      const [negocio, catalogo, ventas, direcciones] = await Promise.all([
        api.negocio.obtener(),
        api.productos.listar(),
        esAdmin ? api.pedidos.listar() : Promise.resolve(null),
        esAdmin ? api.direcciones.obtener() : Promise.resolve(null),
      ]);
      if (!vigente) return;

      if (negocio) {
        setNegocioNombre(negocio.nombre || "");
        setNegocioTelefono(negocio.telefono || "");
        setNegocioUbicacion(negocio.ubicacion || null);
        setBancoNombre(negocio.banco?.nombre || "");
        setBancoBeneficiario(negocio.banco?.beneficiario || "");
        setBancoNumeroCuenta(negocio.banco?.numeroCuenta || "");
        setSkinId(negocio.skinId || SKIN_POR_DEFECTO);
        if (negocio.horario) setHorario(negocio.horario);
      }
      if (Array.isArray(catalogo)) setProductos(catalogo);
      if (Array.isArray(ventas)) setPedidos(ventas);
      if (direcciones) setDireccionesClientes(direcciones);

      setHidratado(true);
    })();
    return () => {
      vigente = false;
    };
  }, [sesion, esAdmin]);

  // ---------- persistencia ----------
  // La configuración y el catálogo se guardan enteros con un pequeño retardo: las
  // pantallas los editan campo por campo y no tiene sentido una llamada por tecla.
  const configNegocio = useMemo(
    () => ({
      nombre: negocioNombre,
      telefono: negocioTelefono,
      ubicacion: negocioUbicacion,
      banco: { nombre: bancoNombre, beneficiario: bancoBeneficiario, numeroCuenta: bancoNumeroCuenta },
      skinId,
      horario,
    }),
    [negocioNombre, negocioTelefono, negocioUbicacion, bancoNombre, bancoBeneficiario, bancoNumeroCuenta, skinId, horario]
  );

  // Los tres guardados van contra rutas de administración: en modo cliente la
  // API los rechazaría con 403, así que ni se intentan.
  useEffect(() => {
    if (!hidratado || !esAdmin) return undefined;
    const t = setTimeout(() => api.negocio.guardar(configNegocio), 600);
    return () => clearTimeout(t);
  }, [hidratado, esAdmin, configNegocio]);

  useEffect(() => {
    if (!hidratado || !esAdmin) return undefined;
    const t = setTimeout(() => api.productos.reemplazar(productos), 600);
    return () => clearTimeout(t);
  }, [hidratado, esAdmin, productos]);

  useEffect(() => {
    if (!hidratado || !esAdmin) return undefined;
    const t = setTimeout(() => api.direcciones.guardar(direccionesClientes), 600);
    return () => clearTimeout(t);
  }, [hidratado, esAdmin, direccionesClientes]);

  // En modo cliente el comprador solo puede tocar SU dirección, así que se lee
  // suelta en cuanto se identifica y se guarda suelta al enviar el pedido.
  useEffect(() => {
    if (!clienteActivo || esAdmin) return undefined;
    let vigente = true;
    api.direcciones.obtenerDe(clienteActivo.telefono).then((guardada) => {
      if (!vigente || !guardada) return;
      setDireccionesClientes((prev) => ({ ...prev, [digits(clienteActivo.telefono)]: guardada }));
    });
    return () => {
      vigente = false;
    };
  }, [clienteActivo, esAdmin]);

  // ---------- navegación ----------
  function irA(key) {
    setView(key);
    setDrawerOpen(false);
    if (key === "catalogo" && clienteActivo && !horarioResuelto && !estaEnHorario(horario)) {
      setShowHorarioModal(true);
    }
  }

  /**
   * Deja el formulario de checkout en blanco. Se usa al cambiar de cliente, al cerrar
   * sesión y al terminar un pedido, para que los datos de un cliente (dirección, GPS,
   * comentarios, forma de pago) no se filtren al siguiente.
   */
  function limpiarDatosPedido() {
    setEntrega("recoger");
    setDireccion("");
    setDireccionGps(null);
    setDireccionGpsError("");
    setPago("efectivo");
    setComentarios("");
    setCheckoutError("");
    setRecargoAplicado(false);
    setHorarioResuelto(false);
  }

  /**
   * Vacía todo lo que pertenece a una tienda concreta. Se usa al entrar en una y
   * al salir: sin esto, el catálogo o las ventas de la anterior se quedarían a la
   * vista mientras carga la nueva.
   */
  function limpiarDatosTienda() {
    setClienteActivo(null);
    setTelForm("");
    setNombreForm("");
    setCart({});
    limpiarDatosPedido();
    setPedidoFinal(null);
    setPedidoEnviado(false);
    setProductos([]);
    setPedidos([]);
    setDireccionesClientes({});
    setNegocioNombre("");
    setNegocioTelefono("");
    setNegocioUbicacion(null);
    setBancoNombre("");
    setBancoBeneficiario("");
    setBancoNumeroCuenta("");
    setSkinId(SKIN_POR_DEFECTO);
    setHorario(HORARIO_INICIAL);
    setFileName("");
    setParseError("");
  }

  /**
   * Guarda la sesión y deja la aplicación lista para hidratar la tienda nueva.
   * El dueño aterriza en Productos, que es donde empieza su trabajo; el cliente,
   * en la tienda, que es lo único que ve.
   */
  function aplicarSesion(nueva) {
    setHidratado(false);
    limpiarDatosTienda();
    guardarSesion(nueva);
    setSesion(nueva);
    fijarUrlDeTienda(nueva.idNegocio);
    setDrawerOpen(false);
    setView(nueva.modo === MODO.admin ? "productos" : "catalogo");
    return nueva;
  }

  /** INICIEMOS: deja atrás la portada y enseña la pantalla de acceso. */
  function comenzar() {
    setBienvenidaVista(true);
  }

  /** Qué es lo escrito en la pantalla de entrada. Lanza si el servidor no responde. */
  function resolverAcceso(valor) {
    return api.acceso.resolver(valor);
  }

  /** Modo cliente: basta el ID del negocio, no hay token que pedir. */
  function entrarComoCliente({ idNegocio, nombreTienda }) {
    return aplicarSesion({ modo: MODO.cliente, idNegocio, nombreTienda });
  }

  /**
   * Entrada por enlace: `/abarrote-sjuan` abre esa tienda en modo cliente.
   *
   * El enlace manda sobre la sesión guardada, porque quien recibe el link de una
   * tienda quiere ver esa y no la última que visitó. La única excepción es que
   * la sesión ya sea de la misma tienda: entonces se respeta tal cual, y así el
   * dueño que abre su propio enlace sigue siendo administrador.
   *
   * Solo corre una vez, al arrancar. Después la URL la lleva `aplicarSesion`.
   */
  const enlaceLeido = useRef(false);

  useEffect(() => {
    if (enlaceLeido.current) return undefined;
    enlaceLeido.current = true;

    const slug = slugDeUrl();
    if (!slug) return undefined;

    if (leerSesion()?.idNegocio === slug) {
      setEntrandoPorEnlace(false);
      return undefined;
    }

    let vigente = true;
    api.acceso
      .resolver(slug)
      .then((r) => {
        if (!vigente) return;
        if (r?.tipo === "negocio") entrarComoCliente(r);
        // El enlace nombra algo que no es una tienda abierta: se limpia la URL y
        // se cae en la pantalla de entrada de siempre.
        else fijarUrlDeTienda(null);
      })
      .catch(() => vigente && fijarUrlDeTienda(null))
      .finally(() => vigente && setEntrandoPorEnlace(false));

    return () => {
      vigente = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Entra como administrador con un token recién emitido.
   *
   * Los tres caminos que abren sesión de dueño —contraseña, alta normal y
   * activación por código— acaban aquí con la misma respuesta del servidor. La
   * activación lo llama aparte, y no en cuanto responde el servidor, porque
   * antes enseña el mensaje de cuenta creada con el ID de la tienda.
   */
  function entrarConSesionAdmin(r) {
    return aplicarSesion({
      modo: MODO.admin,
      idNegocio: r.idNegocio,
      nombreTienda: r.nombreTienda,
      token: r.token,
    });
  }

  /** Modo administrador. Lanza si la clave falla o la cuenta está suspendida. */
  async function entrarComoAdmin(telefono, password) {
    return entrarConSesionAdmin(await api.acceso.admin(telefono, password));
  }

  /** Alta de tienda. Entra directo como administrador. Lanza si el alta falla. */
  async function registrarTienda(datos) {
    return entrarConSesionAdmin(await api.acceso.registrar(datos));
  }

  /**
   * Alta por código, primer paso: n8n manda el código al WhatsApp indicado.
   * Lanza si el número ya tiene tienda o no es válido.
   */
  function solicitarCodigo(telefono) {
    return api.acceso.solicitarCodigo(telefono);
  }

  /**
   * Alta por código, segundo paso: el código crea la cuenta y su tienda.
   *
   * Devuelve la sesión sin aplicarla, para que la pantalla pueda enseñar el ID
   * de la tienda recién creada antes de entrar.
   */
  function activarCuenta({ telefono, codigo }) {
    return api.acceso.activar({ telefono, codigo });
  }

  /**
   * Cambia los datos de la cuenta desde "Mi perfil".
   *
   * El nombre y el teléfono son un solo dato aunque se guarden en dos archivos:
   * el servidor los refleja en la configuración del negocio y aquí se ponen al
   * día en memoria, para que el guardado automático no vuelva a escribir los
   * valores viejos. Lanza si algo falla, para que la pantalla lo enseñe.
   */
  async function actualizarCuenta(datos) {
    const cuenta = await api.cuenta.actualizar(datos);
    setNegocioNombre(cuenta.nombreTienda);
    setNegocioTelefono(cuenta.telefono);
    setSesion((prev) => guardarSesion({ ...prev, nombreTienda: cuenta.nombreTienda }));
    return cuenta;
  }

  /** Sale de la tienda y vuelve a la pantalla de entrada. */
  function cerrarSesion() {
    if (sesion?.token) api.acceso.salir().catch(() => {});
    borrarSesion();
    setSesion(null);
    fijarUrlDeTienda(null);
    setHidratado(false);
    limpiarDatosTienda();
    setDrawerOpen(false);
    setView("catalogo");
    setBienvenidaVista(false); // salir devuelve a la portada, que es la puerta
    setSesionMsg("Sesión cerrada.");
    setTimeout(() => setSesionMsg(""), 4000);
  }

  // ---------- base de clientes (derivada de los pedidos) ----------
  const clientesDB = useMemo(() => {
    const map = new Map();
    pedidos.forEach((p) => {
      const d = digits(p.telefono);
      const prev = map.get(d) || { telefono: p.telefono, nombre: p.nombre, pedidos: 0, total: 0, ultimaFecha: p.fecha, ultimaFechaISO: p.fechaISO };
      prev.nombre = p.nombre;
      prev.pedidos += 1;
      prev.total += p.total;
      if (new Date(p.fechaISO) >= new Date(prev.ultimaFechaISO)) {
        prev.ultimaFecha = p.fecha;
        prev.ultimaFechaISO = p.fechaISO;
      }
      map.set(d, prev);
    });
    return Array.from(map.values()).sort((a, b) => new Date(b.ultimaFechaISO) - new Date(a.ultimaFechaISO));
  }, [pedidos]);

  // ---------- identificación (se resuelve sola, sin botón) ----------
  const matchCliente = useMemo(() => {
    const d = digits(telForm);
    if (d.length < 7) return null;
    return clientesDB.find((c) => digits(c.telefono) === d) || null;
  }, [telForm, clientesDB]);

  function activarCliente(nombre, telefono) {
    setClienteActivo({ nombre, telefono });
    if (!estaEnHorario(horario)) setShowHorarioModal(true);
  }

  // en cuanto el teléfono coincide con un cliente ya registrado, entra directo
  useEffect(() => {
    if (!clienteActivo && matchCliente && digits(telForm).length >= 7) {
      activarCliente(matchCliente.nombre, telForm.trim());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchCliente]);

  /** Cliente nuevo: al terminar de escribir el nombre (blur o Enter) entra a la tienda. */
  function intentarActivarNuevo() {
    if (clienteActivo) return;
    const d = digits(telForm);
    if (d.length < 7 || matchCliente) return;
    const nombre = nombreForm.trim();
    if (!nombre) return;
    activarCliente(nombre, telForm.trim());
  }

  function cambiarIdentidad() {
    setClienteActivo(null);
    setTelForm("");
    setNombreForm("");
    limpiarDatosPedido();
    setPedidoFinal(null);
    setPedidoEnviado(false);
  }

  // ---------- ubicación ----------
  function obtenerUbicacionGPS() {
    setUbicacionError("");
    setUbicacionCargando(true);
    obtenerCoordenadas()
      .then(setNegocioUbicacion)
      .catch((err) => setUbicacionError(err.message))
      .finally(() => setUbicacionCargando(false));
  }

  function obtenerUbicacionDireccion() {
    setDireccionGpsError("");
    setDireccionGpsCargando(true);
    obtenerCoordenadas()
      .then(setDireccionGps)
      .catch((err) => setDireccionGpsError(err.message))
      .finally(() => setDireccionGpsCargando(false));
  }

  function copiarNumeroCuenta() {
    copiarTexto(bancoNumeroCuenta).then(() => {
      setCopiadoCuenta(true);
      setTimeout(() => setCopiadoCuenta(false), 2000);
    });
  }

  // ---------- catálogo ----------
  function manejarArchivo(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setParseError("");
    setFileName(file.name);
    leerProductosDeExcel(file)
      .then((mapped) => {
        setProductos(mapped);
        setCart({});
        setView("productos");
      })
      .catch(() => {
        setParseError("No pudimos leer el archivo. Verifica que tenga columnas de categoría, producto, unidad, precio venta y precio costo.");
      });
  }

  function actualizarProducto(id, campo, valor) {
    setProductos((prev) => prev.map((p) => (p.id === id ? { ...p, [campo]: valor } : p)));
  }

  function manejarImagenProducto(id, file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => actualizarProducto(id, "imagen", e.target.result);
    reader.readAsDataURL(file);
  }

  function eliminarProducto(id) {
    setProductos((prev) => prev.filter((p) => p.id !== id));
    setCart((prev) => {
      const { [id]: _, ...resto } = prev;
      return resto;
    });
  }

  function agregarProductoManual() {
    setProductos((prev) => [productoVacio(), ...prev]);
  }

  // ---------- carrito ----------
  const categorias = useMemo(() => {
    const map = new Map();
    productos.filter((p) => p.producto.trim()).forEach((p) => {
      if (!map.has(p.categoria)) map.set(p.categoria, []);
      map.get(p.categoria).push(p);
    });
    return Array.from(map.entries());
  }, [productos]);

  function cambiarCantidad(p, delta) {
    setCart((prev) => {
      const actual = prev[p.id]?.cantidad || 0;
      const nueva = Math.max(0, actual + delta);
      if (nueva === 0) {
        const { [p.id]: _, ...resto } = prev;
        return resto;
      }
      return { ...prev, [p.id]: { ...p, cantidad: nueva } };
    });
  }

  const itemsCarrito = Object.values(cart);
  const totalItems = itemsCarrito.reduce((s, i) => s + i.cantidad, 0);
  const totalPedido = itemsCarrito.reduce((s, i) => s + i.cantidad * i.precioVenta, 0);

  const recargoMonto = recargoAplicado ? Math.round(totalPedido * (horario.recargo / 100)) : 0;
  const totalConRecargo = totalPedido + recargoMonto;

  // ---------- checkout ----------
  function irACheckout() {
    if (totalItems === 0) return;
    if (!clienteActivo) { setView("catalogo"); return; }
    if (!horarioResuelto && !estaEnHorario(horario)) {
      setShowHorarioModal(true);
      return;
    }
    // recordamos la última dirección que este cliente usó
    const recordada = direccionesClientes[digits(clienteActivo.telefono)];
    if (recordada && !direccion.trim()) {
      setDireccion(recordada.direccion || "");
      setDireccionGps(recordada.gps || null);
    }
    setCheckoutError("");
    setView("checkout");
  }

  function vaciarCarrito() {
    setCart({});
  }

  function programarParaProximoHorario() {
    const { texto } = proximaAtencion(horario);
    setComentarios((prev) => {
      const nota = `Pedido programado para ${texto}.`;
      return prev.trim() ? `${prev.trim()}\n${nota}` : nota;
    });
    setRecargoAplicado(false);
    setHorarioResuelto(true);
    setShowHorarioModal(false);
    setView("catalogo");
  }

  function comprarConRecargo() {
    setRecargoAplicado(true);
    setHorarioResuelto(true);
    setShowHorarioModal(false);
    setView("catalogo");
  }

  /**
   * Arma el mensaje y muestra la pantalla de confirmación. El pedido todavía no
   * queda registrado ni se limpia el carrito hasta que se envía por WhatsApp,
   * para poder volver atrás y editarlo si hace falta.
   */
  function finalizarPedido() {
    if (!clienteActivo) { setView("catalogo"); return; }
    if (entrega === "domicilio" && !direccion.trim()) { setCheckoutError("Escribe la dirección de entrega."); return; }
    setCheckoutError("");

    const { nombre, telefono } = clienteActivo;
    const entregaTexto = textoEntrega(entrega, direccion);
    const gps = entrega === "domicilio" ? direccionGps : null;

    const mensaje = armarMensajePedido({
      nombre,
      telefono,
      items: itemsCarrito,
      entregaTexto,
      pagoTexto: ETIQUETA_PAGO[pago],
      comentarios,
      gps,
      recargoPorcentaje: horario.recargo,
      recargoMonto,
      total: totalConRecargo,
    });

    setPedidoFinal({
      nombre,
      telefono,
      items: itemsCarrito,
      total: totalConRecargo,
      utilidad: utilidadDeItems(itemsCarrito, recargoMonto),
      entrega: entregaTexto,
      pago: ETIQUETA_PAGO[pago],
      comentarios: comentarios.trim(),
      mensaje,
      direccion: entrega === "domicilio" ? direccion.trim() : "",
      direccionGps: gps,
    });
    setPedidoEnviado(false); // este pedido todavía no se envió, aunque el anterior sí
    setView("confirmacion");
  }

  /**
   * Se llama al volver a Tienda/Carrito desde la confirmación para corregir el pedido:
   * no borra nada, solo regresa (el pedido aún no se registró ni se limpió el carrito).
   */
  function editarPedido() {
    setView("checkout");
  }

  /**
   * Abre WhatsApp con el mensaje ya armado. No registra nada: se puede llamar
   * otra vez si el usuario cerró la pestaña de WhatsApp por error.
   */
  function abrirWhatsapp() {
    if (!pedidoFinal) return;
    const url = enlaceWhatsapp(negocioTelefono, pedidoFinal.mensaje);
    if (url) window.open(url, "_blank");
  }

  /**
   * Esto es lo que realmente "termina" el pedido: registra la venta, recuerda la
   * dirección del cliente y limpia el carrito y el formulario.
   * Corre UNA sola vez por pedido: `pedidoEnviado` bloquea el segundo clic (o el
   * doble toque en móvil) que si no registraría la misma venta dos veces.
   */
  function enviarWhatsapp() {
    if (!digits(negocioTelefono) || !pedidoFinal || pedidoEnviado) return;

    const ahora = new Date();
    const venta = {
      id: Date.now(),
      nombre: pedidoFinal.nombre,
      telefono: pedidoFinal.telefono,
      total: pedidoFinal.total,
      utilidad: pedidoFinal.utilidad,
      fecha: ahora.toLocaleString("es-CO"),
      fechaISO: ahora.toISOString(),
      items: pedidoFinal.items,
    };
    setPedidos((prev) => [...prev, venta]);
    api.pedidos.crear(venta);

    if (pedidoFinal.direccion) {
      const recordar = { direccion: pedidoFinal.direccion, gps: pedidoFinal.direccionGps || null };
      setDireccionesClientes((prev) => ({ ...prev, [digits(pedidoFinal.telefono)]: recordar }));
      // el administrador guarda el mapa entero con el efecto de arriba; el
      // comprador solo puede escribir la suya
      if (!esAdmin) api.direcciones.guardarDe(pedidoFinal.telefono, recordar);
    }

    setPedidoEnviado(true);
    abrirWhatsapp();

    // pedido terminado: limpiar carrito y formulario para el siguiente
    setCart({});
    limpiarDatosPedido();
  }

  function nuevoPedido() {
    setCart({});
    limpiarDatosPedido();
    setPedidoFinal(null);
    setPedidoEnviado(false);
    setView("catalogo");
  }

  // ---------- finanzas (utilidad real = venta - costo) ----------
  const [periodoFinanzas, setPeriodoFinanzas] = useState("dia"); // dia | semana | mes

  const finanzas = useMemo(() => {
    const ahora = new Date();
    const hoy = ahora.toDateString();
    const mesActual = ahora.getMonth();
    const anioActual = ahora.getFullYear();
    const iniSemana = inicioSemana(ahora);
    const finSemana = new Date(iniSemana);
    finSemana.setDate(finSemana.getDate() + 7);

    function filtrarPorPeriodo(periodo) {
      return pedidos.filter((p) => {
        const d = new Date(p.fechaISO);
        if (periodo === "dia") return d.toDateString() === hoy;
        if (periodo === "semana") return d >= iniSemana && d < finSemana;
        return d.getMonth() === mesActual && d.getFullYear() === anioActual;
      });
    }

    const resumenPorPeriodo = {};
    ["dia", "semana", "mes"].forEach((periodo) => {
      const filtrados = filtrarPorPeriodo(periodo);
      resumenPorPeriodo[periodo] = {
        ingresos: filtrados.reduce((s, p) => s + p.total, 0),
        utilidad: filtrados.reduce((s, p) => s + p.utilidad, 0),
        pedidos: filtrados.length,
      };
    });

    const sinCosto = productos.some((p) => p.producto.trim() && !p.precioCosto);

    return { resumenPorPeriodo, sinCosto };
  }, [pedidos, productos]);

  // ingresos, con selector de rango (por defecto: hoy)
  const [ingresosDesde, setIngresosDesde] = useState(hoyISO());
  const [ingresosHasta, setIngresosHasta] = useState(hoyISO());

  const ingresosPedidosFiltrados = useMemo(
    () => filtrarPorRango(pedidos, ingresosDesde, ingresosHasta).slice().reverse(),
    [pedidos, ingresosDesde, ingresosHasta]
  );

  // utilidad por pedido, con selector de rango (por defecto: todos)
  const [pedidosDesde, setPedidosDesde] = useState("");
  const [pedidosHasta, setPedidosHasta] = useState("");

  const pedidosFiltrados = useMemo(
    () => filtrarPorRango(pedidos, pedidosDesde, pedidosHasta).slice().reverse(),
    [pedidos, pedidosDesde, pedidosHasta]
  );

  // utilidad por cliente: total = suma de (venta - costo) de todos sus pedidos
  const [clientesDesde, setClientesDesde] = useState("");
  const [clientesHasta, setClientesHasta] = useState("");

  const porClienteFiltrado = useMemo(() => {
    const filtrados = filtrarPorRango(pedidos, clientesDesde, clientesHasta);
    const map = new Map();
    filtrados.forEach((p) => {
      const k = digits(p.telefono) || p.nombre;
      const prev = map.get(k) || { nombre: p.nombre, telefono: p.telefono, pedidos: 0, total: 0 };
      prev.nombre = p.nombre;
      prev.pedidos += 1;
      prev.total += p.utilidad;
      map.set(k, prev);
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [pedidos, clientesDesde, clientesHasta]);

  const valor = {
    // acceso
    sesion, esAdmin, resolverAcceso, entrarComoCliente, entrarComoAdmin, registrarTienda,
    actualizarCuenta, enlaceTienda, entrandoPorEnlace,
    bienvenidaVista, comenzar, solicitarCodigo, activarCuenta, entrarConSesionAdmin,
    // navegación
    view, setView, drawerOpen, setDrawerOpen, sesionMsg, irA, cerrarSesion,
    // negocio
    skinId, setSkinId, theme,
    negocioNombre, setNegocioNombre, negocioTelefono, setNegocioTelefono,
    negocioUbicacion, ubicacionError, ubicacionCargando, obtenerUbicacionGPS,
    bancoNombre, setBancoNombre, bancoBeneficiario, setBancoBeneficiario,
    bancoNumeroCuenta, setBancoNumeroCuenta, copiadoCuenta, copiarNumeroCuenta,
    // catálogo
    productos, fileName, parseError, fileInputRef,
    manejarArchivo, actualizarProducto, manejarImagenProducto, eliminarProducto, agregarProductoManual,
    categorias,
    // cliente
    clienteActivo, telForm, setTelForm, nombreForm, setNombreForm,
    matchCliente, intentarActivarNuevo, cambiarIdentidad, clientesDB,
    // carrito
    cart, cambiarCantidad, itemsCarrito, totalItems, totalPedido, vaciarCarrito,
    // checkout
    entrega, setEntrega, direccion, setDireccion, direccionGps, setDireccionGps,
    direccionGpsError, direccionGpsCargando, obtenerUbicacionDireccion,
    pago, setPago, comentarios, setComentarios, checkoutError,
    irACheckout, finalizarPedido, editarPedido, nuevoPedido,
    pedidoFinal, pedidoEnviado, abrirWhatsapp, enviarWhatsapp,
    // horario
    horario, setHorario, showHorarioModal, setShowHorarioModal,
    recargoAplicado, recargoMonto, totalConRecargo,
    programarParaProximoHorario, comprarConRecargo,
    // finanzas
    pedidos, periodoFinanzas, setPeriodoFinanzas, finanzas,
    ingresosDesde, setIngresosDesde, ingresosHasta, setIngresosHasta, ingresosPedidosFiltrados,
    pedidosDesde, setPedidosDesde, pedidosHasta, setPedidosHasta, pedidosFiltrados,
    clientesDesde, setClientesDesde, clientesHasta, setClientesHasta, porClienteFiltrado,
  };

  return <TiendaContext.Provider value={valor}>{children}</TiendaContext.Provider>;
}
