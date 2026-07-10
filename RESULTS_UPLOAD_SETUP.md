# Automatic results upload (Spotlight)

Participant result ZIPs from **https://vkuperman.github.io/MoTR_spotlight/spotlight/** are uploaded at the end of each session to **this repository** under:

`run_motr_in_magpie/Results/`

Test sessions (debug mode) are saved under:

`run_motr_in_magpie/Results/test/`

**MoTR_Click experiments** (demo, provo, etc.) use a **separate** Vercel project and save to **`MoTR_Click/Results/`** only. Do not point both projects at the same `GITHUB_REPO` unless you intend to.

## Spotlight Vercel project (`mo-tr-spotlight`)

Spotlight `magpie.config.js` uses:

`https://mo-tr-spotlight.vercel.app/api/upload-results`

In that Vercel project → **Settings** → **Environment Variables**:

| Name | Value |
|------|--------|
| `GITHUB_TOKEN` | PAT with **Contents: Read and write** on `MoTR_spotlight` |
| `GITHUB_REPO` | `vkuperman/MoTR_spotlight` |
| `GITHUB_RESULTS_PATH` | `run_motr_in_magpie/Results` |
| `GITHUB_BRANCH` | `results` (participant uploads; avoids Vercel deploy quota on `main`) |
| `RESEND_API_KEY` | Resend API key (optional; enables email ZIP backup on **complete** uploads) |
| `EMAIL_TO` | `readinglabmotr@gmail.com` (optional; defaults to this address) |

Redeploy after changing env vars.

### Avoid Vercel deployment rate limits during data collection

Participant uploads commit to the **`results`** branch (not `main`). Vercel is configured with `"git.deploymentEnabled": { "results": false }` so those pushes do **not** start deployments.

On the Hobby plan, even **skipped** builds from the ignore script still count toward the **100 deployments/day** limit when commits land on `main`. Using a separate branch avoids that entirely.

For analysis, pull or merge `origin/results` locally (`git fetch origin results && git checkout results` or merge into your working branch).

### Email backup (optional)

When `RESEND_API_KEY` is set, each **complete** session upload still commits to GitHub and also emails a ZIP copy to `EMAIL_TO` (default `readinglabmotr@gmail.com`). Partial article checkpoints are GitHub-only (no email).

On Resend’s free tier you may need to verify the recipient address or add a custom sending domain before mail delivers.

## MoTR_Click Vercel project (`mo-tr-click`)

Apps that use `https://mo-tr-click.vercel.app/api/upload-results` should use **this** env block instead:

| Name | Value |
|------|--------|
| `GITHUB_TOKEN` | PAT with **Contents: Read and write** on `MoTR_Click` |
| `GITHUB_REPO` | `vkuperman/MoTR_Click` |
| `GITHUB_RESULTS_PATH` | `Results` |
| `GITHUB_BRANCH` | `results` (participant uploads; avoids Vercel deploy quota on `main`) |

Redeploy the **mo-tr-click** project after changes.

## Verify

- Spotlight test upload should return a path under `run_motr_in_magpie/Results/`.
- MoTR_Click upload should return a path under `Results/`.

See `api/README.md` for optional email delivery via Resend.
