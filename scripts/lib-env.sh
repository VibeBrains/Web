# Общая загрузка настроек выката. Подключается через `source`.
#
# Адреса, пользователь и пути сервера намеренно НЕ живут в репозитории: имя SSH-пользователя
# рядом с адресом хоста — половина пары для перебора. Значения берутся из .env (см. .env.example),
# любое из них можно переопределить переменной окружения.

_here="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ -f "$_here/.env" ]]; then
	# shellcheck disable=SC1091
	set -a; source "$_here/.env"; set +a
fi

HOST_ALIAS="${HOST_ALIAS:-}"
REMOTE_USER="${REMOTE_USER:-}"
REMOTE_HOST="${REMOTE_HOST:-}"
REMOTE_DIR="${REMOTE_DIR:-}"
SITE_URL="${SITE_URL:-}"

require_env() {
	local missing=()
	for name in "$@"; do
		[[ -n "${!name:-}" ]] || missing+=("$name")
	done
	if [[ ${#missing[@]} -gt 0 ]]; then
		printf '\033[1;31m✗\033[0m Не заданы: %s\n' "${missing[*]}" >&2
		printf '  Скопируйте .env.example в .env и заполните — или передайте переменными окружения.\n' >&2
		exit 1
	fi
}
