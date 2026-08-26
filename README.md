# Pedidos Tienda

Catálogo y pedidos por WhatsApp para tiendas de barrio.

- `backend/` — API en Node + Express, persistencia en PostgreSQL.
- `frontend/` — React + Vite + Tailwind.
- `docs/` — especificación y el prototipo monolítico original.

## Puesta en marcha

Hace falta un PostgreSQL 13 o posterior corriendo.

```bash
npm install
cp backend/.env.example backend/.env      # y ajustar los datos de conexión
cp frontend/.env.example frontend/.env

createdb pedidos_tienda
psql -d pedidos_tienda -f backend/db/schema.sql

npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:4000/api

## Comandos

| Comando | Qué hace |
| --- | --- |
| `npm install` | Instala backend y frontend (workspaces). |
| `npm run dev` | Levanta API y frontend a la vez. |
| `npm run dev:backend` | Solo la API, con recarga. |
| `npm run dev:frontend` | Solo el frontend. |
| `npm run build` | Compila el frontend a `frontend/dist`. |
| `npm start` | Arranca la API en producción; si existe `frontend/dist`, la sirve también. |
| `npm run lint` | ESLint en los dos paquetes. |
| `npm run db:schema -w backend` | Aplica el esquema a la base indicada en el entorno. |
| `npm run db:reset -w backend` | Borra las tablas y las vuelve a crear. Se lleva los datos. |
| `npm run db:importar -w backend` | Sube a la base los JSON de una instalación anterior. |

## Cuentas y entornos

Cada tienda es un entorno aislado. El dueño crea su cuenta con su número de
WhatsApp, que hace de nombre de usuario, y del nombre de la tienda sale un
`idNegocio` —un slug como `abarrotes-maria`— que **nunca cambia**, aunque
después renombre el negocio.

Hay dos formas de entrar:

| Modo | Cómo se entra | Qué ve |
| --- | --- | --- |
| **Administrador** | Teléfono + contraseña | Todas las secciones |
| **Cliente** | Solo el `idNegocio` | Únicamente "Tienda" |

La restricción se aplica en la API, no solo en el menú: las rutas de
administración responden `403` sin un token válido de esa tienda.

## Datos

Todo vive en PostgreSQL. El esquema está en [`backend/db/schema.sql`](backend/db/schema.sql)
y se puede volver a ejecutar sin borrar nada.

| Tabla | Qué guarda |
| --- | --- |
| `cuentas` | Dueños: teléfono, hash bcrypt, `id_negocio` y estatus. |
| `negocios` | Configuración de la tienda: nombre, ubicación, banco, horario y tema. |
| `sesiones` | Token -> tienda, de las sesiones de administrador. |
| `productos` | Catálogo, con su orden de edición. |
| `pedidos` / `pedido_items` | Histórico de ventas: la cabecera y sus renglones. |
| `direcciones` | Última dirección de entrega de cada teléfono. |

Todas cuelgan de `cuentas.id_negocio` con `ON DELETE CASCADE`: borrar una tienda
es borrar su fila en `cuentas`, y sus productos, pedidos y direcciones se van con
ella. Respaldar una sola tienda es `pg_dump` con las tablas filtradas por ese id;
respaldar todo es un `pg_dump` normal.

### Migrar desde los archivos JSON

Una instalación anterior guardaba los datos en `backend/data/`. Para subirlos:

```bash
npm run db:importar -w backend
```

Lee `backend/data/` (o la carpeta que se le pase como argumento) y se puede
ejecutar más de una vez: lo que ya está en la base no se toca.

### Suspender una cuenta

No hay panel de administración; se hace con una consulta:

```sql
UPDATE cuentas SET estatus = 'suspendido' WHERE id_negocio = 'abarrotes-maria';
```

A partir de ahí el dueño no entra ni con la contraseña correcta, y la tienda
tampoco se abre en modo cliente. Para reactivarla, `estatus = 'activo'`.

## API

Las rutas de datos van contra una tienda concreta, así que **todas** llevan la
cabecera `X-Negocio: <idNegocio>`. Si además se manda `Authorization: Bearer
<token>` y el token es de esa misma tienda, la petición es de administrador; si
no, es de cliente.

### Entrada

Estas no llevan `X-Negocio`: son las que averiguan cuál es la tienda.

| Método | Ruta | |
| --- | --- | --- |
| GET | `/api/health` | Estado del servicio. |
| POST | `/api/acceso/resolver` | Dice si lo escrito es `duenio`, `negocio` o `desconocido`. |
| POST | `/api/acceso/admin` | Teléfono + contraseña. Devuelve token. |
| POST | `/api/acceso/salir` | Invalida el token. |
| POST | `/api/cuentas` | Alta de tienda. Devuelve token. |
| PUT | `/api/cuentas/mi-cuenta` | Teléfono, nombre y contraseña. Solo administrador. |

### Datos de la tienda

| Método | Ruta | Modo | |
| --- | --- | --- | --- |
| GET | `/api/negocio` | ambos | Nombre, WhatsApp, ubicación, banco, horario y tema. |
| PUT | `/api/negocio` | admin | |
| GET | `/api/productos` | ambos | Catálogo completo. |
| PUT | `/api/productos` | admin | |
| POST | `/api/pedidos` | ambos | Registrar una venta. |
| GET | `/api/pedidos` | admin | Histórico de ventas. |
| GET | `/api/pedidos/resumen?desde&hasta` | admin | Ingresos y utilidad. |
| GET | `/api/clientes` | admin | Clientes derivados de los pedidos. |
| GET/PUT | `/api/clientes/direcciones` | admin | Mapa completo de direcciones. |
| GET/PUT | `/api/clientes/direcciones/:telefono` | ambos | La dirección de un solo teléfono. |

El comprador usa la ruta por teléfono para recuperar y guardar la suya sin poder
descargar las direcciones de toda la clientela.

Si la API no responde, el frontend sigue funcionando en memoria como el
prototipo original.
