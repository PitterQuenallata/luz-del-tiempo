# Pendientes de producción

Lo que falta para pasar la radio y el panel del entorno de desarrollo al Contabo VPS.
Se cierra cuando haya acceso SSH al servidor. Lo demás de la radio está en `docs/RADIO.md`.

## Despliegue en el VPS (Contabo Cloud VPS 4, Ubuntu 24.04 o Debian)

- [ ] Instalar Docker y Compose en el VPS; confirmar que el servidor tiene 8 GB de RAM y 4 vCPU.
- [ ] Restaurar el `.env` de la API y de la radio (no están en git) y una copia de seguridad.
- [ ] Levantar la base y las migraciones (`drizzle-kit migrate`, incluye 0027 a 0032).
- [ ] Levantar la radio (`docker compose -f infra/radio/compose.yaml up -d --build`) y comprobar `RUNNING` en `sincronizador`, `icecast-*` y `liquidsoap-*`.
- [ ] Puertos abiertos en el firewall: 8000–8199 (oyentes y locutores por emisora) y 443 (panel/API vía Caddy).
- [ ] Caddy delante de la API: que reenvíe `X-Forwarded-For` (lo usa el emisor para registrar la IP).
- [ ] Revisar que la copia automática de las 03:00 (hora de La Paz) corra en el VPS.

## Copia de seguridad fuera del servidor

- [ ] Probar la copia externa por SSH contra el destino real (la versión local ya está probada). Falta: el destino (usuario, servidor y ruta) y una clave SSH sin contraseña para el usuario que corre la API.
- [ ] Instalar `rsync` y `openssh-client` en el VPS.
- [ ] Decidir la retención en el destino: hoy las copias viejas allá no se borran solas.

## Emisor de Windows (.exe)

- [ ] Probar el inicio de sesión de locutor en el .exe contra el VPS. Confirmar que cada locutor ve solo sus emisoras.
- [ ] Probar que el puerto de locutores de cada emisora llega bien al emisor (`GET /api/v1/emisor/emisoras`).
- [ ] Probar que al quitar un locutor de una emisora su contraseña cambia y el emisor antiguo ya no puede entrar.

## Pruebas pendientes en la radio

- [ ] Dejar sonar la radio varios días y revisar el historial de reproducción y los informes con datos reales.
- [ ] Probar la pestaña Medios → Revisión con audios duplicados reales (ya probada con datos de prueba, borrados).

## Limpieza de la API (revisado el 2026-11-26)

- [ ] `GET /api/v1/roles/yo` no lo usa ninguna app (el panel usa `/api/v1/me`). Candidato a borrar; no se ha borrado.
- Todo lo demás de la API tiene consumidor: el panel usa 125 de sus rutas, la web y la app móvil las rutas públicas, y el emisor sus rutas de sesión, emisoras, transmisiones y actualizaciones.
