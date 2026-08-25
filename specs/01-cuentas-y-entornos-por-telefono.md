# SPEC 01 — Cuentas y entornos de tienda a partir del teléfono

> **Estado:** Aprobado
> **Depende de:** —
> **Fecha:** 2026-08-25
> **Objetivo:** Que cada dueño cree su cuenta con su número de WhatsApp y obtenga un entorno de tienda aislado, con acceso en modo administrador (contraseña) o modo cliente (solo el ID del negocio).

---

## Por qué existe esta spec

Hoy el sistema es **mono-tienda**. Existe un único juego de archivos en `backend/data/` y cualquiera que abra la aplicación ve el menú completo: Productos, Clientes, Finanzas y Mi perfil, sin ninguna barrera. El teléfono solo sirve para identificar al comprador.

Esta spec convierte el proyecto en **multi-tienda**: el número de WhatsApp crea la cuenta, la cuenta crea el entorno, y el entorno se abre en dos modos con permisos distintos.

Es el cambio con más alcance del proyecto hasta ahora porque toca las cuatro capas: persistencia, API, contexto del frontend y pantalla de entrada. Por eso la migración de los archivos JSON a una base de datos real queda **fuera** y se aborda en una spec posterior. La nota de cabecera de `backend/src/repositories/jsonStore.js` ya deja dicho que ese cambio no debe salir de `repositories/`, y esta spec respeta esa frontera.

---

## Alcance

**Dentro:**

- Registro de cuenta con teléfono de WhatsApp (usuario), contraseña y nombre de tienda.
- Generación del `idNegocio` como slug del nombre de la tienda, con sufijo numérico si choca.
- Creación automática del entorno aislado de la tienda al registrarse, con catálogo vacío.
- Estatus de cuenta `activo` / `suspendido`, respetado en el acceso.
- Contraseña almacenada con hash bcrypt, nunca en claro.
- Aislamiento de datos por carpeta: `data/tiendas/<idNegocio>/`.
- Pantalla de entrada de un solo campo que deduce si lo escrito es un teléfono de dueño o un ID de negocio.
- Modo administrador: pide contraseña, ve todas las secciones del menú.
- Modo cliente: entra solo con el ID del negocio, ve únicamente "Tienda".
- Sesión persistente por token en `localStorage`, sin caducidad, con "Cerrar sesión".
- Restricción de las rutas de administración en el **backend** (403), además de ocultarlas en el menú.
- Edición de teléfono, nombre de tienda y contraseña desde "Mi perfil".

**Fuera de alcance (para specs futuras):**

- Migración de la persistencia a SQLite o Postgres.
- Verificación real del número por código OTP a WhatsApp o SMS.
- Recuperación de contraseña olvidada.
- Panel de superadministrador para listar y suspender tiendas desde la aplicación.
- Cuentas propias para el comprador (historial entre tiendas, login de cliente).
- Migración de los datos actuales de `backend/data/`: se descartan.
- Suspensión automática por inactividad o falta de pago.

---

## Modelo de datos

### Cuentas — `backend/data/cuentas.json` (global)

```js
[
  {
    telefono: "573001234567",      // solo dígitos; es el nombre de usuario
    passwordHash: "$2b$10$...",    // bcrypt, coste 10
    nombreTienda: "Abarrotes María",
    idNegocio: "abarrotes-maria",  // slug, inmutable
    estatus: "activo",             // "activo" | "suspendido"
    creadaISO: "2026-08-25T14:31:00.000Z",
  },
]
```

### Sesiones — `backend/data/sesiones.json` (global)

```js
{
  "9f3c1a...": { idNegocio: "abarrotes-maria", creadaISO: "2026-08-25T14:32:00.000Z" },
}
```

La clave es el token: 32 bytes aleatorios en hexadecimal, generados con `crypto.randomBytes`. Solo se emiten tokens para el **modo administrador**; el modo cliente no necesita token.

### Entorno de una tienda — `backend/data/tiendas/<idNegocio>/`

```
negocio.json      → misma forma que hoy (NEGOCIO_POR_DEFECTO)
productos.json    → []   (catálogo vacío al crear la cuenta)
pedidos.json      → []
direcciones.json  → {}
```

Ninguno de estos cuatro archivos cambia de forma. Lo único que cambia es **dónde vive cada uno**.

### Sesión en el frontend — `localStorage`

```js
// clave: "pt:sesion"
{
  modo: "admin",                  // "admin" | "cliente"
  idNegocio: "abarrotes-maria",
  nombreTienda: "Abarrotes María",
  token: "9f3c1a...",             // ausente en modo cliente
}
```

### Reglas del `idNegocio`

- Se genera del nombre de la tienda: minúsculas, sin tildes, espacios a guiones, se descarta todo lo que no sea `[a-z0-9-]`.
- Si el slug ya existe, se prueba `-2`, `-3`, y así sucesivamente.
- Es **inmutable**: renombrar la tienda en "Mi perfil" cambia `nombreTienda` pero nunca `idNegocio`, para no invalidar el ID que los clientes ya tienen apuntado ni la carpeta de datos.
- Si el nombre no produce ningún carácter válido (por ejemplo, solo emojis), el registro se rechaza pidiendo otro nombre.

---

## Plan de implementación

Cada paso deja el sistema arrancable con `npm run dev`.

1. **Añadir `bcrypt`** a `backend/package.json` y ejecutar `npm install`. Comprobación: la API sigue arrancando con `npm run dev:backend`.

2. **Parametrizar `jsonStore.js` por tienda.** `crearAlmacen(nombre, porDefecto)` pasa a devolver `leer(idNegocio)`, `escribir(idNegocio, datos)` y `actualizar(idNegocio, fn)`, resolviendo la ruta a `data/tiendas/<idNegocio>/<nombre>.json`. Se añade `crearAlmacenGlobal(nombre, porDefecto)` con la firma actual, para los archivos que no pertenecen a ninguna tienda.

3. **Propagar `idNegocio` por servicios y controladores.** Los cinco servicios (`negocio`, `productos`, `pedidos`, `clientes`, `finanzas`) reciben `idNegocio` como primer argumento y lo pasan al repositorio. Los controladores lo toman de `req.tienda.id`. En este paso la API todavía no resuelve `req.tienda`, así que se fija con un middleware provisional que devuelve un id fijo.

4. **Crear `backend/src/repositories/cuentas.repository.js` y `sesiones.repository.js`** sobre `crearAlmacenGlobal`, con valores por defecto `[]` y `{}`.

5. **Crear `backend/src/services/cuentas.service.js`** con `generarIdNegocio(nombre, existentes)`, `registrar({ telefono, password, nombreTienda })` y `buscarPorTelefono(telefono)`. `registrar` valida los tres campos, rechaza teléfono duplicado, hashea la contraseña y **crea el entorno** escribiendo los cuatro archivos iniciales de la tienda.

6. **Crear `backend/src/services/acceso.service.js`** con `resolver(valor)`, `entrarComoAdmin(telefono, password)` y `cerrarSesion(token)`. `entrarComoAdmin` responde 403 si el estatus es `suspendido` y 401 si la contraseña no coincide; si todo va bien emite el token y lo guarda en `sesiones.json`.

7. **Crear las rutas de acceso** en `backend/src/routes/acceso.routes.js` y montarlas en `routes/index.js`:

   | Método | Ruta | Qué hace |
   | --- | --- | --- |
   | POST | `/api/acceso/resolver` | Devuelve `{ tipo: "duenio" }`, `{ tipo: "negocio", idNegocio, nombreTienda }` o `{ tipo: "desconocido" }`. |
   | POST | `/api/acceso/admin` | Teléfono + contraseña → `{ token, idNegocio, nombreTienda }`. |
   | POST | `/api/acceso/salir` | Invalida el token. |
   | POST | `/api/cuentas` | Registro. Devuelve lo mismo que `/acceso/admin`. |

8. **Crear `backend/src/middlewares/tienda.js`** con dos middlewares. `resolverTienda` lee la cabecera `X-Negocio`, comprueba que la tienda existe y que su cuenta está `activo`, lee el `Authorization: Bearer <token>` y deja `req.tienda = { id, modo }` con `modo` igual a `"admin"` o `"cliente"`. `exigirAdmin` responde 403 si `req.tienda.modo !== "admin"`.

9. **Aplicar los middlewares** en las rutas de datos, sustituyendo el middleware provisional del paso 3:

   - Abiertas a los dos modos: `GET /negocio`, `GET /productos`, `POST /pedidos`.
   - Solo administrador (`exigirAdmin`): `PUT /negocio`, `PUT /productos`, `GET /pedidos`, `GET /pedidos/resumen`, `GET /clientes`, `GET /clientes/direcciones`, `PUT /clientes/direcciones`.

10. **Añadir las rutas de dirección por teléfono** `GET /api/clientes/direcciones/:telefono` y `PUT /api/clientes/direcciones/:telefono`, abiertas a los dos modos. El modo cliente necesita leer y guardar **su** dirección sin poder descargar el mapa completo de direcciones de la tienda.

11. **Crear `frontend/src/lib/sesion.js`**: `leerSesion()`, `guardarSesion(s)` y `borrarSesion()` sobre la clave `pt:sesion` de `localStorage`, envueltas en `try/catch`.

12. **Adaptar `frontend/src/lib/api.js`**: cada petición añade la cabecera `X-Negocio` con el `idNegocio` de la sesión y, si existe token, `Authorization: Bearer`. Se añade el grupo `api.acceso` con `resolver`, `admin`, `registrar` y `salir`, más `api.direcciones.obtenerDe(telefono)` y `guardarDe(telefono, valor)`. Las cuatro llamadas de acceso **sí propagan el error** en vez de devolver `null`, porque la pantalla de entrada necesita distinguir "contraseña incorrecta" de "backend caído".

13. **Añadir el estado de acceso a `TiendaContext.jsx`**: `sesion`, `entrarComoCliente(idNegocio)`, `entrarComoAdmin(telefono, password)`, `registrarTienda(datos)` y `cerrarSesion()`. La hidratación inicial solo se dispara si hay sesión; sin ella la aplicación no llama a la API de datos.

14. **Reescribir `IdentificacionView.jsx`** como pantalla de acceso en dos etapas. Etapa 1: un único campo "Teléfono de WhatsApp o ID del negocio" que al perder el foco llama a `resolver` y, según la respuesta, muestra el campo de contraseña (dueño), entra en modo cliente (negocio) u ofrece el alta de tienda con nombre y contraseña (desconocido). Etapa 2: ya dentro de una tienda en modo cliente, se muestra el formulario actual de identificación del comprador, sin cambios.

15. **Restringir el menú**: `frontend/src/config/menu.js` marca `soloAdmin: true` en `productos`, `clientes`, `perfil` y `finanzas`; `DrawerMenu.jsx` filtra por el modo de la sesión y `App.jsx` no renderiza esas vistas en modo cliente aunque se fuerce el `view`.

16. **Ampliar `PerfilView.jsx`** con un bloque "Mi cuenta": teléfono de usuario, nombre de tienda, `idNegocio` en solo lectura con botón de copiar, y cambio de contraseña (actual + nueva). Se apoya en `PUT /api/cuentas/mi-cuenta`, protegida por `exigirAdmin`.

17. **Documentar** en `README.md` las rutas nuevas, la cabecera `X-Negocio`, la estructura `data/tiendas/<idNegocio>/` y cómo suspender una cuenta a mano editando `estatus` en `cuentas.json`.

---

## Criterios de aceptación

- [ ] Registrarse con teléfono, contraseña y nombre de tienda crea `data/tiendas/<idNegocio>/` con los cuatro archivos JSON.
- [ ] El `idNegocio` generado para "Abarrotes María" es `abarrotes-maria`.
- [ ] Registrar una segunda tienda con el mismo nombre genera `abarrotes-maria-2`.
- [ ] Registrarse con un teléfono ya usado devuelve error y no crea ninguna carpeta.
- [ ] `cuentas.json` no contiene la contraseña en texto plano en ningún campo.
- [ ] Escribir el teléfono del dueño en la pantalla de entrada muestra el campo de contraseña.
- [ ] Con la contraseña correcta se entra en modo administrador y el menú muestra las cinco secciones.
- [ ] Con la contraseña incorrecta aparece un mensaje de error y no se entra.
- [ ] Con `estatus: "suspendido"` en `cuentas.json`, el dueño no entra ni con la contraseña correcta, y ve un mensaje que dice que la cuenta está suspendida.
- [ ] Escribir el `idNegocio` en la pantalla de entrada da acceso en modo cliente sin pedir contraseña.
- [ ] En modo cliente el menú muestra únicamente "Tienda".
- [ ] En modo cliente, tras entrar con el ID, la pantalla pide el WhatsApp del comprador y su nombre si es nuevo, igual que hoy.
- [ ] `GET /api/pedidos` con cabecera `X-Negocio` pero sin token responde 403.
- [ ] `PUT /api/productos` sin token responde 403 y el catálogo no cambia.
- [ ] `POST /api/pedidos` sin token responde 200 y registra la venta.
- [ ] Un pedido creado en la tienda A no aparece en `GET /api/pedidos` de la tienda B.
- [ ] Editar el catálogo en la tienda A no modifica ningún archivo de la tienda B.
- [ ] Recargar la página mantiene el modo y la tienda en los dos modos.
- [ ] "Cerrar sesión" devuelve a la pantalla de entrada y una recarga posterior no reentra.
- [ ] Cambiar el nombre de la tienda en "Mi perfil" no cambia el `idNegocio` ni el nombre de la carpeta de datos.
- [ ] "Mi perfil" muestra el `idNegocio` y permite copiarlo.
- [ ] Cambiar la contraseña obliga a acertar la actual, y la nueva funciona en el siguiente acceso.
- [ ] `npm run lint` pasa en los dos paquetes.

---

## Decisiones

- **Sí:** el teléfono de WhatsApp es el nombre de usuario. Es el dato que el dueño ya conoce y el que la tienda publica; no hay que inventar otro identificador.
- **Sí:** `idNegocio` como slug del nombre de la tienda. El cliente lo teclea a mano, así que tiene que ser legible y fácil de dictar por WhatsApp.
- **No:** ID de seis caracteres aleatorios ni UUID. El primero no es memorable y el segundo no se teclea.
- **Sí:** el slug es inmutable. Si cambiara al renombrar la tienda, se invalidaría el ID que los clientes ya tienen apuntado y habría que mover la carpeta de datos.
- **Sí:** bcrypt con coste 10. Es el estándar y añade una sola dependencia.
- **No:** contraseña en texto plano. Cualquier respaldo de `cuentas.json` expondría todas las cuentas.
- **Sí:** una carpeta por tienda. `jsonStore` casi no cambia, el aislamiento es real y respaldar o borrar una tienda es copiar o borrar una carpeta.
- **No:** un archivo por colección indexado por tienda. Cada venta reescribiría el archivo de todas las tiendas y la cola de escritura de `jsonStore` se volvería un cuello de botella global.
- **No:** SQLite en esta spec. Reescribir los cinco repositorios a la vez que se construyen las cuentas hace la spec demasiado grande. Como los servicios solo ven `leer`, `escribir` y `actualizar`, ese cambio después no tocará nada de lo que se decide aquí.
- **Sí:** token opaco en `sesiones.json`, sin caducidad. Permite invalidar sesiones desde el servidor y evita meter una librería de JWT para un caso que no la necesita.
- **No:** caducidad de 30 días. Es una tienda de barrio en el móvil del dueño; volver a escribir la contraseña cada mes es fricción sin beneficio claro.
- **Sí:** restricción de permisos en el backend además del menú. Ocultar botones no protege nada: la API es llamable directamente.
- **Sí:** rutas de dirección por teléfono para el modo cliente. Sin ellas el comprador tendría que descargar el mapa completo de direcciones de la tienda para leer la suya.
- **Sí:** un único campo en la pantalla de entrada, deduciendo el tipo. Mantiene la pantalla que ya existe en vez de añadir una portada nueva.
- **Sí:** el estatus `suspendido` se cambia editando `cuentas.json` a mano. Construir un panel de superadministrador es una funcionalidad completa aparte, con su propio acceso, vista y permisos.
- **Sí:** descartar los datos actuales de `backend/data/`. Son datos de prueba y escribir código de migración de un solo uso no compensa.
- **No:** cuentas para el comprador. El comprador se sigue identificando con su teléfono dentro de cada tienda, como hoy.
- **No:** verificación OTP y recuperación de contraseña. Ambas exigen un proveedor externo de mensajería, con credenciales y costo por mensaje.

---

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| `POST /acceso/resolver` revela si un teléfono está registrado como dueño. | La respuesta no distingue entre "no registrado" y "registrado pero suspendido", y no devuelve ningún dato de la cuenta salvo el nombre de la tienda cuando lo escrito es un ID de negocio. |
| Un comprador nuevo escribe su propio teléfono en la etapa 1 y el sistema le ofrece crear una tienda. | El texto del campo dice explícitamente "Teléfono de WhatsApp o ID del negocio", y la respuesta `desconocido` pregunta primero si quiere crear una tienda antes de mostrar el formulario de alta. |
| El `idNegocio` es adivinable por ser un slug legible, así que un tercero puede entrar en modo cliente a cualquier tienda. | Es aceptado: el modo cliente solo ve el catálogo, que es precisamente lo que la tienda quiere difundir. Nada sensible es accesible sin token. |
| Un nombre de tienda con caracteres no latinos produce un slug vacío. | El registro rechaza el alta y pide otro nombre; se valida antes de crear la carpeta. |
| Dos registros simultáneos con el mismo nombre generan el mismo slug. | El alta se hace dentro de `actualizar` de `cuentas.json`, que ya está encolado por archivo en `jsonStore`, así que la comprobación de unicidad y la escritura ocurren en la misma operación. |
| `sesiones.json` crece sin límite al no caducar los tokens. | Cada registro pesa unos 100 bytes y "Cerrar sesión" borra el suyo. Si llega a molestar, la limpieza entra en la spec de migración a base de datos. |
| Un fallo a mitad del registro deja la carpeta de la tienda creada sin cuenta asociada. | La cuenta se escribe **antes** que los archivos del entorno; si estos fallan, se crean en la primera lectura porque `jsonStore` ya devuelve el valor por defecto cuando el archivo no existe. |

---

## Lo que **no** entra en esta spec

- Migración de los archivos JSON a SQLite o Postgres.
- Verificación del número de teléfono por código OTP.
- Recuperación de contraseña olvidada.
- Panel de superadministrador dentro de la aplicación.
- Cuentas y login propios para el comprador.
- Suspensión automática de cuentas.
- Migración de los datos que hoy están en `backend/data/`.

Cada una de ellas, si se hace, va en su propia spec.
