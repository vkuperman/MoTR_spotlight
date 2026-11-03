import _ from 'lodash';
import { pickArticleLevelOneStopTrials } from '@motr-shared/buildOneStopTrialLists';
import { mergeStimuliQuestionsIntoTrials } from '@motr-shared/parseOneStopStimuli';

const BLUR_INSTRUCTIONS =
  'In this study, you will read short texts and answer questions about them. However, unlike in normal reading, the texts will be blurred. Move your mouse over the text to reveal it with the spotlight; the revealed area follows your mouse. Take as much time to read the text as you need in order to understand it. When you are done reading, answer the question on the next page and click "next" to move on. Between each text, you will need to move your mouse back into the rectangle outline to start the next paragraph.';

const CLEAR_INSTRUCTIONS =
  'In this study, you will read short texts and answer questions about them. Take as much time to read the text as you need in order to understand it. When you are done reading, answer the question on the next page and click "next" to move on.';

function normalizeArticleId(value) {
  const n = parseInt(String(value == null ? '' : value).trim(), 10);
  return Number.isFinite(n) ? String(n) : '';
}

function articleParagraphs(listsTuple, articleId, level) {
  const id = normalizeArticleId(articleId);
  return (listsTuple.all || [])
    .filter(
      (trial) =>
        normalizeArticleId(trial.onestop_article_number) === id &&
        String(trial.onestop_level || '').toLowerCase() === level
    )
    .sort((a, b) => a.onestop_paragraph_index - b.onestop_paragraph_index);
}

/**
 * MoTR_Eye: two counterbalanced blocks (blur vs clear), each with 4 articles
 * (2 elementary + 2 advanced), no article reuse, no Cambridge assignment.
 */
export function prepareEyeReadingSession({
  oneStopLists,
  oneStopRowMap,
  practiceTrials,
  studyConfig,
}) {
  const articlesPerBlock = studyConfig.articlesPerBlock || 4;
  const elementaryPerBlock = studyConfig.elementaryPerBlock || 2;
  const advancedPerBlock = studyConfig.advancedPerBlock || 2;
  if (elementaryPerBlock + advancedPerBlock !== articlesPerBlock) {
    throw new Error('elementaryPerBlock + advancedPerBlock must equal articlesPerBlock');
  }

  const totalArticles = articlesPerBlock * 2;
  const allowed = Array.isArray(studyConfig.allowedArticleNumbers)
    ? studyConfig.allowedArticleNumbers.map(normalizeArticleId).filter(Boolean)
    : [];

  // Build unique article IDs available at both levels in the allow-list.
  const byArticle = new Map();
  for (const trial of oneStopLists.all || []) {
    const id = normalizeArticleId(trial.onestop_article_number);
    if (!id) continue;
    if (allowed.length && !allowed.includes(id)) continue;
    if (!byArticle.has(id)) byArticle.set(id, { id, levels: new Set() });
    byArticle.get(id).levels.add(String(trial.onestop_level || '').toLowerCase());
  }

  const eligible = Array.from(byArticle.values())
    .filter((a) => a.levels.has('elementary') && a.levels.has('advanced'))
    .map((a) => a.id);

  if (eligible.length < totalArticles) {
    // eslint-disable-next-line no-console
    console.warn(
      `MoTR_Eye: only ${eligible.length} eligible articles in pool; need ${totalArticles}.`
    );
  }

  const chosenIds = _.shuffle(eligible).slice(0, totalArticles);
  const eleIds = _.shuffle(chosenIds.slice(0, totalArticles / 2));
  const advIds = _.shuffle(chosenIds.slice(totalArticles / 2));

  // 2 ele + 2 adv per block; random article order within each block.
  const blockSpecs = [
    {
      articles: _.shuffle([
        ...eleIds.slice(0, elementaryPerBlock).map((id) => ({ id, level: 'elementary' })),
        ...advIds.slice(0, advancedPerBlock).map((id) => ({ id, level: 'advanced' })),
      ]),
    },
    {
      articles: _.shuffle([
        ...eleIds.slice(elementaryPerBlock).map((id) => ({ id, level: 'elementary' })),
        ...advIds.slice(advancedPerBlock).map((id) => ({ id, level: 'advanced' })),
      ]),
    },
  ];

  const modes = Math.random() < 0.5 ? ['blur', 'clear'] : ['clear', 'blur'];
  const blockOrder = modes.join('|');

  const blocks = blockSpecs.map((spec, bi) => {
    const mode = modes[bi];
    const readingItems = [];
    spec.articles.forEach((slot, articleOrderWithinBlock) => {
      const paras = articleParagraphs(oneStopLists, slot.id, slot.level);
      paras.forEach((trial) => {
        readingItems.push({
          ...trial,
          eye_block_mode: mode,
          eye_tracking_enabled: mode === 'blur',
          onestop_block_order: bi + 1,
          onestop_block_level: slot.level,
          onestop_block_mode: mode,
          onestop_article_order_within_block: articleOrderWithinBlock + 1,
          onestop_level_pair: 'elementary|advanced',
          onestop_level_block_order: blockOrder,
          onestop_level_assignment_rule: 'eye_fixed_elementary_advanced',
          onestop_article_selection_mode: 'eye_allow_list_random',
          onestop_study_key: studyConfig.studyKey,
          onestop_manual_article_numbers: allowed.join('|'),
        });
      });
    });

    const withQuestions = mergeStimuliQuestionsIntoTrials(readingItems, oneStopRowMap);
    const trials = withQuestions.map((trial, idx) => ({
      ...trial,
      item_id: idx + 1, // renumbered again after flatten
      response_options: _.shuffle(
        `${trial.response_true}|${trial.response_distractors}`.replace(/ ?["]+/g, '').split('|')
      ),
    }));

    return {
      mode,
      trackingEnabled: mode === 'blur',
      instructions: mode === 'blur' ? BLUR_INSTRUCTIONS : CLEAR_INSTRUCTIONS,
      instructionTitle: mode === 'blur' ? 'Instructions — spotlight reading' : 'Instructions — clear reading',
      trials,
      articleCount: spec.articles.length,
    };
  });

  // Global item_id across practice + both blocks for reporting consistency.
  let itemCounter = 0;
  const practiceSource = Array.isArray(practiceTrials) ? practiceTrials.slice(0, 1) : [];
  const practiceMerged = mergeStimuliQuestionsIntoTrials(practiceSource, oneStopRowMap).map((trial) => {
    itemCounter += 1;
    return {
      ...trial,
      item_id: itemCounter,
      eye_block_mode: 'practice',
      eye_tracking_enabled: false,
      eye_is_practice: true,
      onestop_block_mode: 'practice',
      onestop_study_key: studyConfig.studyKey,
      response_options: _.shuffle(
        `${trial.response_true}|${trial.response_distractors}`.replace(/ ?["]+/g, '').split('|')
      ),
    };
  });

  blocks.forEach((block) => {
    block.trials = block.trials.map((trial) => {
      itemCounter += 1;
      return { ...trial, item_id: itemCounter };
    });
  });

  // Fallback: if article expansion failed, reuse Prolific picker shape (should not happen).
  if (blocks.some((b) => !b.trials.length)) {
    const fallback = pickArticleLevelOneStopTrials(oneStopLists, {
      levelPair: ['elementary', 'advanced'],
      articlesPerLevel: elementaryPerBlock * 2,
      allowedArticleNumbers: allowed,
    });
    // eslint-disable-next-line no-console
    console.warn('MoTR_Eye article expansion empty; fallback path used.', fallback.length);
  }

  return {
    blockOrder,
    blocks,
    practiceTrials: practiceMerged,
    metadata: {
      studyKey: studyConfig.studyKey,
      blockOrder,
      assignmentRule: 'eye_fixed_elementary_advanced',
      readingArticleCount: chosenIds.length,
      allowedArticleNumbers: allowed.join('|'),
    },
    blurInstructions: BLUR_INSTRUCTIONS,
    clearInstructions: CLEAR_INSTRUCTIONS,
  };
}
