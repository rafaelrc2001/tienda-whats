# Pedidos Tienda

Catálogo y pedidos por WhatsApp para tiendas de barrio.

- `backend/` — API en Node + Express, persistencia en archivos JSON.
- `frontend/` — React + Vite + Tailwind.
- `docs/` — especificación y el prototipo monolítico original.

## Puesta en marcha

```bash
npm install
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
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

## API

| Método | Ruta | |
| --- | --- | --- |
| GET | `/api/health` | Estado del servicio. |
| GET/PUT | `/api/negocio` | Nombre, WhatsApp, ubicación, banco, horario y tema. |
| GET/PUT | `/api/productos` | Catálogo completo. |
| GET/POST | `/api/pedidos` | Ventas confirmadas. |
| GET | `/api/pedidos/resumen?desde&hasta` | Ingresos y utilidad. |
| GET | `/api/clientes` | Clientes derivados de los pedidos. |
| GET/PUT | `/api/clientes/direcciones` | Última dirección por teléfono. |

Si la API no responde, el frontend sigue funcionando en memoria como el prototipo original.
