# MoTR Spotlight (OneStop texts)

Mouse-tracking for Reading — same Magpie + click-to-reveal flow as `provo`. **Reading passages** are built at compile time from every `*.csv` in **`run_motr_in_magpie/OneStop/Texts`** (not from `spotlight_items_list*.tsv`). Practice trials still come from `trials/spotlight_items_practice.tsv`.

## OneStop CSV format

Each file should have a header row with three difficulty columns, for example **`Elementary`**, **`Intermediate`** (a trailing space in the header is fine), and **`Advanced`**.

Within each level, **each CSV data row** is at most **one** MoTR screen for that level (one `text` per trial when the cell is long enough). The same **`onestop_file`** (CSV base name) and **`onestop_level`** (`elementary` / `intermediate` / `advanced`) are stored on every trial.

**Paragraph index (`onestop_paragraph_index`)** is the **1-based data row number** in the Text CSV (first row after the header = **1**, same as workbook **`paragraph #`**). **`onestop_paragraph_count`** is the number of data rows in that CSV.

Passage text for a cell follows the **WNL Rwanda.csv** convention:

1. **Default:** line breaks inside the cell are **soft wraps** and are collapsed to spaces (one passage per row per level).
2. **Exception:** if a cell contains a **blank line** (newline, optional spaces, newline), the chunks are **joined with a space** into **one** passage for that row, so one workbook row still maps to one paragraph number.

Very short cells (under **20** characters after cleanup) do not create a trial for that level on that row. Legacy apostrophe glitches (`Ð`, etc.) are normalized lightly.

## Comprehension questions (`OneStop Stimuli .xlsx`)

Place **`OneStop Stimuli .xlsx`** next to the `Texts` folder under **`run_motr_in_magpie/OneStop/`** (note the space before `.xlsx` in the current filename).

The first worksheet is read. Each row should include **`.csv name`** (matching the text file **without** `.csv`, compared case-insensitively after normalizing spaces), **`paragraph #`** (integer, **same as the 1-based Text CSV data row index**), and three question blocks: **Q1** + **1A–1D** + **CorrectAns1**, **Q2** + **2A–2D** + **CorrectAns2**, **Q3** + **3A–3D** + **CorrectAns3**.

For each paragraph trial, the app **draws one of Q1, Q2, or Q3 at random** (among those with a question, options, and a correct answer), shows **four** shuffled alternatives, and scores against the correct option. If no row matches or a slot is incomplete, the trial keeps the **fallback** wording from `buildOneStopTrialLists.js`. Practice trials from the TSV are unchanged.

Workbook **`.csv name`** is matched to the text filename; if the spelling differs slightly, the app uses the closest name within **3** Levenshtein edits (e.g. `Lie detector` ↔ `Lie dectector`). If the CSV has **more data rows** than you have `paragraph #` rows in Excel, extra reading trials keep the fallback question. If Excel has more rows than the CSV, those questions are unused. For 4–7 paragraphs per article, align **row count** and **max `paragraph #`** in the sheet with your Text CSVs.

Hidden fields **`onestop_question_slot`** (`1`, `2`, or `3`) record which question was chosen. Run **`npm install`** after pulling so the **`xlsx`** dependency is installed.
## How to run

```bash
cd run_motr_in_magpie/spotlight
npm install
npm run serve
```

Open the URL shown in the terminal (for example `http://localhost:8080`).

## Build for production

```bash
npm run build
```

Output is written to `dist/`.

## List assignment

Trials are ordered by **filename**, then **row by row** (in CSV order), and within each row **elementary → intermediate → advanced**. That flat list is split into **three blocks** of roughly equal size, **one block is chosen at random** per participant, and trials in that block are **shuffled**. Total reading trials scale with **number of data rows × levels** (minus skipped short cells). Rebuild after changing CSVs or the workbook in `OneStop/`.
