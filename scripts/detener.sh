#!/usr/bin/env bash
# Apaga el entorno de desarrollo y los contenedores de radio y base de datos.
# Uso: ./scripts/detener.sh          (desde la raíz del repo)
set -uo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$RAIZ"

echo "==> Procesos de desarrollo (API, panel, web, emisor)"
for puerto in 1420 3000 4000 5173; do
  lsof -ti :"$puerto" | xargs -r kill 2>/dev/null
done
pkill -f "pnpm -r --parallel dev" 2>/dev/null
pkill -f "tsx watch --env-file=.env src/index.ts" 2>/dev/null

echo "==> Radio (Icecast, Liquidsoap, radio-api)"
docker compose -f infra/radio/compose.yaml stop 2>/dev/null

echo "==> Base de datos"
docker compose -f infra/compose.yaml stop 2>/dev/null

echo "Listo. Para apagar Docker también: colima stop"
