#!/usr/bin/env bash
# Builds the landing and puts it on the family's host under /srv/vibeide/site — see site-deploy of the family kit.
# The download links are taken from GitHub at build time, so a deploy after a release refreshes them.
#
# Runs on the OWNER'S machine: ./deploy.sh [--alias vibememory]
set -euo pipefail
cd "$(dirname "$0")"
exec ./node_modules/.bin/site-deploy --site /srv/vibeide/site "$@"
