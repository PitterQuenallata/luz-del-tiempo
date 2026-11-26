#!/bin/sh
# Sincroniza las emisoras encendidas con supervisord (como AzuraCast):
# /config/emisoras.txt → una conf por emisora en /tmp/radio-conf, con un grupo <slug> que tiene dos programas:
#   icecast-<slug>   (su Icecast, en su puerto de oyentes)
#   liquidsoap-<slug> (su Liquidsoap: AutoDJ, locutores y control)
# Encender/cambiar puerto aplica la conf; quitar la emisora detiene su grupo. Las demás no se tocan.
# Escribe /procesos/<slug>.txt (estado, reinicios, desde, último código) para la radio-api y el panel.

CONFIG_DIR="${CONFIG_DIR:-/config}"
LISTA="$CONFIG_DIR/emisoras.txt"
CONF="/tmp/radio-conf"
RUN="/tmp/radio-run"
STATUS="${STATUS_DIR:-/procesos}"
LOG="/var/log/radio"
PLANTILLA="/radio/icecast.xml.tpl"

mkdir -p "$CONF" "$RUN" "$STATUS" "$LOG"

log() { echo "[sincronizar] $(date '+%Y-%m-%d %H:%M:%S') $*"; }
ctl() { supervisorctl -c /radio/supervisord.conf "$@"; }

# Estado de una emisora (escritura atómica, la radio-api lo lee)
estado() {
  tmp="$STATUS/$1.tmp"
  printf 'estado=%s\nreinicios=%s\ndesde=%s\nultimo_codigo=%s\n' "$2" "$3" "$4" "$5" > "$tmp" && mv "$tmp" "$STATUS/$1.txt"
}

# Contraseña de la fuente de Icecast de UNA emisora: derivada de la general y del slug.
# Así la contraseña de una emisora no sirve para publicar en otra.
clave_fuente() {
  printf '%s' "$ICECAST_SOURCE_PASSWORD:$1" | sha256sum | cut -c1-48
}

# Conf de supervisord de una emisora (dos programas y su grupo)
escribir_conf() {
  slug="$1"; puerto="$2"; clave="$(clave_fuente "$slug")"
  cat <<CONF_EOF
[program:icecast-$slug]
command=/usr/bin/icecast2 -c $RUN/icecast-$slug/icecast.xml
environment=ICE_PORT="$puerto"
autorestart=true
startsecs=3
startretries=5
priority=10
stopasgroup=true
killasgroup=true
stdout_logfile=$LOG/$slug-icecast.log
stdout_logfile_maxbytes=5MB
stdout_logfile_backups=3
redirect_stderr=true

[program:liquidsoap-$slug]
command=/usr/bin/liquidsoap /radio/radio.liq
environment=STATION_SLUG="$slug",ICECAST_SOURCE_PASSWORD="$clave",LIQ_CACHE_SYSTEM_DIR="$RUN/cache/$slug",LIQ_CACHE_USER_DIR="$RUN/cache/$slug"
autorestart=true
startsecs=10
startretries=5
priority=20
stopasgroup=true
killasgroup=true
stdout_logfile=$LOG/$slug-liquidsoap.log
stdout_logfile_maxbytes=5MB
stdout_logfile_backups=3
redirect_stderr=true

[group:$slug]
programs=icecast-$slug,liquidsoap-$slug
CONF_EOF
}

# Estado de una emisora a partir de supervisord: RUNNING = en marcha; el resto = reiniciando.
# Cuenta los reinicios cuando cambia el PID del Liquidsoap.
actualizar_estado() {
  slug="$1"
  linea=$(ctl status "$slug:liquidsoap-$slug" 2>/dev/null)
  sup=$(echo "$linea" | awk '{print $2}')
  pid=$(echo "$linea" | sed -n 's/.*pid \([0-9][0-9]*\).*/\1/p')
  codigo=$(echo "$linea" | sed -n 's/.*exit status \([0-9][0-9]*\).*/\1/p')
  reinicios=$(cat "$RUN/$slug.reinicios" 2>/dev/null || echo 0)
  ultimo_pid=$(cat "$RUN/$slug.pid" 2>/dev/null || echo "")
  if [ -n "$pid" ] && [ "$pid" != "$ultimo_pid" ]; then
    if [ -n "$ultimo_pid" ]; then reinicios=$((reinicios + 1)); fi
    echo "$reinicios" > "$RUN/$slug.reinicios"
    echo "$pid" > "$RUN/$slug.pid"
    date +%s > "$RUN/$slug.desde"
  fi
  desde=$(cat "$RUN/$slug.desde" 2>/dev/null || date +%s)
  if [ "$sup" = "RUNNING" ]; then
    estado "$slug" en_marcha "$reinicios" "$desde" "$codigo"
  else
    estado "$slug" reiniciando "$reinicios" "$(date +%s)" "$codigo"
  fi
}

log "sincronizador listo (lista: $LISTA)"
while :; do
  sed -n 's/^\([a-z0-9][a-z0-9-]*\) \([0-9][0-9]*\)$/\1 \2/p' "$LISTA" 2>/dev/null > "$RUN/lista.tmp"

  # 1. Quitar las emisoras que ya no están encendidas
  for f in "$CONF"/*.conf; do
    [ -f "$f" ] || continue
    slug=$(basename "$f" .conf)
    if ! cut -d' ' -f1 "$RUN/lista.tmp" | grep -qx "$slug"; then
      log "quitando la emisora $slug"
      ctl stop "$slug:*" >/dev/null 2>&1
      rm -f "$f"
      rm -rf "$RUN/icecast-$slug" "$STATUS/$slug.txt" "$RUN/$slug.reinicios" "$RUN/$slug.pid" "$RUN/$slug.desde"
    fi
  done

  # 1b. Estados de emisoras que ya no están en la lista (p. ej. una que nunca se encendió y se borró)
  for f in "$STATUS"/*.txt; do
    [ -f "$f" ] || continue
    slug=$(basename "$f" .txt)
    if ! cut -d' ' -f1 "$RUN/lista.tmp" | grep -qx "$slug"; then
      rm -f "$f"
    fi
  done

  # 2. Escribir la conf de cada emisora encendida (si cambia, supervisord la reinicia)
  while read -r slug puerto; do
    mkdir -p "$RUN/icecast-$slug" "$RUN/cache/$slug" "$LOG/icecast-$slug"
    ICECAST_SOURCE_PASSWORD="$(clave_fuente "$slug")" ICE_PORT="$puerto" ICE_LOGDIR="$LOG/icecast-$slug" envsubst < "$PLANTILLA" > "$RUN/icecast-$slug/icecast.xml"
    escribir_conf "$slug" "$puerto" > "$RUN/$slug.conf.nuevo"
    if [ ! -f "$CONF/$slug.conf" ] || ! cmp -s "$RUN/$slug.conf.nuevo" "$CONF/$slug.conf"; then
      mv "$RUN/$slug.conf.nuevo" "$CONF/$slug.conf"
      log "emisora $slug: configuración nueva (oyentes en el puerto $puerto)"
    else
      rm -f "$RUN/$slug.conf.nuevo"
    fi
  done < "$RUN/lista.tmp"

  # 3. Aplicar al supervisor y anotar el estado
  ctl reread >/dev/null 2>&1
  ctl update >/dev/null 2>&1
  while read -r slug puerto; do
    actualizar_estado "$slug"
  done < "$RUN/lista.tmp"

  sleep 3
done
