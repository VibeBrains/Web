#!/usr/bin/env bash
#
# Выкат лендинга на сервер.
#
#   ./scripts/deploy.sh            # выкатить
#   ./scripts/deploy.sh --dry-run  # показать, что изменится, ничего не трогая
#
# Требует один раз выполненного ./scripts/setup-ssh.sh и заполненного .env (см. .env.example).
#
set -euo pipefail

# shellcheck source=lib-env.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib-env.sh"
require_env HOST_ALIAS REMOTE_DIR

LOCAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/site"

# bash 3.2 (macOS) под `set -u` падает на раскрытии пустого массива — держим флаг строкой.
DRY=""
[[ "${1:-}" == "--dry-run" ]] && DRY="--dry-run"

say() { printf '\033[1;35m›\033[0m %s\n' "$*"; }
die() { printf '\033[1;31m✗\033[0m %s\n' "$*" >&2; exit 1; }

[[ -f "$LOCAL_DIR/index.html" ]] || die "Не нашёл $LOCAL_DIR/index.html"

# Ссылки на сборки — поплатформенные и живут в разметке; освежаем их перед каждым выкатом,
# чтобы посетитель без JS не уехал на 404 (releases/latest бывает под одну платформу).
if command -v node >/dev/null 2>&1; then
	node "$(dirname "${BASH_SOURCE[0]}")/refresh-links.mjs" || say "Не смог обновить ссылки (GitHub недоступен?) — выкатываю как есть."
else
	say "node не найден — ссылки не обновлены, выкатываю как есть."
fi

ssh -o BatchMode=yes -o ConnectTimeout=8 "$HOST_ALIAS" 'true' 2>/dev/null \
	|| die "Нет доступа по ключу к '$HOST_ALIAS'. Сначала: ./scripts/setup-ssh.sh"

say "Выкат $LOCAL_DIR → $HOST_ALIAS:$REMOTE_DIR"
[[ -n "$DRY" ]] && say "Режим --dry-run: ничего не изменится."

# --delete держит сервер зеркалом каталога site/: удалённый локально файл исчезает и на сервере.
rsync -az --delete --human-readable --itemize-changes ${DRY:+"$DRY"} \
	--exclude '.DS_Store' \
	"$LOCAL_DIR/" "$HOST_ALIAS:$REMOTE_DIR/"

if [[ -z "$DRY" && -n "$SITE_URL" ]]; then
	say "Проверяю, что сайт отвечает."
	code="$(curl -s -o /dev/null -w '%{http_code}' "$SITE_URL" || true)"
	[[ "$code" == "200" ]] && say "$SITE_URL → HTTP $code" || say "$SITE_URL → HTTP $code (проверьте веб-сервер)"
fi
