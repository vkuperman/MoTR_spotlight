import _ from 'lodash';

const DEFAULT_QUESTION =
  'Overall, how well could you follow the main ideas in this passage?';
const RESPONSE_TRUE = 'Fairly well or very well';
const RESPONSE_DISTRACTORS = 'Not at all|Only a little';

/** Canonical order within each file. */
const LEVEL_ORDER = ['elementary', 'intermediate', 'advanced'];

/** Drop very short fragments (titles, stray commas). */
const MIN_PARAGRAPH_CHARS = 20;

function rowsFromContextModule(req, key) {
  const mod = req(key);
  const data = mod && mod.default !== undefined ? mod.default : mod;
  return Array.isArray(data) ? data : [];
}

/**
 * Maps canonical level name -> actual CSV header key from the first row.
 */
function resolveLevelKeys(sampleRow) {
  if (!sampleRow || typeof sampleRow !== 'object') return {};
  const keys = Object.keys(sampleRow);
  const out = {};
  for (const level of LEVEL_ORDER) {
    const hit =
      keys.find((k) => k.trim().toLowerCase() === level) ||
      keys.find((k) => k.trim().toLowerCase().startsWith(level));
    if (hit) out[level] = hit;
  }
  return out;
}

function collapseInnerWhitespace(s) {
  return String(s).replace(/\s+/g, ' ').trim();
}

/**
 * Split one cell into paragraph strings (same convention as WNL Rwanda.csv).
 * - One **row** in the sheet normally yields **one** paragraph per level: line breaks
 *   inside a quoted cell are treated as soft wraps and collapsed to spaces.
 * - If a cell contains a **blank line** (newline, optional spaces, newline), the
 *   cell is split into multiple chunks at those boundaries (then merged back into
 *   one passage per row for Excel `paragraph #` alignment — see passageTextFromCell).
 */
function splitCellIntoParagraphs(cellText) {
  const raw = String(cellText);
  if (!raw.trim()) return [];
  const t = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  if (/\n[ \t]*\n/.test(t)) {
    return t
      .split(/\n[ \t]*\n/)
      .map((c) => collapseInnerWhitespace(c.replace(/\n/g, ' ')))
      .filter((c) => c.length > 0);
  }
  return [collapseInnerWhitespace(t.replace(/\n/g, ' '))].filter((c) => c.length > 0);
}

function normalizeLegacyEncoding(text) {
  return String(text)
    .replace(/\u00d0/g, "'")
    .replace(/\u00d5/g, "'")
    .replace(/ Ð /g, " ' ")
    .replace(/Ð/g, "'");
}

/**
 * One display passage per CSV data row and level (matches OneStop Stimuli `paragraph #`
 * = 1-based data row index). Multiple chunks from one cell are joined with a space.
 */
function passageTextFromCell(raw) {
  const parts = splitCellIntoParagraphs(String(raw || ''));
  const merged = parts
    .map((p) => normalizeLegacyEncoding(collapseInnerWhitespace(p)))
    .filter((p) => p.length > 0)
    .join(' ')
    .trim();
  return merged;
}

/**
 * Builds MoTR trial objects from comma-separated OneStop-style sheets in
 * run_motr_in_magpie/OneStop/Texts (*.csv). `onestop_paragraph_index` is the **CSV data
 * row number** (1-based), aligned with the workbook column **`paragraph #`** for the
 * same `.csv name`. One trial per (file, level, row) when that cell has enough text.
 *
 * @param {object} options
 * @param {string} [options.question] - Fallback post-passage question when Excel has no row.
 */
export function buildOneStopTrialLists(options = {}) {
  const question = options.question || DEFAULT_QUESTION;

  const req = require.context(
    '../../OneStop/Texts',
    false,
    /\.csv$/i
  );
  const filenames = req.keys().sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' })
  );

  const trials = [];
  for (const key of filenames) {
    const rows = rowsFromContextModule(req, key);
    if (!rows.length) continue;
    const levelKeys = resolveLevelKeys(rows[0]);
    const base = key.replace(/^\.\//, '').replace(/\.csv$/i, '');
    const paragraphCount = rows.length;

    for (let ri = 0; ri < rows.length; ri++) {
      const row = rows[ri];
      const paragraphIndex = ri + 1;
      let levelIndex = 0;
      for (const level of LEVEL_ORDER) {
        levelIndex += 1;
        const colKey = levelKeys[level];
        if (!colKey) continue;
        const text = passageTextFromCell(row[colKey]);
        if (!text || text.length < MIN_PARAGRAPH_CHARS) continue;

        trials.push({
          experiment: 'spotlight',
          experiment_id: 2,
          condition: level,
          condition_id: levelIndex,
          item_id: 0,
          text,
          question,
          response_true: RESPONSE_TRUE,
          response_distractors: RESPONSE_DISTRACTORS,
          onestop_file: base,
          onestop_level: level,
          onestop_column: colKey,
          onestop_paragraph_index: paragraphIndex,
          onestop_paragraph_count: paragraphCount,
        });
      }
    }
  }

  const numbered = trials.map((t, i) => ({ ...t, item_id: i + 1 }));

  const n = numbered.length;
  if (n === 0) {
    return { list1: [], list2: [], list3: [], all: [] };
  }
  const third = Math.ceil(n / 3);
  const list1 = numbered.slice(0, third);
  const list2 = numbered.slice(third, third * 2);
  const list3 = numbered.slice(third * 2);

  return { list1, list2, list3, all: numbered };
}

export function pickShuffledOneStopBlock(listsTuple) {
  const { list1, list2, list3 } = listsTuple;
  const lists = [list1, list2, list3].filter((l) => l.length > 0);
  if (!lists.length) return [];
  const chosen = lists[Math.floor(Math.random() * lists.length)];
  return _.shuffle(chosen);
}
