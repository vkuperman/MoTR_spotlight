import _ from 'lodash';

const DEFAULT_QUESTION =
  'Overall, how well could you follow the main ideas in this passage?';
const RESPONSE_TRUE = 'Fairly well or very well';
const RESPONSE_DISTRACTORS = 'Not at all|Only a little';
const ARTICLES_PER_LEVEL = 15;

const LEVEL_ORDER = ['elementary', 'intermediate', 'advanced'];
const MIN_PARAGRAPH_CHARS = 20;

function rowsFromContextModule(req, key) {
  const mod = req(key);
  const data = mod && mod.default !== undefined ? mod.default : mod;
  return Array.isArray(data) ? data : [];
}

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

function pickRandomQuestionFromRow(row) {
  const slots = [
    {
      n: 1,
      q: firstPresent(row, ['Q:', 'Q']),
      opts: [
        firstPresent(row, ['Qa:', 'Qa']),
        firstPresent(row, ['Qb:', 'Qb']),
        firstPresent(row, ['Qc:', 'Qc']),
        firstPresent(row, ['Qd:', 'Qd']),
      ],
      c: firstPresent(row, ['Qa:', 'Qa']),
    },
    {
      n: 2,
      q: firstPresent(row, ['Q1:']),
      opts: [
        firstPresent(row, ['Q1a:']),
        firstPresent(row, ['Q1b:']),
        firstPresent(row, ['Q1c:']),
        firstPresent(row, ['Q1d:']),
      ],
      c: firstPresent(row, ['Q1a:']),
    },
    {
      n: 3,
      q: firstPresent(row, ['Q2:']),
      opts: [
        firstPresent(row, ['Q2a:']),
        firstPresent(row, ['Q2b:']),
        firstPresent(row, ['Q2c:']),
        firstPresent(row, ['Q2d:']),
      ],
      c: firstPresent(row, ['Q2a:']),
    },
  ];

  const valid = slots.filter(
    (s) =>
      String(s.q || '').trim() &&
      String(s.c || '').trim() &&
      s.opts.some((x) => String(x || '').trim())
  );
  if (!valid.length) return null;

  const slot = valid[Math.floor(Math.random() * valid.length)];
  const correctRaw = String(slot.c).replace(/ ?["]+/g, '').trim();
  const opts = slot.opts
    .map((x) => String(x || '').replace(/ ?["]+/g, '').trim())
    .filter(Boolean);
  const correct = opts.find((o) => normAnswer(o) === normAnswer(correctRaw)) || correctRaw;
  const distractors = opts.filter((o) => normAnswer(o) !== normAnswer(correct));
  if (!distractors.length) return null;

  return {
    question: String(slot.q).trim(),
    response_true: correct,
    response_distractors: distractors.join('|'),
    onestop_question_slot: slot.n,
  };
}

function passageTextFromCell(raw) {
  const parts = splitCellIntoParagraphs(String(raw || ''));
  const merged = parts
    .map((p) => normalizeLegacyEncoding(collapseInnerWhitespace(p)))
    .filter((p) => p.length > 0)
    .join(' ')
    .trim();
  return merged;
}

export function buildOneStopTrialLists(options = {}) {
  const question = options.question || DEFAULT_QUESTION;

  const req = require.context('../OneStop/Texts', false, /\.csv$/i);
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
      const articleNumber = firstPresent(row, ['Article Number', 'article_number', 'articleNumber']);
      const articleTitle = firstPresent(row, ['Title', 'Article title', 'Article Title']);
      const sourceFile = firstPresent(row, ['Source File', 'FileName', 'Filename']);
      let levelIndex = 0;
      for (const level of LEVEL_ORDER) {
        levelIndex += 1;
        const colKey = levelKeys[level];
        if (!colKey) continue;
        const text = passageTextFromCell(row[colKey]);
        if (!text || text.length < MIN_PARAGRAPH_CHARS) continue;
        const pickedQuestion = pickRandomQuestionFromRow(row);

        trials.push({
          experiment: 'spotlight',
          experiment_id: 2,
          condition: level,
          condition_id: levelIndex,
          item_id: 0,
          text,
          question: pickedQuestion ? pickedQuestion.question : question,
          response_true: pickedQuestion ? pickedQuestion.response_true : RESPONSE_TRUE,
          response_distractors: pickedQuestion
            ? pickedQuestion.response_distractors
            : RESPONSE_DISTRACTORS,
          onestop_question_slot: pickedQuestion ? pickedQuestion.onestop_question_slot : null,
          onestop_file: base,
          onestop_level: level,
          onestop_column: colKey,
          onestop_paragraph_index: paragraphIndex,
          onestop_paragraph_count: paragraphCount,
          onestop_article_number: articleNumber,
          onestop_article_title: articleTitle || base,
          onestop_source_file: sourceFile,
        });
      }
    }
  }

  return { all: trials };
}

function articleKey(trial) {
  return String(trial.onestop_article_number || '').trim();
}

function articleSortValue(trial) {
  const n = parseInt(String(trial.onestop_article_number || '').trim(), 10);
  return Number.isFinite(n) ? n : trial.onestop_file;
}

function groupTrialsByArticle(trials) {
  const grouped = new Map();
  for (const trial of trials) {
    const key = articleKey(trial);
    if (!key) continue;
    if (!grouped.has(key)) {
      grouped.set(key, {
        key,
        sortValue: articleSortValue(trial),
        title: trial.onestop_article_title,
        trials: [],
      });
    }
    grouped.get(key).trials.push(trial);
  }
  return Array.from(grouped.values()).sort((a, b) => {
    if (typeof a.sortValue === 'number' && typeof b.sortValue === 'number') {
      return a.sortValue - b.sortValue;
    }
    return String(a.sortValue).localeCompare(String(b.sortValue), undefined, {
      sensitivity: 'base',
    });
  });
}

function trialsForArticleLevel(article, level) {
  return article.trials
    .filter((trial) => trial.onestop_level === level)
    .sort((a, b) => a.onestop_paragraph_index - b.onestop_paragraph_index);
}

function normalizeArticleNumberId(value) {
  const n = parseInt(String(value).trim(), 10);
  return Number.isFinite(n) ? String(n) : '';
}

function filterArticlesByManualNumbers(articles, manualNumbers) {
  const allowed = new Set();
  for (const entry of manualNumbers) {
    const id = normalizeArticleNumberId(entry);
    if (id) allowed.add(id);
  }
  return articles.filter((article) => {
    const id = normalizeArticleNumberId(article.sortValue);
    return allowed.has(id) || allowed.has(normalizeArticleNumberId(article.key));
  });
}

export function pickArticleLevelOneStopTrials(listsTuple, options = {}) {
  const articlesPerLevel = options.articlesPerLevel || ARTICLES_PER_LEVEL;
  const levelPair = options.levelPair || _.shuffle(options.levels || LEVEL_ORDER).slice(0, 2);
  const articlesNeeded = articlesPerLevel * levelPair.length;
  const manualEnabled = options.manualArticleSelection === true;
  const manualNumbers = options.manualArticleNumbers;

  let articles = groupTrialsByArticle(listsTuple.all || []);
  let selectionMode = 'random';
  let manualArticleList = '';

  if (manualEnabled && Array.isArray(manualNumbers) && manualNumbers.length) {
    selectionMode = 'manual';
    manualArticleList = manualNumbers.map((n) => normalizeArticleNumberId(n)).filter(Boolean).join('|');
    articles = filterArticlesByManualNumbers(articles, manualNumbers);
    if (articles.length < articlesNeeded) {
      // eslint-disable-next-line no-console
      console.warn(
        `Manual article selection: matched ${articles.length} article(s) but ${articlesNeeded} are required.`
      );
    }
  }

  articles = _.shuffle(articles).slice(0, articlesNeeded);
  const blocks = [];

  for (let levelIndex = 0; levelIndex < levelPair.length; levelIndex++) {
    const start = levelIndex * articlesPerLevel;
    const end = start + articlesPerLevel;
    blocks.push({
      articles: articles.slice(start, end),
      level: levelPair[levelIndex],
      levelAssignmentIndex: levelIndex + 1,
    });
  }

  const selected = [];
  const blockOrder = _.shuffle(blocks);
  blockOrder.forEach((block, blockOrderIndex) => {
    block.articles.forEach((article, articleOrderIndexWithinBlock) => {
      const articleTrials = trialsForArticleLevel(article, block.level);
      for (const trial of articleTrials) {
        selected.push({
          ...trial,
          item_id: selected.length + 1,
          onestop_article_order: blockOrderIndex * articlesPerLevel + articleOrderIndexWithinBlock + 1,
          onestop_article_order_within_block: articleOrderIndexWithinBlock + 1,
          onestop_block_order: blockOrderIndex + 1,
          onestop_block_level: block.level,
          onestop_level_pair: levelPair.join('|'),
          onestop_level_block_order: blockOrder.map((b) => b.level).join('|'),
          onestop_level_assignment_index: block.levelAssignmentIndex,
          onestop_article_selection_mode: selectionMode,
          onestop_manual_article_numbers: manualArticleList,
        });
      }
    });
  });

  return selected;
}
