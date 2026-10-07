#!/usr/bin/env bash
# Builds the landing and puts it on the family's host: /srv/vibeide/site/<commit>, then the `current`
# link is switched in one rename, so a visitor never sees half a site. The last three builds stay for
# a rollback by hand. Caddy serves `current` for vibeide.ru — the host's sites are described in one
# file, infra/Caddyfile.tmpl of the VibeMemory repository, and put there by its caddyApply.sh.
#
# The download links are taken from GitHub at build time, so a deploy after a release refreshes them.
#
# Runs on the OWNER'S machine: ./deploy.sh [--alias vibememory]
set -euo pipefail

# The SSH alias of the host is the memory product's: the family's sites share that host
readonly DEFAULT_ALIAS=vibememory
readonly SITE=/srv/vibeide/site
readonly KEEP=3
readonly SSH_OPTIONS=(-o BatchMode=yes -o ConnectTimeout=15 -o ConnectionAttempts=4)

sshAlias="${VIBEIDE_SSH_ALIAS:-$DEFAULT_ALIAS}"
fail() { printf 'Ошибка: %s\n' "$*" >&2; exit 1; }

while [ "$#" -gt 0 ]; do
  case "$1" in
    --alias) sshAlias="${2:-}"; shift 2 ;;
    -h | --help) printf 'Собрать лендинг и выложить на хост.\n\n  ./deploy.sh [--alias %s]\n' "$DEFAULT_ALIAS"; exit 0 ;;
    *) fail "неизвестный аргумент $1" ;;
  esac
done

cd "$(dirname "$0")"
[ -z "$(git status --porcelain)" ] || fail "есть незакоммиченные правки — выкладывается только закоммиченное"
build=$(git rev-parse --short=12 HEAD)

printf '1/2 Собираю лендинг (%s)\n' "$build"
bun run build >/dev/null
[ -f dist/index.html ] || fail "сборка не дала dist/index.html"

printf '2/2 Выкладываю\n'
# the script travels as an argument, the build as stdin
readonly REMOTE='set -euo pipefail
build=$1 site=$2 keep=$3
staging=$(mktemp -d)
trap '\''rm -rf "$staging"'\'' EXIT
tar -xzf - -C "$staging"
sudo install -d -o root -g root -m 755 "$site"
sudo rm -rf "$site/$build"
sudo cp -r "$staging" "$site/$build"
sudo chown -R root:root "$site/$build"
sudo find "$site/$build" -type d -exec chmod 755 {} + -o -type f -exec chmod 644 {} +
sudo ln -sfn "$build" "$site/current.new"
sudo mv -T "$site/current.new" "$site/current"
# the newest builds stay, the rest go; `current` is never among the removed
ls -1t "$site" | grep -vx -e current -e "$build" | tail -n +"$keep" | while read -r old; do sudo rm -rf "${site:?}/$old"; done
echo "Выложена сборка $build"
'
# macOS extended attributes stay home: GNU tar on the host would warn on every file
COPYFILE_DISABLE=1 tar --no-xattrs --no-mac-metadata -C dist -czf - . | ssh "${SSH_OPTIONS[@]}" "$sshAlias" "bash -c $(printf '%q' "$REMOTE") deploy $(printf '%q' "$build") $SITE $KEEP"
