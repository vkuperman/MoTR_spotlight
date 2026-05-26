# Pushing `run_motr_in_magpie` to GitHub (`MoTR_Emily`)

## Important: Git root is the parent folder

Git does **not** live inside `run_motr_in_magpie`. The repository root is:

```
C:\Users\emhig\seadrive_root\Emily_Higgins\Shared with me\MouseTracking\MoTR_spotlight
```

When you push branch **`MoTR_Emily`**, GitHub receives the whole repo, including everything under `run_motr_in_magpie/` (spotlight app, OneStop texts, Cambridge CSVs, demo, provo, etc.).

This folder is already configured:

| Setting | Value |
|--------|--------|
| Remote `origin` | `https://github.com/vkuperman/MoTR_spotlight.git` |
| Current branch | `MoTR_Emily` |
| Tracks | `origin/MoTR_Emily` |

## One-step push (after Git is installed)

1. Install [Git for Windows](https://git-scm.com/download/win) (choose “Git from the command line”).
2. Open **Command Prompt** or PowerShell in the **MoTR_spotlight** folder (parent of this directory).
3. Run **either**:

**Option A — batch file (no PowerShell script policy issues):**

```bat
push-MoTR_Emily.bat
```

**Option B — PowerShell script** (if scripts are blocked, use Option A or the bypass below):

```powershell
powershell -ExecutionPolicy Bypass -File .\push-MoTR_Emily.ps1
```

## Manual commands

```powershell
cd "C:\Users\emhig\seadrive_root\Emily_Higgins\Shared with me\MouseTracking\MoTR_spotlight"
git checkout MoTR_Emily
git add run_motr_in_magpie/
git status
git commit -m "OneStop spotlight experiment with Cambridge English block after consent."
git push -u origin MoTR_Emily
```

## What gets pushed from `run_motr_in_magpie`

- `spotlight/` — Vue/Magpie app (`App.vue`, `cambridgeGeneralEnglish.js`, …)
- `OneStop/Texts/*.csv`, `OneStop/Cambridge/*.csv`, `OneStop/OneStop Stimuli .xlsx`
- `demo/`, `provo/` — shared Magpie components used by spotlight

Not pushed (ignored by `.gitignore`): `node_modules/`, `dist/`, local `.env` files.

## Verify on GitHub

After a successful push, open:

https://github.com/vkuperman/MoTR_spotlight/tree/MoTR_Emily

You should see `run_motr_in_magpie/spotlight/src/cambridgeGeneralEnglish.js` and the updated `App.vue`.

## If push fails

- **Auth**: Use a GitHub personal access token (HTTPS) or SSH keys.
- **Permission**: You need write access to `vkuperman/MoTR_spotlight`.
- **Conflicts**: `git pull origin MoTR_Emily` then commit again, then push.
