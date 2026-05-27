# Upload results API

Serverless endpoint: **POST /api/upload-results**

Accepts `{ participantId: string, zipBase64: string, isTest?: boolean }` and saves the results zip to GitHub and/or sends it by email. At least one of (email) or (GitHub) must be configured.

**Production URL (MoTR_spotlight):** `https://motr-spotlight.vercel.app/api/upload-results`

## Environment variables (e.g. Vercel)

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_TOKEN` | For GitHub | Personal access token with **Contents: Read and write** on `MoTR_spotlight` |
| `GITHUB_REPO` | Optional | Repo as `owner/repo`; default `vkuperman/MoTR_spotlight` |
| `GITHUB_RESULTS_PATH` | Optional | Folder in repo; default `run_motr_in_magpie/Results` |
| `GITHUB_BRANCH` | Optional | Branch to commit to; default `main` |
| `RESEND_API_KEY` | For email | Resend API key |
| `EMAIL_TO` | For email | Recipient email |

## Save reports on GitHub

1. Create a GitHub token with **Contents: Read and write** for `MoTR_spotlight`.
2. Add `GITHUB_TOKEN` in Vercel → Project → Settings → Environment Variables.
3. Redeploy.

Zips are written to **main** under `run_motr_in_magpie/Results/` (or `.../Results/test/` when `isTest` is true), e.g.:

`run_motr_in_magpie/Results/ABC12DEF_motr_results_2026-05-26T17-30-00.zip`

View them at: https://github.com/vkuperman/MoTR_spotlight/tree/main/run_motr_in_magpie/Results

## Reports in the zip

- **fixation_report.csv** – one row per click (fixation)
- **interest_area_report.csv** – one row per word (interest area) per text
- **raw_trial_data.csv** – full Magpie trial rows for the session

## Troubleshooting

- **500 Server not configured:** set `GITHUB_TOKEN` (or Resend email vars) on Vercel and redeploy.
- **401/403 from GitHub:** token expired or missing Contents write scope.
- **404 on PUT:** check `GITHUB_REPO` is `owner/repo` and the results path exists on `main` (the `Results/README.md` placeholder is enough).
