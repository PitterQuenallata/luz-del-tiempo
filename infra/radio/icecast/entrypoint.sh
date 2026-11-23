#!/bin/sh
# Genera la configuración de Icecast con las contraseñas del entorno y lo arranca.
set -eu

: "${ICECAST_SOURCE_PASSWORD:?Falta ICECAST_SOURCE_PASSWORD}"
: "${ICECAST_ADMIN_PASSWORD:?Falta ICECAST_ADMIN_PASSWORD}"
export ICECAST_HOSTNAME="${ICECAST_HOSTNAME:-localhost}"
export ICECAST_MAX_CLIENTS="${ICECAST_MAX_CLIENTS:-500}"

envsubst < /etc/icecast/icecast.xml.tpl > /tmp/icecast.xml
exec icecast -c /tmp/icecast.xml
