#!/usr/bin/env bash
#
# Засев SSH-ключа для беспарольного доступа к серверу сайта.
#
# Запускается ОДИН РАЗ и ВРУЧНУЮ: на шаге ssh-copy-id сервер спросит пароль пользователя —
# его вводит человек. После успешного прогона deploy.sh идёт без вопросов.
#
#   cp .env.example .env   # заполнить под свой сервер
#   ./scripts/setup-ssh.sh
#
set -euo pipefail

# shellcheck source=lib-env.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib-env.sh"
require_env HOST_ALIAS REMOTE_USER REMOTE_HOST

KEY_PATH="${KEY_PATH:-$HOME/.ssh/id_ed25519_${HOST_ALIAS}}"
SSH_CONFIG="$HOME/.ssh/config"

say() { printf '\033[1;35m›\033[0m %s\n' "$*"; }
die() { printf '\033[1;31m✗\033[0m %s\n' "$*" >&2; exit 1; }

# 1. Ключ
if [[ -f "$KEY_PATH" ]]; then
	say "Ключ уже есть: $KEY_PATH — переиспользуем."
else
	say "Генерирую ключ $KEY_PATH (без пароля — он нужен для автоматического выката)."
	mkdir -p "$HOME/.ssh"
	chmod 700 "$HOME/.ssh"
	ssh-keygen -t ed25519 -N '' -C "${HOST_ALIAS}-deploy@$(hostname -s)" -f "$KEY_PATH"
fi

# 2. Запись в ~/.ssh/config
if grep -qE "^Host[[:space:]]+$HOST_ALIAS([[:space:]]|$)" "$SSH_CONFIG" 2>/dev/null; then
	say "Хост '$HOST_ALIAS' уже описан в $SSH_CONFIG — не трогаю."
else
	say "Добавляю хост '$HOST_ALIAS' в $SSH_CONFIG."
	touch "$SSH_CONFIG"
	chmod 600 "$SSH_CONFIG"
	cat >>"$SSH_CONFIG" <<EOF

# Выкат сайта — добавлено scripts/setup-ssh.sh
Host $HOST_ALIAS
    HostName $REMOTE_HOST
    User $REMOTE_USER
    IdentityFile $KEY_PATH
    IdentitiesOnly yes
EOF
fi

# 3. Уже пускает?
if ssh -o BatchMode=yes -o ConnectTimeout=8 "$HOST_ALIAS" 'true' 2>/dev/null; then
	say "Доступ по ключу уже работает — засев не нужен."
else
	say "Копирую публичный ключ на сервер."
	say "СЕЙЧАС СЕРВЕР СПРОСИТ ПАРОЛЬ — введите его сами."
	ssh-copy-id -i "${KEY_PATH}.pub" -o StrictHostKeyChecking=accept-new "$REMOTE_USER@$REMOTE_HOST" \
		|| die "ssh-copy-id не отработал. Проверьте пароль и что вход по паролю разрешён на сервере."
fi

# 4. Проверка фактом
if ssh -o BatchMode=yes -o ConnectTimeout=8 "$HOST_ALIAS" 'echo ok' >/dev/null 2>&1; then
	say "Готово: 'ssh $HOST_ALIAS' работает без пароля."
	say "Дальше: ./scripts/deploy.sh"
else
	die "Ключ скопирован, но вход по ключу не проходит. Проверьте на сервере: chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys"
fi
