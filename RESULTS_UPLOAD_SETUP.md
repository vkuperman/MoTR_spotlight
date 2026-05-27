# Automatic results upload (Spotlight / GitHub Pages)

Participant result ZIPs from **https://vkuperman.github.io/MoTR_spotlight/spotlight/** are uploaded at the end of each session to this repository under:

`run_motr_in_magpie/Results/`

Test sessions (debug mode) are saved under:

`run_motr_in_magpie/Results/test/`

## One-time server setup (Vercel)

The browser cannot write directly to GitHub. The upload API (`api/upload-results.js`) receives the ZIP and commits it to `main`.

Spotlight uses the existing deployment: **https://mo-tr-click.vercel.app/api/upload-results**

1. Open the **mo-tr-click** project on [Vercel](https://vercel.com) (linked to `vkuperman/MoTR_Click`).
2. In **Settings** → **Environment Variables**, add or update:

   | Name | Value |
   |------|--------|
   | `GITHUB_TOKEN` | Personal access token with **Contents: Read and write** on `MoTR_spotlight` |
   | `GITHUB_REPO` | `vkuperman/MoTR_spotlight` (optional; this is the default) |
   | `GITHUB_RESULTS_PATH` | `run_motr_in_magpie/Results` (optional; default) |
   | `GITHUB_BRANCH` | `main` (optional; default) |

3. **Redeploy** the Vercel project (Deployments → … → Redeploy).

4. Confirm the API responds (should not be `500 Server not configured`):

   `https://mo-tr-click.vercel.app/api/upload-results`

(Optional) You can instead deploy this repo’s `api/` folder as its own Vercel project and set `resultsUploadUrl` in `magpie.config.js` to that URL.

After this, each completed Spotlight session uploads a ZIP named like:

`run_motr_in_magpie/Results/<participantId>_motr_results_<timestamp>.zip`

Each ZIP contains `fixation_report.csv`, `interest_area_report.csv`, and `raw_trial_data.csv`.

See also `api/README.md` for optional email delivery via Resend.
