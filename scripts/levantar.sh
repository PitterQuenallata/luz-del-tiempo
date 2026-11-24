#!/usr/bin/env bash
# Levanta todo el proyecto: Docker (Colima), base de datos, radio y el entorno de desarrollo.
# Uso: ./scripts/levantar.sh          (desde la raíz del repo)
# Para apagar: ./scripts/detener.sh
set -euo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$RAIZ"

paso() { printf '\n\033[1;33m==> %s\033[0m\n' "$1"; }
falta() { printf '\033[1;31mFalta: %s\033[0m\n' "$1" >&2; exit 1; }

# 1. Docker (en Mac se usa Colima)
paso "Docker"
if ! docker info >/dev/null 2>&1; then
  command -v colima >/dev/null || falta "colima (brew install colima) o Docker Desktop"
  colima start
fi
docker info >/dev/null 2>&1 || falta "Docker no responde"

# 2. Archivos de configuración necesarios
paso "Configuración"
[ -f apps/api/.env ] || falta "apps/api/.env (copia apps/api/.env.example y completa los valores)"
[ -f infra/radio/.env ] || falta "infra/radio/.env (copia infra/radio/.env.example y cambia las contraseñas)"
[ -f apps/radio-api/.env ] || falta "apps/radio-api/.env (copia apps/radio-api/.env.example, con el mismo RADIO_API_TOKEN)"

# 3. Dependencias del workspace
paso "Dependencias"
if [ ! -d node_modules ]; then pnpm install; fi

# 4. Base de datos (Postgres) y migraciones
paso "Base de datos"
docker compose -f infra/compose.yaml up -d
for _ in $(seq 1 30); do
  if docker compose -f infra/compose.yaml exec -T postgres pg_isready -q 2>/dev/null; then break; fi
  sleep 1
done
(cd apps/api && set -a && . ./.env && set +a && pnpm db:migrate)

# 5. Radio: Icecast, Liquidsoap y radio-api
paso "Radio"
docker compose -f infra/radio/compose.yaml up -d
for _ in $(seq 1 30); do
  if curl -fsS http://localhost:4100/health >/dev/null 2>&1; then break; fi
  sleep 1
done
curl -fsS http://localhost:4100/health >/dev/null 2>&1 && echo "radio-api lista" || echo "AVISO: la radio-api aún no responde (revisa: docker compose -f infra/radio/compose.yaml logs radio-api)"

# 6. Entorno de desarrollo (API, panel, web)
paso "Listo. Abriendo el entorno de desarrollo"
echo "Panel:  http://localhost:3000"
echo "Web:    http://localhost:5173"
echo "API:    http://localhost:4000   (Swagger: /api/docs)"
echo "Radio:  http://localhost:4100/docs  ·  stream: http://localhost:8000/principal"
echo "Para apagar todo: ./scripts/detener.sh"
exec pnpm dev
