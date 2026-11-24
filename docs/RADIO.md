# Radio — Icecast + Liquidsoap + radio-api

> Actualizado: 23/11/2026. Primera versión. Probada solo la `radio-api` (sin Docker); Icecast y Liquidsoap aún no se levantaron.

## 1. Cómo está armada

```
Locutor (BUTT/OBS) ──► :8005 Liquidsoap (harbor) ─┐
                                                  ├─► Icecast :8000 ──► Oyentes (web, app)
AutoDJ (carpeta de audios por estación) ─────────┘        ▲
                                                           │ estado y oyentes
API 1 (apps/api) ──token──► radio-api :4100 ───────────────┘
                              │
                              └─► escribe stations.json y guarda los audios
```

| Pieza | Dónde | Qué hace |
|---|---|---|
| **Icecast** | `infra/radio/icecast/` (imagen propia sobre Alpine) | Servidor del stream. Un mount por estación: `/principal`, `/salud`… |
| **Liquidsoap** | `infra/radio/liquidsoap/radio.liq` (imagen `savonet/liquidsoap:v2.4.6`) | AutoDJ 24/7 por estación y entrada en vivo. Si entra un locutor, tiene prioridad; si no hay audios, transmite silencio. |
| **radio-api** | `apps/radio-api` (Hono + Node) | API 2. Solo le habla la API 1, con `Authorization: Bearer <RADIO_API_TOKEN>`. |

- **No se usa AzuraCast**: duplicaría el panel (usuarios, roles, estaciones) y es pesado para el VPS. La lógica de dueños, operadores y límites vive en la API 1 y la base de datos (`docs/DATABASE.md`).
- **Emisoras y estaciones**: cada emisora contiene sus estaciones (sección 6). Una emisora de un tercero tiene una sola estación y un responsable.
- **Encender, apagar, AutoDJ y activar o pausar cada playlist** (sin reiniciar nada): van en `data/config/estado.txt`, una línea por clave: `slug 1|0` (emisora), `slug.autodj 1|0` (AutoDJ), `slug/playlist 1|0` (playlist en esa emisora). Liquidsoap lo lee cada 2 s. **No corta a las demás** (probado).
- **Cambios de estructura** (reinician Liquidsoap, un corte de unos segundos para todas): crear o borrar una emisora, la primera vez que una emisora sale al aire, cambiar punto de transmisión, contraseña, calidad o nombre de salida, crear, borrar o cambiar el modo, peso o horarios de una playlist de la biblioteca. `stations.json` solo cambia en esos casos.
- **Borradores** (`status = draft`): se crean con su punto de transmisión, pero no se envían a la radio ni salen al aire ni en la web hasta que se activen.
- **Contraseña del locutor**: cada estación tiene la suya (`livePassword`). La radio-api nunca la devuelve. Icecast tiene una contraseña de fuente interna que solo usa Liquidsoap.

## 2. Levantarla

Desde la raíz del repo:

```bash
cp infra/radio/.env.example infra/radio/.env     # cambiar todas las contraseñas
docker compose -f infra/radio/compose.yaml up -d --build
docker compose -f infra/radio/compose.yaml logs -f liquidsoap
```

Los datos quedan en `infra/radio/data/` (ignorado por git):
- `data/config/stations.json`: estaciones (lo escribe la radio-api).
- `data/music/<slug>/`: audios del AutoDJ de cada estación.

| Puerto | Servicio | Para quién |
|---|---|---|
| 8000 | Icecast | Oyentes: `http://<host>:8000/<mount>`. Admin en `/admin/` |
| 8005 | Liquidsoap harbor | Locutores en vivo. Mount = slug de la estación, contraseña = `livePassword` |
| 4100 | radio-api | Solo la API 1 |

**Sin Docker** (solo la radio-api, para desarrollar): `cp apps/radio-api/.env.example apps/radio-api/.env` y `pnpm --filter @luz/radio-api dev:local` (no lo uses si Docker ya tiene la radio-api encendida: ambas usan el puerto 4100).

## 3. Endpoints de la radio-api

Todos los `/v1/*` piden `Authorization: Bearer <RADIO_API_TOKEN>`.

| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/health` | Sin token. `{"status":"ok"}` |
| GET | `/v1/stations` | Estaciones + estado en Icecast (en línea, oyentes, canción) |
| GET | `/v1/stations/:slug` | Una estación + espacio usado |
| PUT | `/v1/stations/:slug` | Crea o actualiza. Body: `name`, `mount`, `livePassword` (mín. 8), opcionales `bitrate` (32–320, 128), `autodj`, `enabled`, `maxListeners` (≤ 2000), `storageQuotaMb` (≤ 10240). 409 si el mount ya lo usa otra estación |
| DELETE | `/v1/stations/:slug` | Quita la estación (los audios quedan en disco) |
| GET | `/v1/listeners` | Oyentes por estación, para guardar muestras cada 1–5 min |
| GET | `/v1/stations/:slug/tracks` | Audios del AutoDJ + cuota |
| POST | `/v1/stations/:slug/tracks` | Sube un audio (multipart, campo `file`, máx. 300 MB). mp3, ogg, opus, m4a, aac, flac, wav. 409 si pasa la cuota |
| DELETE | `/v1/stations/:slug/tracks/:file` | Borra un audio |

Ejemplo:

```bash
curl -X PUT http://localhost:4100/v1/stations/principal \
  -H "Authorization: Bearer $RADIO_API_TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Radio La Luz del Tiempo","mount":"/principal","livePassword":"cambiar1234"}'
curl -H "Authorization: Bearer $RADIO_API_TOKEN" -F file=@cancion.mp3 \
  http://localhost:4100/v1/stations/principal/tracks
# Escuchar: http://localhost:8000/principal
```

## 4. Dónde corre

| Entorno | Estado |
|---|---|
| **PC Windows (desarrollo)** | ❌ **No se pudo levantar.** Esa PC tiene un Windows 11 modificado (MiniOS, build Insider 26300). WSL falla al crear su máquina virtual (`Wsl/Service/RegisterDistro/CreateVm/0x8007273f`, "dirección incompatible con el protocolo"), así que Docker Desktop no arranca. Se probó `wsl --shutdown`, reiniciar Docker y `netsh winsock reset` + reinicio, sin éxito. Problema del sistema operativo, no del proyecto: no volver a intentarlo en esa PC. |
| **Mac M1 (desarrollo)** | Recomendado. OrbStack/Colima/Docker Desktop. Las imágenes tienen versión ARM. |
| **VPS (producción)** | Contabo Cloud VPS 4: 4 vCPU, 8 GB RAM, 100 GB SSD, puerto 200 Mbit/s, tráfico ilimitado. Ubuntu 24.04 LTS. A 128 kbps, el puerto alcanza para ~1.000+ oyentes simultáneos. |

## 5. Pendientes

**Próximo plan (no empezado):**
- Emisora apagada u oculta (`visibleInMinistry = false`) debe desaparecer de la **web** y de la **app móvil**: hoy el interruptor solo apaga el stream, y el reproductor público todavía no lo consulta.

## 6. Emisoras, estaciones y archivos

Tres niveles:

- **Emisora** (`radios`): el contenedor, p. ej. «Radio La Luz del Tiempo». Tiene su archivo y sus **listas de producción** (`station_playlists.radio_id`), que todas sus estaciones pueden activar. Una emisora de un tercero tiene un **responsable** (`ownerUserId`) y **una sola estación**.
- **Estación** (`stations`): lo que transmite (mount, contraseña, AutoDJ, interruptor). Pertenece a una emisora. Tiene su archivo y sus listas (`station_playlists.station_id`).
- **Archivo**: en cada nivel. El de la estación lo usa solo esa estación; el de la emisora lo usan sus estaciones cuando las activan.

Reglas de acceso (API, `acceso.ts`):

- `estaciones:todas` (superadmin, admin): todo.
- `estacion:propia` (operador de un tercero): solo las estaciones de su emisora (`ownerUserId`). No ve otras emisoras, no crea emisoras ni estaciones, y no cambia estado, enlace ni visibilidad de su estación.

Al crear una estación se elige **Crear AutoDJ**: nace con su propia lista («Música automática», vacía). Sin AutoDJ, solo transmite. Una estación nunca activa listas de otra: las de la emisora solo suenan si ella las activa con «Suena aquí» (`estado.txt`).

Almacenamiento en la radio-api: cada archivo es una carpeta. La de la estación es su `slug`; la de la emisora es `arch-<12 primeros caracteres del id de la emisora>`. Las pistas de la emisora llevan esa carpeta en la lista (`arch-…/archivo.mp3`).


## 7. Web y app

- `GET /public/stations`: estaciones de **Luz del Tiempo** (emisora del ministerio), con su emisora. Es lo que muestran la web (`/radio`) y la app.
- `GET /public/emisoras` y `GET /public/emisoras/:slug`: emisoras de **terceros** publicadas, cada una con su única estación. La web las muestra como tarjetas en `/radio` y tiene una página propia, `/emisora/:slug`, con solo reproducir y lo básico.
- Una emisora o estación oculta (`visibleInMinistry = false`) o no activa (`status ≠ active`) no sale en ninguna lista pública.
- Solo puede haber una emisora principal: el panel bloquea la marca si ya existe otra, y la API la rechaza.
