# La Luz del Tiempo

Plataforma digital del **Ministerio La Luz del Tiempo** (Bolivia): web pública, panel de administración,
app móvil y radio multi-emisora 24/7.

> Proyecto privado desarrollado por **Blakor.tech**.

## Estructura (monorepo con pnpm)

| Carpeta | Qué es | Estado |
|---|---|---|
| `apps/web` | Web pública — React + Vite + Tailwind + Motion | En desarrollo (con datos de prueba) |
| `apps/panel` | Panel de administración — React + Vite | Pendiente |
| `apps/mobile` | App móvil Android — Expo | Pendiente |
| `apps/api` | API 1, administrativa — Hono + PostgreSQL + Better Auth | Pendiente (diseño en `docs/DATABASE.md`) |
| `apps/radio-api` | API 2, técnica — Liquidsoap + Icecast (solo red interna) | Pendiente |
| `packages/shared` | Tipos, esquemas y cliente HTTP compartidos | Pendiente |
| `infra` | Docker Compose, Caddyfile, icecast.xml | Pendiente |

```
Panel / Web / App → API 1 (+ PostgreSQL) → API 2 → Liquidsoap ×N → Icecast → oyentes
```

## Documentación

| Archivo | Contenido |
|---|---|
| [`docs/PLAN.md`](docs/PLAN.md) | Alcance, áreas y plantillas, roles, mapa del sitio, análisis de SUMtv y etapas |
| [`docs/DATABASE.md`](docs/DATABASE.md) | Diseño completo de la base de datos (32 tablas, permisos y reglas) |
| [`docs/PROMPTS-IMAGENES-GEMINI.md`](docs/PROMPTS-IMAGENES-GEMINI.md) | Prompts para generar las imágenes de la demo |

## Cómo levantar la web

Requisitos: Node.js 22+ y pnpm 10 (o usar `npx pnpm@10.18.3` en su lugar).

```bash
pnpm install
pnpm --filter @luz/web dev      # http://localhost:5173
pnpm --filter @luz/web build    # compilación de producción en apps/web/dist
```

Mientras la API no exista, la web usa datos de prueba (`apps/web/src/api/mock.ts` y `mock-extra.ts`).
Cuando esté lista, basta con definir `VITE_API_URL` en `apps/web/.env`.

### Imágenes de la demo

`apps/web/public/demo/` **no se sube al repositorio** (está en `.gitignore`) y se borra de `dist/` al compilar:
son imágenes solo para mostrar la demo al cliente. Sin ellas la web se ve igual, con degradados y el logo
en lugar de fotos. Para tenerlas en otra máquina, copiarlas a mano a esa carpeta.

## Stack de la web

- **React 19** + **Vite** + **TypeScript**
- **Tailwind CSS 4** (paleta azul noche `#0b1324` y dorado `#e2a927`)
- **Motion** para animaciones
- **TanStack Query** para los datos
- Fuentes: **Clash Display** (títulos), **Satoshi** (texto), **Fraunces** (acentos)
