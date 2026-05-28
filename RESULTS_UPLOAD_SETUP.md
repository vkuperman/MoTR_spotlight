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
| `GITHUB_BRANCH` | `main` (optional) |

Redeploy after changing env vars.

## MoTR_Click Vercel project (`mo-tr-click`)

Apps that use `https://mo-tr-click.vercel.app/api/upload-results` should use **this** env block instead:

| Name | Value |
|------|--------|
| `GITHUB_TOKEN` | PAT with **Contents: Read and write** on `MoTR_Click` |
| `GITHUB_REPO` | `vkuperman/MoTR_Click` |
| `GITHUB_RESULTS_PATH` | `Results` |
| `GITHUB_BRANCH` | `main` (optional) |

Redeploy the **mo-tr-click** project after changes.

## Verify

- Spotlight test upload should return a path under `run_motr_in_magpie/Results/`.
- MoTR_Click upload should return a path under `Results/`.

See `api/README.md` for optional email delivery via Resend.
