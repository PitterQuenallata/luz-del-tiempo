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
- **Estaciones**: la radio principal tiene sus estaciones propias (`own`, varias). Un tercero al que el ministerio dé acceso tiene **1 radio = 1 estación** (`external`, máximo 1 en total, con un solo operador). Esa regla la aplica la base de datos; la radio-api no distingue dueños.
- **Cambio de configuración**: la radio-api escribe `stations.json` (de forma atómica). Liquidsoap lo vigila; cuando cambia, se apaga y Docker lo vuelve a levantar con la configuración nueva. Corte de ~2 s, solo al crear o editar estaciones. Subir o borrar audios **no** corta: la playlist se recarga sola.
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

- Levantar Icecast + Liquidsoap por primera vez (Mac o VPS) y probar AutoDJ, entrada en vivo y cambio automático.
- API 1: conectar el módulo de emisoras del panel con la radio-api (crear estación, subir audios, ver oyentes) y guardar `station_listener_samples`.
- Aplicar `max_listeners` por mount en Icecast (hoy solo hay un tope global `ICECAST_MAX_CLIENTS`).
- Programación por horario (`program_slots` → playlist del AutoDJ según la hora).
- En el VPS: Caddy con HTTPS delante de Icecast (`https://radio.laluzdeltiempo.org/<mount>`), la radio-api sin publicar a internet y permisos de `data/` para el usuario `node`.
