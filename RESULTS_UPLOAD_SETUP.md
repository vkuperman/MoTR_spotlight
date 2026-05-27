# Automatic results upload (Spotlight / GitHub Pages)

Participant result ZIPs from **https://vkuperman.github.io/MoTR_spotlight/spotlight/** are uploaded at the end of each session to this repository under:

`run_motr_in_magpie/Results/`

Test sessions (debug mode) are saved under:

`run_motr_in_magpie/Results/test/`

## One-time server setup (Vercel)

The browser cannot write directly to GitHub. A small API in this repo (`api/upload-results.js`) receives the ZIP and commits it to `main`.

1. Open [Vercel](https://vercel.com) and **Import** the `vkuperman/MoTR_spotlight` GitHub repository (if it is not already connected).
2. In the Vercel project → **Settings** → **Environment Variables**, add:

   | Name | Value |
   |------|--------|
   | `GITHUB_TOKEN` | Personal access token with **Contents: Read and write** on `MoTR_spotlight` |
   | `GITHUB_REPO` | `vkuperman/MoTR_spotlight` (optional; this is the default) |
   | `GITHUB_RESULTS_PATH` | `run_motr_in_magpie/Results` (optional; default) |
   | `GITHUB_BRANCH` | `main` (optional; default) |

3. **Redeploy** the Vercel project (Deployments → … → Redeploy).

4. Confirm the API responds (should not be `500 Server not configured`):

   `https://motr-spotlight.vercel.app/api/upload-results`

After this, each completed Spotlight session uploads a ZIP named like:

`run_motr_in_magpie/Results/<participantId>_motr_results_<timestamp>.zip`

Each ZIP contains `fixation_report.csv`, `interest_area_report.csv`, and `raw_trial_data.csv`.

See also `api/README.md` for optional email delivery via Resend.
