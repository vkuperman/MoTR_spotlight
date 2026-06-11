#!/bin/sh
# Vercel Ignored Build Step: exit 0 to skip the build, exit 1 to build.
# Prevents results-only GitHub commits (and unrelated app changes) from redeploying both pipelines.

SPOTLIGHT_APP=$(printf '%s' "$SPOTLIGHT_APP" | tr '[:lower:]' '[:upper:]')
CHANGED=$(git diff --name-only HEAD^ HEAD 2>/dev/null || true)

if [ -z "$CHANGED" ]; then
  exit 1
fi

NON_RESULTS=$(printf '%s\n' "$CHANGED" | grep -v '^run_motr_in_magpie/Results/' || true)
if [ -z "$NON_RESULTS" ]; then
  echo "[vercel-ignore] Only run_motr_in_magpie/Results/ changed; skipping $SPOTLIGHT_APP deployment"
  exit 0
fi

if [ "$SPOTLIGHT_APP" = "SONA" ]; then
  APP_PREFIX="run_motr_in_magpie/spotlight_SONA"
elif [ "$SPOTLIGHT_APP" = "PROLIFIC" ]; then
  APP_PREFIX="run_motr_in_magpie/spotlight_PROLIFIC"
else
  exit 1
fi

SHARED_TOUCHED=$(printf '%s\n' "$CHANGED" | grep -E '^run_motr_in_magpie/shared/|^api/|^scripts/vercel-build|^scripts/vercel-ignore-build|^vercel\.json' || true)
APP_TOUCHED=$(printf '%s\n' "$CHANGED" | grep "^${APP_PREFIX}/" || true)

if [ -z "$SHARED_TOUCHED" ] && [ -z "$APP_TOUCHED" ]; then
  echo "[vercel-ignore] No $SPOTLIGHT_APP or shared code changes; skipping deployment"
  exit 0
fi

exit 1
