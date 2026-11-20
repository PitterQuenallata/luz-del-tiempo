# Estado y plan — La Luz del Tiempo

> Actualizado: 20/11/2026. Rama `main` en `918b6ba`.
> Documento para retomar el trabajo en un chat nuevo. El plan de producto está en `docs/PLAN.md`; el modelo de datos en `docs/DATABASE.md`.

## 1. Cómo correr el proyecto

Desde la raíz del repo (no desde `apps/panel`):

```bash
colima start                                              # si Docker está apagado (Mac)
docker compose -f infra/compose.yaml up -d                # PostgreSQL
cd apps/api && set -a && . ./.env && set +a && pnpm db:migrate && pnpm db:seed && cd ../..
pnpm dev                                                  # panel :3000, web :5173, API :4000
```

- Cuentas de desarrollo (contraseña `sopademani1`): `mallku@gmail.com` (superadmin), `admin@`, `editor@`, `operador@` (`@luzdeltiempo.local`).
- Panel: `http://localhost:3000` (el login está en `/login`; el cambio inicial en `/new-password`).
- Vite reenvía `/api` a la API en `:4000`, así el panel funciona desde localhost, 127.0.0.1 o la IP de la red.

## 2. Estructura del monorepo

| Carpeta | Qué es | Estado |
|---|---|---|
| `apps/panel` | Panel de administración (plantilla Blakor Admin Pro adaptada) | Usuarios, roles, permisos, auditoría, perfil y primer ingreso listos |
| `apps/api` | API 1 (Hono + Better Auth + Drizzle + PostgreSQL) | Auth, usuarios, roles, permisos, bitácora y perfil listos |
| `packages/shared` | `@luz/shared`: esquemas Zod, países/teléfono, normalización de nombres, contraseña inicial | Usado por API y panel |
| `apps/web` | Web pública (React + Vite) | Datos de prueba (`src/api/mock*.ts`); falta conectarla a la API |
| `apps/mobile`, `apps/radio-api`, `infra` | App Android, API de radio, infraestructura | Pendiente |
| `referencia/plantilla-original` | Copia de la plantilla (solo referencia, fuera del workspace) | Se toma de ahí lo que haga falta |

## 3. Qué está hecho

**Autenticación y primer ingreso**
- Login en `/login` (plantilla v1 en tema claro, logo, fondo de ondas de radio).
- Cuentas con contraseña inicial `Apellido*.` (primer apellido con inicial mayúscula + `*.`). Al entrar por primera vez, el panel lleva a `/new-password`; la API bloquea el resto de rutas (403) hasta cambiarla.
- Cerrar sesión desde el menú lateral, el dock y la barra superior.

**Usuarios** (`/usuarios`, pestaña Directorio)
- Alta: nombres, apellidos, correo, teléfono (código de país con banderas, Bolivia 8 dígitos por defecto), rol. Muestra la contraseña inicial con botón copiar.
- Editar: nombres, teléfono, rol, estado (activo/inactivo), foto de perfil.
- Eliminar: limpio si la cuenta nunca tuvo actividad; lógico si ya entró o hizo cambios. Confirmación con SweetAlert.
- Tabla compacta con último acceso, filtros por estado y rol, cifras en una línea.

**Roles y permisos** (`/usuarios`, pestaña Roles y permisos)
- CRUD de roles (los de sistema no se eliminan; un rol con usuarios tampoco).
- Matriz de permisos editable solo por el superadmin.
- Permisos aplicados hoy: entrar al panel (`panel:acceso`), gestionar usuarios (`usuarios:gestionar`), ver bitácora (`logs:ver`), gestionar roles (`roles:gestionar`), superadmin (`superadmin:gestionar`).
- Las rutas del panel declaran su permiso en TanStack Router (`beforeLoad`); sin permiso → `/403`. El menú solo muestra lo permitido.

**Auditoría** (`/logs`): bitácora de usuarios, sesiones y perfil, con filtro por acción.

**Perfil** (`/perfil`): foto, datos personales, teléfono y cambio de contraseña.

**Stack**
- Panel: React 19, Vite, Tailwind, TanStack Router, Query, Table y Form (con Zod). Build con `tsgo`.
- API: Hono, Better Auth, Drizzle, PostgreSQL 16. Validación con `@luz/shared`.
- Formularios: `useForm` de TanStack Form con esquemas de `@luz/shared`.

## 4. Decisiones que se tomaron (y por qué)

- **Sin borrado físico de cuentas con actividad**: se conserva el historial (eliminación lógica).
- **Contraseña inicial corta permitida**: `minPasswordLength: 4` en Better Auth, porque la contraseña inicial es `Apellido*.`. Las contraseñas que elige el usuario deben tener mínimo 8 (validado en API y panel).
- **Cuentas creadas por admin no inician sesión** (`autoSignIn: false`), para que la creación no cuente como último acceso.
- **Fotos en disco** (`apps/api/uploads/`, ignorado por git). Pendiente pasar a almacenamiento S3/MinIO.
- **Menú**: una sola disposición de referencia (dock por defecto); las otras disposiciones de la plantilla siguen en el código.

## 5. Pendientes

**Probar en navegador (no verificado todavía)**
- Cambio de contraseña inicial completo (escribir, validar y entrar al dashboard).
- Subida de foto, eliminación lógica, guardar la matriz de permisos.

**Funcionales**
- Registrar en la bitácora los cambios de roles y permisos (`rol.*`).
- Permisos del catálogo sin módulo aún: `contenido:editar`, `donaciones:ver`, `estaciones:todas`, `estacion:propia`, `servidores:configurar`. Se aplican cuando existan sus módulos.
- Botón "Invitar" del antiguo módulo Staff ya se eliminó; el alta vive solo en Usuarios.

**Siguiente etapa (plan de producto)**
1. **Contenido de la web** en el panel: hero, predicadores, autores y áreas (tablas, API, pantallas). Activa `contenido:editar`.
2. **Conectar la web pública** (`apps/web`) a la API y quitar los datos de prueba.
3. **Noticias y actividades** (con bitácora).
4. **App Android** (`apps/mobile`): noticias, actividades, videos y notificaciones.
5. **Radio**: `apps/radio-api` + Liquidsoap + Icecast.
6. **Despliegue** en VPS con Caddy y HTTPS.

## 6. Reglas de trabajo acordadas

- Antes de crear una pantalla o componente, revisar si existe en `referencia/plantilla-original` y tomarlo de ahí.
- No rehacer la plantilla ni cambiar la estructura del shell sin pedirlo.
- Validaciones en API y panel con los mismos esquemas de `@luz/shared`.
- Confirmaciones de acciones con SweetAlert (`confirmar()` de `shared/lib/confirm.ts`), no con `window.confirm`.
- Verificar en el navegador antes de dar algo por terminado; el usuario prueba y reporta.
- Los commits llevan la línea `Co-Authored-By` del asistente.
