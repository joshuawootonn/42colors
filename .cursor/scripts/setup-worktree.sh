#!/usr/bin/env bash
set -Eeuo pipefail

log() {
  printf '[worktree-setup] %s\n' "$*"
}

warn() {
  printf '[worktree-setup] WARNING: %s\n' "$*" >&2
}

current_worktree="$(git rev-parse --show-toplevel)"
git_common_dir="$(git rev-parse --git-common-dir)"

if [[ "$git_common_dir" != /* ]]; then
  git_common_dir="$(cd "$current_worktree" && cd "$git_common_dir" && pwd -P)"
fi

primary_worktree="$(dirname "$git_common_dir")"

sync_env_files() {
  if [[ "$current_worktree" == "$primary_worktree" ]]; then
    log "Current directory is the primary worktree. Skipping env sync."
    return 0
  fi

  local overwrite_existing="${WORKTREE_SYNC_ENV_OVERWRITE:-0}"
  local -a env_files=()
  mapfile -t env_files < <(
    git -C "$primary_worktree" ls-files --cached --others --ignored --exclude-standard -- '.env*' '**/.env*'
  )

  if ((${#env_files[@]} == 0)); then
    warn "No .env files found in primary worktree ($primary_worktree)."
    return 0
  fi

  local copied=0
  local updated=0
  local skipped=0
  local relative_path=""
  local source_path=""
  local target_path=""

  for relative_path in "${env_files[@]}"; do
    if [[ "$relative_path" == *.example ]]; then
      continue
    fi

    source_path="$primary_worktree/$relative_path"
    target_path="$current_worktree/$relative_path"

    if [[ ! -f "$source_path" ]]; then
      continue
    fi

    mkdir -p "$(dirname "$target_path")"

    if [[ ! -f "$target_path" ]]; then
      cp "$source_path" "$target_path"
      log "Copied $relative_path"
      ((copied += 1))
      continue
    fi

    if cmp -s "$source_path" "$target_path"; then
      ((skipped += 1))
      continue
    fi

    if [[ "$overwrite_existing" == "1" ]]; then
      cp "$source_path" "$target_path"
      log "Updated $relative_path"
      ((updated += 1))
    else
      warn "Keeping existing $relative_path (set WORKTREE_SYNC_ENV_OVERWRITE=1 to overwrite)."
      ((skipped += 1))
    fi
  done

  log "Env sync complete (copied=$copied, updated=$updated, skipped=$skipped)."
}

run_pm2_install() {
  if ! command -v pm2 >/dev/null 2>&1; then
    warn "pm2 not found; skipping 'pm2 install'."
    return 0
  fi

  log "Running pm2 install..."
  if pm2 install; then
    log "pm2 install completed."
    return 0
  fi

  if [[ "${WORKTREE_SETUP_STRICT_PM2:-0}" == "1" ]]; then
    warn "pm2 install failed and strict mode is enabled."
    return 1
  fi

  warn "pm2 install failed; continuing. Set WORKTREE_SETUP_STRICT_PM2=1 to fail."
  return 0
}

install_web_dependencies() {
  if [[ ! -f "$current_worktree/web/package.json" ]]; then
    return 0
  fi

  if ! command -v bun >/dev/null 2>&1; then
    warn "bun not found; skipping web dependency install."
    return 0
  fi

  log "Installing web dependencies with bun..."
  (
    cd "$current_worktree/web"
    bun install
  )
}

main() {
  log "Current worktree: $current_worktree"
  log "Primary worktree: $primary_worktree"

  sync_env_files
  run_pm2_install
  install_web_dependencies

  log "Worktree setup complete."
}

main "$@"
