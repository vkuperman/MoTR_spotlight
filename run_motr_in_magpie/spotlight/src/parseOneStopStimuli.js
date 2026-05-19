import * as XLSX from 'xlsx';

/** Match Excel `.csv name` to Text folder filename (no extension). */
export function normalizeCsvStem(name) {
  return String(name || '')
    .replace(/\.csv$/i, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
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
    { n: 1, q: row.Q1, opts: [row['1A'], row['1B'], row['1C'], row['1D']], c: row.CorrectAns1 },
    { n: 2, q: row.Q2, opts: [row['2A'], row['2B'], row['2C'], row['2D']], c: row.CorrectAns2 },
    { n: 3, q: row.Q3, opts: [row['3A'], row['3B'], row['3C'], row['3D']], c: row.CorrectAns3 },
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
    const rawCsv = row['.csv name'] != null ? row['.csv name'] : row['csv name'];
    const stem = normalizeCsvStem(rawCsv);
    if (!stem) continue;
    const p = parseInt(String(row['paragraph #'] != null ? row['paragraph #'] : row.paragraph || '').trim(), 10);
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
