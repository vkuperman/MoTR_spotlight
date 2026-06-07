# Vercel: two projects (SONA + Prolific)

## Push to GitHub first (required)

Vercel builds from **`vkuperman/MoTR_spotlight` branch `main`**, not from your Seafile/OneDrive copy.

On GitHub `main` today there is only the old folder `run_motr_in_magpie/spotlight/`. The Prolific project is configured to build `run_motr_in_magpie/spotlight_PROLIFIC/`, which **does not exist on GitHub until you push** your local renames (`spotlight_SONA`, `spotlight_PROLIFIC`, `shared/`, updated `vercel.json`, etc.).

Typical failed deploy log: `cd: run_motr_in_magpie/spotlight_PROLIFIC: No such file or directory`.

After pushing, open each Vercel project → **Deployments** → **Redeploy** (or push again to trigger a build).

See [PUSH_FOR_VERCEL.md](PUSH_FOR_VERCEL.md) for copy/paste git steps from your real clone.

| Project name | URL | Results folder |
|--------------|-----|----------------|
| `mo-tr-spotlight-sona` | https://mo-tr-spotlight.vercel.app (see note below) | `run_motr_in_magpie/Results/spotlight_SONA` |
| `mo-tr-spotlight-prolific` | https://mo-tr-spotlight-prolific.vercel.app | `run_motr_in_magpie/Results/spotlight_PROLIFIC` |

**SONA URL note:** The live SONA app is currently served from the legacy project **`mo-tr-spotlight`** at **https://mo-tr-spotlight.vercel.app**. The newer subdomain **https://mo-tr-spotlight-sona.vercel.app** returns 404 if a separate empty `mo-tr-spotlight-sona` project exists without a production deployment. Fix: delete the empty `mo-tr-spotlight-sona` project in Vercel (or redeploy it from `main`), then run `scripts\setup-vercel-projects.cmd` to rename `mo-tr-spotlight` → `mo-tr-spotlight-sona`.

Both serve the repo root `api/upload-results.js` and build a different Vue app.

## Automated setup (recommended)

1. Create a token: https://vercel.com/account/tokens  
2. In PowerShell, from the repo root:

```powershell
cd path\to\MoTR_spotlight
$env:VERCEL_TOKEN = "paste_token_here"
# If projects are under a team:
# $env:VERCEL_TEAM_ID = "team_xxxxxxxx"

# If PowerShell blocks .ps1 (ExecutionPolicy), use either:
scripts\setup-vercel-projects.cmd
# or:
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup-vercel-projects.ps1
```

The script will:

- Rename existing `mo-tr-spotlight` → `mo-tr-spotlight-sona` (if it exists)
- Create `mo-tr-spotlight-prolific` if missing
- Set build/output commands and `GITHUB_REPO` / `GITHUB_RESULTS_PATH` / `GITHUB_BRANCH`

3. In the Vercel UI for **each** project, add **`GITHUB_TOKEN`** (PAT with `contents:write` on `MoTR_spotlight`) if not already present.

4. Redeploy both projects.

## Wrong branch: `gh-pages` (common Prolific failure)

If the build log says:

`Cloning github.com/vkuperman/MoTR_spotlight (Branch: gh-pages, ...)`

and then `cd: run_motr_in_magpie/spotlight_PROLIFIC: No such file or directory`, the project is deploying from **gh-pages**. That branch only has **built** HTML/JS (`spotlight_PROLIFIC/` at the repo root), not the Vue source under `run_motr_in_magpie/`.

**Fix:** Vercel → project → **Settings** → **Git** → **Production Branch** → set to **`main`** (not `gh-pages`). Redeploy.

Or re-run `scripts\setup-vercel-projects.cmd` (sets `productionBranch: main` via API).

## SONA 404 on mo-tr-spotlight-sona.vercel.app

If **mo-tr-spotlight-sona.vercel.app** returns 404 but **mo-tr-spotlight.vercel.app** works, you have two Vercel projects:

1. **`mo-tr-spotlight`** — legacy name, has the working SONA deployment
2. **`mo-tr-spotlight-sona`** — created later, may show “Ready” with no files at the subdomain

**Fix (pick one):**

- **Recommended:** Vercel dashboard → delete the empty **mo-tr-spotlight-sona** project → run `scripts\setup-vercel-projects.cmd` with `VERCEL_TOKEN` set (renames **mo-tr-spotlight** → **mo-tr-spotlight-sona**).
- **Or:** Keep both names: use **https://mo-tr-spotlight.vercel.app** for SONA recruitment (already configured in `studyConfig.js`).

## Prolific: site works but latest deployment shows Error

Vercel keeps failed builds in the list. If the live site loads, **Production** may still point to an older successful deployment. After commit `eaedec0` (build fix), open **mo-tr-spotlight-prolific** → **Deployments** → find the latest **Ready** build on `main` → **Promote to Production**, or **Redeploy** `main`.

Failed builds from commits `7713804` / `c3a2c79` were caused by `??` in `englishProficiencyAdditionalTests.js` (fixed in `eaedec0`).

## Manual setup (dashboard)

For each project, connect **GitHub** → `vkuperman/MoTR_spotlight`, branch `main`:

### mo-tr-spotlight-sona

- **Build Command:** `node scripts/vercel-build.cjs`
- **Output Directory:** `.vercel-build-output/dist`
- **Environment:** `SPOTLIGHT_APP=SONA`, `GITHUB_RESULTS_PATH=run_motr_in_magpie/Results/spotlight_SONA`

### mo-tr-spotlight-prolific

- **Build Command:** `node scripts/vercel-build.cjs`
- **Output Directory:** `.vercel-build-output/dist`
- **Environment:** `SPOTLIGHT_APP=PROLIFIC`, `GITHUB_RESULTS_PATH=run_motr_in_magpie/Results/spotlight_PROLIFIC`

Shared on both: `GITHUB_REPO=vkuperman/MoTR_spotlight`, `GITHUB_BRANCH=main`, `GITHUB_TOKEN=...`

**Important:** Both projects share the root `vercel.json`. They are separated by the **`SPOTLIGHT_APP`** environment variable (`SONA` vs `PROLIFIC`). If Prolific shows the SONA consent form, `SPOTLIGHT_APP` is missing or set to `SONA` on that project.

## App config (already in repo)

- `run_motr_in_magpie/spotlight_SONA/src/studyConfig.js` → `resultsUploadUrl: https://mo-tr-spotlight-sona.vercel.app/api/upload-results`
- `run_motr_in_magpie/spotlight_PROLIFIC/src/studyConfig.js` → `resultsUploadUrl: https://mo-tr-spotlight-prolific.vercel.app/api/upload-results`
