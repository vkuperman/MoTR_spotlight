# MoTR Spotlight — SONA

Mouse-tracking for Reading. **Prolific** version: `../spotlight_PROLIFIC/`. Shared code: `../shared/`. See [../TWO_VERSIONS.md](../TWO_VERSIONS.md).

**Reading passages** from `../OneStop/Texts/*.csv`. Practice: `trials/spotlight_items_practice.tsv`.

**Edit here:** `src/components/ConsentSONA.vue`, `src/studyConfig.js` (e.g. `articlesPerLevel: 6` → 12 texts in two level blocks; Prolific uses 3 per block → 6 total).

```bash
npm install
npm run serve
```
