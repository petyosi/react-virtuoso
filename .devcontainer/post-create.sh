#!/usr/bin/env bash
# Installs dependencies and the Playwright Chromium binary after the container is created.
set -euo pipefail

# A host may mount a shared pnpm store that the container user cannot write to, for example one created by root.
# pnpm then fails partway through the install, so fall back to a store owned by this user.
store="$(pnpm store path)"
if [ -e "$store" ] && [ -n "$(find "$store" -maxdepth 2 -type d ! -writable -print -quit 2>/dev/null)" ]; then
  fallback="${XDG_DATA_HOME:-$HOME/.local/share}/pnpm/store"
  echo "pnpm store $store is not writable by $(id -un); using $fallback" >&2
  export npm_config_store_dir="$fallback"
  export pnpm_config_store_dir="$fallback"
fi

# An existing node_modules linked to another store would otherwise stop a non-interactive install.
pnpm install --frozen-lockfile --config.confirm-modules-purge=false

# The root package has no playwright dependency; run it from a workspace package, as CI does.
pnpm --filter react-virtuoso exec playwright install chromium
