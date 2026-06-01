# Vercel: two projects (SONA + Prolific)

## Push to GitHub first (required)

Vercel builds from **`vkuperman/MoTR_spotlight` branch `main`**, not from your Seafile/OneDrive copy.

On GitHub `main` today there is only the old folder `run_motr_in_magpie/spotlight/`. The Prolific project is configured to build `run_motr_in_magpie/spotlight_PROLIFIC/`, which **does not exist on GitHub until you push** your local renames (`spotlight_SONA`, `spotlight_PROLIFIC`, `shared/`, updated `vercel.json`, etc.).

Typical failed deploy log: `cd: run_motr_in_magpie/spotlight_PROLIFIC: No such file or directory`.

After pushing, open each Vercel project → **Deployments** → **Redeploy** (or push again to trigger a build).

See [PUSH_FOR_VERCEL.md](PUSH_FOR_VERCEL.md) for copy/paste git steps from your real clone.

| Project name | URL | Results folder |
|--------------|-----|----------------|
| `mo-tr-spotlight-sona` | https://mo-tr-spotlight-sona.vercel.app | `run_motr_in_magpie/Results/spotlight_SONA` |
| `mo-tr-spotlight-prolific` | https://mo-tr-spotlight-prolific.vercel.app | `run_motr_in_magpie/Results/spotlight_PROLIFIC` |

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

## Manual setup (dashboard)

For each project, connect **GitHub** → `vkuperman/MoTR_spotlight`, branch `main`:

### mo-tr-spotlight-sona

- **Build Command:** `cd run_motr_in_magpie/spotlight_SONA && npm install && npm run build`
- **Output Directory:** `run_motr_in_magpie/spotlight_SONA/dist`
- **Environment:** `GITHUB_RESULTS_PATH=run_motr_in_magpie/Results/spotlight_SONA`

### mo-tr-spotlight-prolific

- **Build Command:** `cd run_motr_in_magpie/spotlight_PROLIFIC && npm install && npm run build`
- **Output Directory:** `run_motr_in_magpie/spotlight_PROLIFIC/dist`
- **Environment:** `GITHUB_RESULTS_PATH=run_motr_in_magpie/Results/spotlight_PROLIFIC`

Shared on both: `GITHUB_REPO=vkuperman/MoTR_spotlight`, `GITHUB_BRANCH=main`, `GITHUB_TOKEN=...`

## App config (already in repo)

- `run_motr_in_magpie/spotlight_SONA/src/studyConfig.js` → `resultsUploadUrl: https://mo-tr-spotlight-sona.vercel.app/api/upload-results`
- `run_motr_in_magpie/spotlight_PROLIFIC/src/studyConfig.js` → `resultsUploadUrl: https://mo-tr-spotlight-prolific.vercel.app/api/upload-results`
