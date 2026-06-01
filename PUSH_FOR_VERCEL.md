# Push local changes so Vercel can deploy

Vercel clones **GitHub** (`vkuperman/MoTR_spotlight`, branch `main`).  
Your Seafile cache folder may not be a git repo; use the clone where you normally run `git push`.

## What must be on `main` before deploy works

- `run_motr_in_magpie/spotlight_SONA/`
- `run_motr_in_magpie/spotlight_PROLIFIC/`
- `run_motr_in_magpie/shared/` (including `shared/components/ExportReportsScreen.vue`)
- Root `vercel.json` / `vercel.spotlight-PROLIFIC.json` (if you use them)
- `api/upload-results.js`, `.github/workflows/deploy-to-gh-pages.yml`

## Suggested steps (from your git clone)

```bash
cd path/to/MoTR_spotlight
git status
git add run_motr_in_magpie/spotlight_SONA run_motr_in_magpie/spotlight_PROLIFIC run_motr_in_magpie/shared
git add run_motr_in_magpie/TWO_VERSIONS.md vercel.json vercel.spotlight-PROLIFIC.json VERCEL_SETUP.md
git add api/ .github/ scripts/ package.json PUSH_FOR_VERCEL.md
git status
git commit -m "Add SONA and Prolific spotlight apps for dual Vercel deploys"
git push origin main
```

If the old `run_motr_in_magpie/spotlight/` folder was removed locally, include that deletion in the same commit (`git add -A run_motr_in_magpie`).

## After push

1. Vercel → **mo-tr-spotlight-prolific** → Deployments → confirm a new build starts.
2. Build command should be:  
   `cd run_motr_in_magpie/spotlight_PROLIFIC && npm install && npm run build`
3. Output directory: `run_motr_in_magpie/spotlight_PROLIFIC/dist`
4. Env: `GITHUB_TOKEN`, `GITHUB_REPO=vkuperman/MoTR_spotlight`, `GITHUB_BRANCH=main`,  
   `GITHUB_RESULTS_PATH=run_motr_in_magpie/Results/spotlight_PROLIFIC`

Repeat for **mo-tr-spotlight-sona** with `spotlight_SONA` paths.
