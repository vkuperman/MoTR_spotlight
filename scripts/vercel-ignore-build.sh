#!/bin/sh
# Vercel Ignored Build Step: exit 0 skips the build, exit 1 builds.
# Results uploads are always skipped. Everything else builds only when the
# commit message explicitly contains [vercel build].

COMMIT_MSG=$(printf '%s' "$VERCEL_GIT_COMMIT_MESSAGE")

case "$COMMIT_MSG" in
  *"[skip ci]"*)
    echo "[vercel-ignore] Commit message contains [skip ci]; skipping deployment"
    exit 0
    ;;
esac

CHANGED=""
if [ -n "$VERCEL_GIT_PREVIOUS_SHA" ] && [ -n "$VERCEL_GIT_COMMIT_SHA" ]; then
  CHANGED=$(git diff --name-only "$VERCEL_GIT_PREVIOUS_SHA" "$VERCEL_GIT_COMMIT_SHA" 2>/dev/null || true)
fi
if [ -z "$CHANGED" ]; then
  CHANGED=$(git diff --name-only HEAD^ HEAD 2>/dev/null || true)
fi

if [ -n "$CHANGED" ]; then
  NON_RESULTS=$(printf '%s\n' "$CHANGED" | grep -v '^run_motr_in_magpie/Results/' || true)
  if [ -z "$NON_RESULTS" ]; then
    echo "[vercel-ignore] Only run_motr_in_magpie/Results/ changed; skipping deployment"
    exit 0
  fi
fi

case "$COMMIT_MSG" in
  *"[vercel build]"*)
    echo "[vercel-ignore] Commit message contains [vercel build]; proceeding with build"
    exit 1
    ;;
esac

echo "[vercel-ignore] No explicit [vercel build] request; skipping deployment"
exit 0
