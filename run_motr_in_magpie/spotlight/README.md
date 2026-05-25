# MoTR Spotlight (OneStop texts)

Mouse-tracking for Reading — same Magpie + click-to-reveal flow as `provo`. **Reading passages** are built at compile time from every `*.csv` in **`run_motr_in_magpie/OneStop/Texts`** (not from `spotlight_items_list*.tsv`). Practice trials still come from `trials/spotlight_items_practice.tsv`.

## OneStop CSV format

Each file should have a header row with three difficulty columns, for example **`Elementary`**, **`Intermediate`** (a trailing space in the header is fine), and **`Advanced`**. Rows may also include metadata columns such as **`Article Number`**, **`Title`**, **`Paragraph`**, and **`Source File`**; these are copied into hidden trial fields.

Within each level, **each CSV data row** is at most **one** MoTR screen for that level (one `text` per trial when the cell is long enough). The same **`onestop_file`** (CSV base name) and **`onestop_level`** (`elementary` / `intermediate` / `advanced`) are stored on every trial.

**Paragraph index (`onestop_paragraph_index`)** is the **1-based data row number** in the Text CSV (first row after the header = **1**, same as workbook **`paragraph #`**). **`onestop_paragraph_count`** is the number of data rows in that CSV.

Passage text for a cell follows the **WNL Rwanda.csv** convention:

1. **Default:** line breaks inside the cell are **soft wraps** and are collapsed to spaces (one passage per row per level).
2. **Exception:** if a cell contains a **blank line** (newline, optional spaces, newline), the chunks are **joined with a space** into **one** passage for that row, so one workbook row still maps to one paragraph number.

Very short cells (under **20** characters after cleanup) do not create a trial for that level on that row. Legacy apostrophe glitches (`Ð`, etc.) are normalized lightly.

## Comprehension questions (`OneStop Stimuli .xlsx`)

Place **`OneStop Stimuli .xlsx`** next to the `Texts` folder under **`run_motr_in_magpie/OneStop/`** (note the space before `.xlsx` in the current filename).

The first worksheet is read. Each row should include either **`.csv name`** / **`csv name`** or **`FileName`** (matching the text file stem, compared case-insensitively after normalizing spaces), **`paragraph #`** or **`Paragraph`** (integer, **same as the 1-based Text CSV data row index**), and three question blocks. The older format is **Q1** + **1A–1D** + **CorrectAns1**, **Q2** + **2A–2D** + **CorrectAns2**, **Q3** + **3A–3D** + **CorrectAns3**. The master-list format is also supported: **Q:** + **Qa:–Qd:**, **Q1:** + **Q1a:–Q1d:**, and **Q2:** + **Q2a:–Q2d:**, where the `a` option is treated as the correct answer.

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

After the Cambridge General English test, the reading levels are assigned from the participant's score. Scores **0-14** receive **elementary + intermediate**. Scores **22-25** receive **intermediate + advanced**. Scores **15-21** are randomly assigned to either **elementary + intermediate** or **intermediate + advanced**. Participants are never assigned **elementary + advanced** together.

For each participant, the app assigns **15 articles** to each selected level. All 30 article assignments are then presented in random article order. Within an article, paragraphs are always presented in source order (`1`, `2`, `3`, etc.). Hidden fields record the Cambridge score, assignment rule, selected level pair, article order, article number, title, level, and paragraph index.
