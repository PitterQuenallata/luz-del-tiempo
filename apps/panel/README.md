# Blakor Admin Pro

> Starter Kit y Plantilla Comercial para Panel Administrativo Moderno (Dashboard) construida con **React**, **Vite**, **TypeScript (tsgo en Go)**, **Tailwind CSS**, **shadcn/ui** y el **Ecosistema TanStack Completo**.

Para consultar la arquitectura técnica completa, estructura de carpetas, requisitos y diseño de los módulos:
- Consulta el documento maestro de especificaciones: [REQUIREMENTS.md](./REQUIREMENTS.md)

---

## Características Principales

- **Compilación ultrarrápida con Go**: Type-checking con `@typescript/native-preview` (`tsgo`) y soporte nativo en VS Code.
- **Gestor de paquetes**: `pnpm`.
- **Arquitectura Feature / Domain-Driven (FDD)**: Módulos completamente desacoplados y auto-contenidos.
- **Ecosistema TanStack de punta a punta**:
  - TanStack Router (enrutamiento seguro con tipos).
  - TanStack Query v5 (gestión de estado de servidor y caché).
  - TanStack Table v8 (data tables avanzadas con sorting, filtros, selección y paginación).
  - TanStack Form + Zod (validación reactiva de formularios).
- **Layout Switcher Dinámico (Blakor Shell)**:
  - Dock Inferior flotante (estilo app celular / iOS dock).
  - Barra superior (Top Navbar).
  - Sidebar izquierdo clásico y minimizado (icon bar).
  - Sidebar oculto en Drawer/Modal flotante.
  - Botón de acción rápida flotante (FAB naranja).
  - Panel interactivo de configuración de temas y layouts con persistencia en `localStorage`.
- **Módulos Comerciales y Showcases**:
  - Autenticación (Login, Registro, Recuperación, 2FA).
  - Dashboard de Métricas y Analítica.
  - Usuarios, Staff (RBAC), Pagos / Facturación, Licencias, Reportes y Auditoría.
  - Catálogo de UI Kit, Tablas y Formularios para venta como plantilla.
