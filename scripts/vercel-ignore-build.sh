#!/bin/sh
# Vercel Ignored Build Step: exit 0 to skip the build, exit 1 to build.
# Prevents results-only GitHub commits (and unrelated app changes) from redeploying both pipelines.

SPOTLIGHT_APP=$(printf '%s' "$SPOTLIGHT_APP" | tr '[:lower:]' '[:upper:]')
COMMIT_MSG=$(printf '%s' "$VERCEL_GIT_COMMIT_MESSAGE")

# Results uploads always commit with [skip ci] (see api/upload-results.js).
case "$COMMIT_MSG" in
  *"[skip ci]"*)
    echo "[vercel-ignore] Commit message contains [skip ci]; skipping $SPOTLIGHT_APP deployment"
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

if [ -z "$CHANGED" ]; then
  echo "[vercel-ignore] Could not determine changed files; proceeding with build"
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
  echo "[vercel-ignore] Unknown SPOTLIGHT_APP=$SPOTLIGHT_APP; proceeding with build"
  exit 1
fi

SHARED_TOUCHED=$(printf '%s\n' "$CHANGED" | grep -E '^run_motr_in_magpie/shared/|^run_motr_in_magpie/OneStop/|^run_motr_in_magpie/build_onestop_texts_from_master\.py|^api/|^scripts/vercel-build|^scripts/vercel-ignore-build|^vercel\.json|^vercel\.spotlight-PROLIFIC\.json' || true)
APP_TOUCHED=$(printf '%s\n' "$CHANGED" | grep "^${APP_PREFIX}/" || true)

if [ -z "$SHARED_TOUCHED" ] && [ -z "$APP_TOUCHED" ]; then
  echo "[vercel-ignore] No $SPOTLIGHT_APP or shared code changes; skipping deployment"
  exit 0
fi

exit 1
