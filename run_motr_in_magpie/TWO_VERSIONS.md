# Two parallel Spotlight experiments (SONA and Prolific)

One repository, **shared stimuli and core logic**, **two independent front-end apps**.

## Layout

```
run_motr_in_magpie/
  OneStop/                 ← shared CSVs, workbook, Cambridge files
  shared/                  ← trial builders, parsers (edit once for both)
  spotlight_SONA/          ← SONA recruitment app
  spotlight_PROLIFIC/      ← Prolific recruitment app
  Results/
    spotlight_SONA/        ← ZIP uploads for SONA
    spotlight_PROLIFIC/    ← ZIP uploads for Prolific
```

## What to edit per version

| Change | SONA | Prolific |
|--------|------|----------|
| Consent text | `spotlight_SONA/src/components/ConsentSONA.vue` | `spotlight_PROLIFIC/src/components/ConsentPROLIFIC.vue` |
| Article selection, IDs, upload URL | `spotlight_SONA/src/studyConfig.js` | `spotlight_PROLIFIC/src/studyConfig.js` |
| Shared trial logic | `shared/*.js` | same files |

## Local run

```bash
cd run_motr_in_magpie/spotlight_SONA && npm install && npm run serve
cd run_motr_in_magpie/spotlight_PROLIFIC && npm install && npm run serve
```

Final screen: `shared/components/ExportReportsScreen.vue` (no `demo/` dependency).

## GitHub Pages (after push to `main`)

| Version | URL |
|---------|-----|
| SONA | `https://vkuperman.github.io/MoTR_spotlight/spotlight_SONA/` |
| Prolific | `https://vkuperman.github.io/MoTR_spotlight/spotlight_PROLIFIC/` |

Workflow: `.github/workflows/deploy-to-gh-pages.yml`

## Vercel (results upload)

Create **two** Vercel projects from this repo:

| Project | Build command | Output | `GITHUB_RESULTS_PATH` |
|---------|---------------|--------|------------------------|
| `mo-tr-spotlight-sona` | `cd run_motr_in_magpie/spotlight_SONA && npm install && npm run build` | `run_motr_in_magpie/spotlight_SONA/dist` | `run_motr_in_magpie/Results/spotlight_SONA` |
| `mo-tr-spotlight-prolific` | `cd run_motr_in_magpie/spotlight_PROLIFIC && npm install && npm run build` | `run_motr_in_magpie/spotlight_PROLIFIC/dist` | `run_motr_in_magpie/Results/spotlight_PROLIFIC` |

Both need: `GITHUB_TOKEN`, `GITHUB_REPO=vkuperman/MoTR_spotlight`, `GITHUB_BRANCH=results` (uploads; code deploys from `main`).

Set each app’s `resultsUploadUrl` in `studyConfig.js` to match its Vercel URL.

Each upload POST must include `studyKey` and `githubResultsPath` matching that deployment (`spotlight_SONA` vs `spotlight_PROLIFIC`). Cross-pipeline uploads are rejected with HTTP 403.

Results commits use `[skip ci]` in the message. Vercel projects use `scripts/vercel-ignore-build.sh` so results-only pushes do not redeploy both apps.

### One-time Vercel setup

Run `scripts\setup-vercel-projects.cmd` (or the `.ps1` with `-ExecutionPolicy Bypass`) with `VERCEL_TOKEN` set — see [../../VERCEL_SETUP.md](../../VERCEL_SETUP.md).

## Manual article selection

Per app — in that app’s `studyConfig.js`:

- `manualArticleSelectionEnabled: true|false`
- `manualArticleNumbers: [1, 2, ...]`
