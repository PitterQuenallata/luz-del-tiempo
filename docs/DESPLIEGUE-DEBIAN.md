# Despliegue en Debian (VPS) — La Luz del Tiempo

Estado: guía preparada el 2026-11-26. Probada en local (Mac con Colima). El VPS aún no se ha tocado.

Pruebas hechas (2026-11-26):
- Restauración de la copia en Postgres: 0 errores, 40 tablas, 3 estaciones.
- Radio con imagen Debian + supervisord + healthcheck: la principal al aire, la clave de Icecast por emisora distinta de la general.
- `userland-proxy: false` en la VM de Colima (Ubuntu 24.04, mismo Docker/kernel que Linux): 0 procesos docker-proxy, puertos 8000 y 8005 abiertos desde el Mac, audio fluyendo. Falta la prueba en Debian real (el VPS).

## 0. Antes de empezar
- Copia de seguridad verificada: `respaldo-2026-11-26T0614.tar.gz` (base SQL + configuración de la radio, sin audios). Restaurada con éxito en una base de prueba (0 errores, 40 tablas, 3 estaciones, 15 usuarios).
- Archivos `.env` (`api.env`, `radio.env`) con claves reales. Pásalos al VPS por un canal seguro (scp/sftp), nunca por git ni por chat.
- Audios: no están en la copia. Hay que copiar `infra/radio/data/music/` aparte (rsync).

## 1. Sistema
- Debian 12 o 13, con usuario no-root con `sudo`.
- Firewall (ufw): abrir `22` (SSH), `80`/`443` (web y API si usas Caddy) y el rango de emisoras `8000:8199/tcp`. **No** abrir `4100` (radio-api), `5432` (Postgres) ni `9000–9199`.
- Hora: `timedatectl set-timezone America/La_Paz`.

## 2. Docker (repositorio oficial de Docker)
La prueba de `userland-proxy` se hizo en Ubuntu (la VM de Colima): repetirla en Debian al instalar.
```
sudo apt-get update && sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
echo "deb [signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list
sudo apt-get update && sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker $USER
```
Los proxies de Docker (`docker-proxy`) cuestan memoria por cada puerto publicado. En Linux conviene desactivarlos para las emisoras: en `/etc/docker/daemon.json`:
```json
{ "userland-proxy": false }
```
y `sudo systemctl restart docker`. Probar antes de dar por bueno (ver sección 6).

## 3. Código y configuración
```
git clone <repo> ~/luz-del-tiempo && cd ~/luz-del-tiempo
cp ~/api.env apps/api/.env
cp ~/radio.env infra/radio/.env
```
En `infra/radio/.env`: `PUBLIC_STREAM_HOST=http://<IP-PÚBLICA-DEL-VPS>` (la IP que ven los oyentes).

## 4. Base de datos
```
docker compose -f infra/compose.yaml up -d        # Postgres 16
docker exec -i <contenedor-postgres> psql -U luz -d luzdeltiempo < base-de-datos.sql
```
La copia ya trae las migraciones aplicadas. Si vas a usar una base vacía, `pnpm db:migrate` en `apps/api`.

## 5. Radio y API
- Radio (Liquidsoap + Icecast por emisora + radio-api): `docker compose -f infra/radio/compose.yaml up -d --build`.
  La primera vez publica el rango 8000–8199 (tarda ~30 s).
- Copiar `infra/radio/data/config` (de la copia) y `infra/radio/data/music` antes de encender emisoras.
- API: instalar Node 20+ y `pnpm`, y `apt install postgresql-client` (la API usa `pg_dump` para las copias). Correr la API con systemd (`Restart=always`).
- La API programa las tareas de fondo (oyentes cada 5 min, copia diaria a las 03:00). Variables: `RESPALDOS_DIR`, `RESPALDOS_DIAS` (14 por defecto).

## 6. Verificación
1. `curl http://localhost:8000/principal` → 200 cuando la emisora principal está encendida.
2. Panel → Sistema: tareas corriendo, descarga de una copia.
3. Un locutor (BUTT/OBS o el emisor) conecta al puerto de locutores de su emisora y entra al aire.
4. Medir el hueco de una emisora mientras cambias otra (ver `docs/tareas/radio-proceso-por-estacion.md`, Fase 5).

## 7. Límites y memoria
- Cada emisora encendida cuesta ~200 MB de RAM (Liquidsoap). Máximo previsto: 20 estaciones (rango 8000–8199).
- Plan previsto: Contabo Cloud VPS 4 (4 vCPU, 8 GB RAM, 100 GB SSD). Con 8 GB caben las 20 encendidas; en la práctica operan 6 o menos.

## 8. Copias
- Automáticas: la API crea una copia diaria a las 03:00 y guarda 14 días en `RESPALDOS_DIR`.
- Descargar: Panel → Sistema → Descargar. Guárdala en tu PC.
- Pendiente: copia automática fuera del VPS.
