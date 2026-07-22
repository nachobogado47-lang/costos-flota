#!/usr/bin/env bash
#
# Deploy completo: crea el repo, pushea, deploya en Vercel y carga la base.
#
# Los tokens se leen del entorno y no se escriben en ningún lado: ni en el
# keychain, ni en ~/.gitconfig, ni en ~/.vercel. Se usan sólo durante esta
# ejecución. El remote queda sin credenciales embebidas.
#
#   GITHUB_TOKEN=ghp_…        PAT del dueño del repo, scope `repo`
#   GITHUB_OWNER=usuario      cuenta donde se crea el repo
#   VERCEL_TOKEN=…            token de Vercel del dueño del proyecto
#   DATABASE_URL=postgres://… connection string de Neon
#
# Uso:
#   GITHUB_TOKEN=… GITHUB_OWNER=… VERCEL_TOKEN=… DATABASE_URL=… ./scripts/deploy.sh
#
# Cada paso es idempotente: si el repo o el proyecto ya existen, sigue de largo.

set -euo pipefail

REPO_NAME="${REPO_NAME:-costos-flota}"
cd "$(dirname "$0")/.."

die() { echo "✗ $1" >&2; exit 1; }
step() { echo; echo "── $1"; }

[ -n "${GITHUB_TOKEN:-}" ]  || die "Falta GITHUB_TOKEN"
[ -n "${GITHUB_OWNER:-}" ]  || die "Falta GITHUB_OWNER"
[ -n "${VERCEL_TOKEN:-}" ]  || die "Falta VERCEL_TOKEN"
[ -n "${DATABASE_URL:-}" ]  || die "Falta DATABASE_URL"

# ── 1. Repo en GitHub ────────────────────────────────────────────────────────
step "Creando ${GITHUB_OWNER}/${REPO_NAME} en GitHub"

http_code=$(curl -sS -o /tmp/gh-repo.json -w "%{http_code}" \
  -X POST https://api.github.com/user/repos \
  -H "Authorization: Bearer ${GITHUB_TOKEN}" \
  -H "Accept: application/vnd.github+json" \
  -d "{\"name\":\"${REPO_NAME}\",\"private\":true,\"description\":\"Control de costos, consumo y kilometraje de la flota\"}")

case "$http_code" in
  201) echo "  ✓ Repo creado (privado)" ;;
  422) echo "  · Ya existía, sigo" ;;
  401) die "GITHUB_TOKEN inválido o vencido" ;;
  403) die "El token no tiene permisos para crear repos (scope 'repo')" ;;
  *)   die "GitHub respondió ${http_code}: $(cat /tmp/gh-repo.json)" ;;
esac
rm -f /tmp/gh-repo.json

# ── 2. Push ──────────────────────────────────────────────────────────────────
# El token va en la URL de este push y nada más: el remote persistido queda
# limpio, así que nadie hereda la credencial desde .git/config.
step "Pusheando el código"

git remote remove origin 2>/dev/null || true
git remote add origin "https://github.com/${GITHUB_OWNER}/${REPO_NAME}.git"
git branch -M main
git push --quiet "https://x-access-token:${GITHUB_TOKEN}@github.com/${GITHUB_OWNER}/${REPO_NAME}.git" main
echo "  ✓ https://github.com/${GITHUB_OWNER}/${REPO_NAME}"

# ── 3. Base de datos ─────────────────────────────────────────────────────────
# Antes del deploy: si el esquema falla, no queda una app en producción
# apuntando a una base vacía.
step "Preparando la base"

npm run --silent db:setup
npm run --silent db:seed

# ── 4. Vercel ────────────────────────────────────────────────────────────────
step "Deployando en Vercel"

npx --yes vercel@latest link --yes --token "$VERCEL_TOKEN" --project "$REPO_NAME" >/dev/null

# `vercel env add` falla si la variable ya existe; lo tratamos como éxito.
for target in production preview development; do
  printf '%s' "$DATABASE_URL" \
    | npx --yes vercel@latest env add DATABASE_URL "$target" --token "$VERCEL_TOKEN" 2>/dev/null \
    || echo "  · DATABASE_URL ya estaba en ${target}"
done

url=$(npx --yes vercel@latest deploy --prod --yes --token "$VERCEL_TOKEN")

step "Listo"
echo "  Repo:  https://github.com/${GITHUB_OWNER}/${REPO_NAME}"
echo "  App:   ${url}"
echo
echo "  Verificá que la app diga «Guardado» en el header: significa que está"
echo "  leyendo y escribiendo contra Postgres y no sólo contra el navegador."
