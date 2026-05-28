# Upload results API (MoTR_spotlight)

Serverless endpoint: **POST /api/upload-results**

**Production URL:** `https://mo-tr-spotlight.vercel.app/api/upload-results`

Used by the **Spotlight** experiment only. MoTR_Click apps should call `https://mo-tr-click.vercel.app/api/upload-results` instead (see `RESULTS_UPLOAD_SETUP.md`).

Accepts `{ participantId: string, zipBase64: string, isTest?: boolean }`.

## Environment variables (Vercel: mo-tr-spotlight project)

| Variable | Value for Spotlight |
|----------|---------------------|
| `GITHUB_TOKEN` | PAT with Contents write on `MoTR_spotlight` |
| `GITHUB_REPO` | `vkuperman/MoTR_spotlight` |
| `GITHUB_RESULTS_PATH` | `run_motr_in_magpie/Results` |
| `GITHUB_BRANCH` | `main` (optional) |

Default code targets in this repo: `run_motr_in_magpie/Results/` (tests in `.../test/`).

## MoTR_Click (separate Vercel project)

For `mo-tr-click.vercel.app`, set `GITHUB_REPO=vkuperman/MoTR_Click` and `GITHUB_RESULTS_PATH=Results`.

## Reports in the zip

- **fixation_report.csv**
- **interest_area_report.csv**
- **raw_trial_data.csv**
