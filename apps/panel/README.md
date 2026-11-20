# Panel de administración — La Luz del Tiempo

Base: plantilla **Blakor Admin Pro** (React 19 + Vite + TypeScript + Tailwind + shadcn/ui + TanStack Router, Query, Table y Form).

## Comandos

Desde la raíz del monorepo:

```bash
pnpm install
pnpm --filter @luz/panel dev     # http://localhost:3000
pnpm --filter @luz/panel build   # tsgo --noEmit + vite build
```

## Organización

- `src/app/` — providers y router.
- `src/shared/` — componentes de la plantilla (layout, UI, tablas), contextos, utilidades y cliente de API.
- `src/modules/<dominio>/` — un módulo por dominio (usuarios, staff, auditoría, configuración…), cada uno con `pages/`, `components/`, `hooks/`, `data/` y `types/`.

Estado: primera pasada de limpieza. Los módulos siguen con datos de prueba de la plantilla; se conectarán a la API en `apps/api`.
