import * as XLSX from 'xlsx';

/** Match Excel `.csv name` to Text folder filename (no extension). */
export function normalizeCsvStem(name) {
  return String(name || '')
    .replace(/\\/g, '/')
    .split('/')
    .pop()
    .replace(/\.(csv|txt)$/i, '')
    .replace(/\.csv$/i, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

function firstPresent(row, keys) {
  for (const key of keys) {
    if (row[key] != null && String(row[key]).trim()) return row[key];
  }
  return '';
}

function normAnswer(s) {
  return String(s || '')
    .replace(/ ?["]+/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

/**
 * @param {Record<string, unknown>} row - one sheet row from sheet_to_json
 * @returns {{ question: string, response_true: string, response_distractors: string, onestop_question_slot: number } | null}
 */
export function pickRandomQuestionFromStimuliRow(row) {
  const slots = [
    {
      n: 1,
      q: firstPresent(row, ['Q:', 'Q1', 'Q']),
      opts: [
        firstPresent(row, ['Qa:', 'Qa', '1A']),
        firstPresent(row, ['Qb:', 'Qb', '1B']),
        firstPresent(row, ['Qc:', 'Qc', '1C']),
        firstPresent(row, ['Qd:', 'Qd', '1D']),
      ],
      c: firstPresent(row, ['CorrectAns1', 'Qa:', 'Qa', '1A']),
    },
    {
      n: 2,
      q: firstPresent(row, ['Q1:', 'Q2']),
      opts: [
        firstPresent(row, ['Q1a:', 'Q1a', '2A']),
        firstPresent(row, ['Q1b:', 'Q1b', '2B']),
        firstPresent(row, ['Q1c:', 'Q1c', '2C']),
        firstPresent(row, ['Q1d:', 'Q1d', '2D']),
      ],
      c: firstPresent(row, ['CorrectAns2', 'Q1a:', 'Q1a', '2A']),
    },
    {
      n: 3,
      q: firstPresent(row, ['Q2:', 'Q3']),
      opts: [
        firstPresent(row, ['Q2a:', 'Q2a', '3A']),
        firstPresent(row, ['Q2b:', 'Q2b', '3B']),
        firstPresent(row, ['Q2c:', 'Q2c', '3C']),
        firstPresent(row, ['Q2d:', 'Q2d', '3D']),
      ],
      c: firstPresent(row, ['CorrectAns3', 'Q2a:', 'Q2a', '3A']),
    },
  ];

  const valid = slots.filter(
    (s) =>
      String(s.q || '').trim() &&
      String(s.c || '').trim() &&
      s.opts.some((x) => String(x || '').trim())
  );
  if (!valid.length) return null;

  const s = valid[Math.floor(Math.random() * valid.length)];
  const question = String(s.q).trim();
  const correctRaw = String(s.c).replace(/ ?["]+/g, '').trim();
  const opts = s.opts
    .map((x) => String(x || '').replace(/ ?["]+/g, '').trim())
    .filter(Boolean);

  const correctNorm = normAnswer(correctRaw);
  let correct = correctRaw;
  const matchOpt = opts.find((o) => normAnswer(o) === correctNorm);
  if (matchOpt) correct = matchOpt;

  const distractors = opts.filter((o) => normAnswer(o) !== normAnswer(correct));
  if (!distractors.length) return null;

  return {
    question,
    response_true: correct,
    response_distractors: distractors.join('|'),
    onestop_question_slot: s.n,
  };
}

function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = new Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + cost);
      prev = tmp;
    }
  }
  return dp[n];
}

function excelStemsFromRowMap(rowMap) {
  const stems = new Set();
  for (const k of rowMap.keys()) {
    const i = k.lastIndexOf('|');
    if (i > 0) stems.add(k.slice(0, i));
  }
  return stems;
}

/**
 * Map a text-file stem to the closest workbook `.csv name` stem (handles small typos,
 * e.g. `lie detector` vs `lie dectector`).
 */
export function resolveStemForExcel(stem, excelStems) {
  if (excelStems.has(stem)) return stem;
  let best = null;
  let bestD = Infinity;
  for (const e of excelStems) {
    const d = levenshtein(stem, e);
    if (d < bestD) {
      bestD = d;
      best = e;
    }
  }
  if (best != null && bestD <= 3) return best;
  return stem;
}

/**
 * @param {string} xlsxUrl - URL from file-loader require()
 * @returns {Promise<Map<string, Record<string, unknown>>>} key = `${normalizeCsvStem}|${paragraphNum}`
 */
export async function loadStimuliRowMap(xlsxUrl) {
  const res = await fetch(xlsxUrl);
  if (!res.ok) throw new Error(`Failed to fetch stimuli workbook (${res.status})`);
  const buf = await res.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const name = wb.SheetNames[0];
  const sheet = wb.Sheets[name];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  const map = new Map();
  for (const row of rows) {
    const rawCsv = firstPresent(row, ['.csv name', 'csv name', 'FileName', 'Filename', 'Source File']);
    const stem = normalizeCsvStem(rawCsv);
    if (!stem) continue;
    const p = parseInt(String(firstPresent(row, ['paragraph #', 'paragraph', 'Paragraph'])).trim(), 10);
    if (!Number.isFinite(p) || p < 1) continue;
    const key = `${stem}|${p}`;
    map.set(key, row);
  }
  return map;
}

/**
 * @param {unknown[]} trials
 * @param {Map<string, Record<string, unknown>>} rowMap
 */
export function mergeStimuliQuestionsIntoTrials(trials, rowMap) {
  const excelStems = excelStemsFromRowMap(rowMap);
  return trials.map((trial) => {
    if (!trial.onestop_file || trial.onestop_paragraph_index == null) return trial;
    const stem = resolveStemForExcel(normalizeCsvStem(trial.onestop_file), excelStems);
    const key = `${stem}|${trial.onestop_paragraph_index}`;
    const row = rowMap.get(key);
    if (!row) return trial;
    const picked = pickRandomQuestionFromStimuliRow(row);
    if (!picked) return trial;
    return {
      ...trial,
      ...picked,
    };
  });
}
