/**
 * Cambridge General English Test (CSV) + CEFR scoring bands (CSV).
 */

function normalizeHeaderKey(k) {
  return String(k || '')
    .replace(/^\ufeff/, '')
    .trim()
    .toLowerCase();
}

/** Map a csv-loader row to { questions, correct, a, b, c, d, ... } keys (lowercase, no BOM). */
function normalizeRowKeys(r) {
  const out = {};
  for (const k of Object.keys(r)) {
    out[normalizeHeaderKey(k)] = r[k];
  }
  return out;
}

function normAnswer(s) {
  return String(s || '')
    .replace(/\u00a0/g, ' ')
    .replace(/['\u2018\u2019]/g, "'")
    .replace(/["\u201c\u201d]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function cleanQuestionText(s) {
  return String(s || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\u00c2/g, '')
    .replace(/[ \t*]+$/g, '')
    .trim();
}

/**
 * @param {Record<string, unknown>[]} rows - csv-loader rows (header row defines keys)
 */
export function prepareCambridgeQuestions(rows) {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((r) => {
      const n = normalizeRowKeys(r);
      const question = cleanQuestionText(n.questions != null ? n.questions : '');
      const correct = String(n.correct != null ? n.correct : '').trim();
      const opts = ['a', 'b', 'c', 'd']
        .map((k) => (n[k] != null ? String(n[k]).trim() : ''))
        .filter(Boolean);
      return { question, options: opts, correct };
    })
    .filter((x) => x.question && x.correct && x.options.length >= 2);
}

/**
 * @param {Record<string, unknown>[]} rows
 * @returns {{ min: number, max: number, level: string }[]}
 */
export function prepareCambridgeScoring(rows) {
  if (!Array.isArray(rows)) return [];
  const out = [];
  for (const r of rows) {
    const n = normalizeRowKeys(r);
    const intervalRaw =
      n['score interval'] != null
        ? n['score interval']
        : Object.keys(n).reduce((acc, k) => {
            if (acc != null) return acc;
            if (k.replace(/\s+/g, ' ').includes('score') && k.includes('interval')) return n[k];
            return acc;
          }, null);
    const levelRaw =
      n['cefr level'] != null
        ? n['cefr level']
        : Object.keys(n).reduce((acc, k) => {
            if (acc != null) return acc;
            if (k.includes('cefr')) return n[k];
            return acc;
          }, null);
    const raw = String(intervalRaw != null ? intervalRaw : '').trim();
    const m = raw.match(/^(\d+)\s*-\s*(\d+)$/);
    if (!m) continue;
    const level = String(levelRaw != null ? levelRaw : '').trim();
    out.push({ min: +m[1], max: +m[2], level });
  }
  return out;
}

export function cefrBandForScore(score, intervals) {
  const n = Number(score);
  if (!Number.isFinite(n) || !intervals.length) return '';
  for (const iv of intervals) {
    if (n >= iv.min && n <= iv.max) return iv.level;
  }
  return '';
}

export function isCambridgeAnswerCorrect(selected, correct) {
  return normAnswer(selected) === normAnswer(correct);
}
