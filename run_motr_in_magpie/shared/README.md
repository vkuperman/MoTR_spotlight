# MoTR Spotlight — shared library

Code used by **both** experiment apps (`spotlight_SONA/` and `spotlight_PROLIFIC/`). Edit here when changing trial building, Cambridge scoring, or OneStop question merging.

- `components/ExportReportsScreen.vue` — end-of-study ZIP upload and thank-you screen (import via `@motr-shared/components/ExportReportsScreen.vue`).

**Do not** put version-specific consent text or article-selection flags here — those live in each app’s `src/studyConfig.js` and `src/components/ConsentSONA.vue` / `ConsentPROLIFIC.vue`.

## Modules

| File | Purpose |
|------|---------|
| `buildOneStopTrialLists.js` | Build trials from `../OneStop/Texts/*.csv`; article-level selection |
| `parseOneStopStimuli.js` | Merge questions from `OneStop Stimuli .xlsx` |
| `cambridgeGeneralEnglish.js` | Cambridge test + CEFR bands |
| `cambridgeAssignment.js` | Score → level pair rules |
| `readingTrialSetup.js` | Assemble practice + reading trials after Cambridge |

## Webpack alias

Each app’s `vue.config.js` sets `@motr-shared` → this folder.
