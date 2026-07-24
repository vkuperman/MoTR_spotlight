/**
 * Cambridge General English Test (CSV) + CEFR scoring bands (CSV).
 */

function normalizeHeaderKey(k) {
  return String(k || '')
    .replace(/^\ufeff/, '')
    .trim()
    .toLowerCase();
}

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

/** Strip NBSP/mojibake and trailing junk copied from the source spreadsheet. */
function cleanQuestionText(s) {
  return String(s || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\u00c2/g, '')
    .replace(/[ \t*]+$/g, '')
    .trim();
}

export const CAMBRIDGE_QUESTIONS_PER_PAGE = 5;

/** Group Cambridge items into pages (default 5 questions per page → 5 pages for 25 items). */
export function chunkCambridgeQuestions(questions, perPage = CAMBRIDGE_QUESTIONS_PER_PAGE) {
  if (!Array.isArray(questions) || perPage < 1) return [];
  const pages = [];
  for (let i = 0; i < questions.length; i += perPage) {
    pages.push(
      questions.slice(i, i + perPage).map((question, j) => ({
        question,
        globalIndex: i + j,
      }))
    );
  }
  return pages;
}

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
