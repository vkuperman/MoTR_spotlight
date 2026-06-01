import _ from 'lodash';
import { pickArticleLevelOneStopTrials } from './buildOneStopTrialLists';
import { mergeStimuliQuestionsIntoTrials } from './parseOneStopStimuli';
import { levelPairForCambridgeScore } from './cambridgeAssignment';

/**
 * @param {object} params
 * @param {number} params.score - Cambridge raw score
 * @param {{ all: object[] }} params.oneStopLists
 * @param {Map} params.oneStopRowMap
 * @param {object[]} params.practiceTrials
 * @param {object} params.studyConfig - per-app studyConfig.js default export
 * @returns {{ trials: object[], metadata: object }}
 */
export function prepareParticipantReadingTrials({
  score,
  oneStopLists,
  oneStopRowMap,
  practiceTrials,
  studyConfig,
}) {
  const { levelPair, assignmentRule } = levelPairForCambridgeScore(score);
  const manualEnabled = studyConfig.manualArticleSelectionEnabled === true;
  const manualNumbers = studyConfig.manualArticleNumbers || [];

  const readingItems = pickArticleLevelOneStopTrials(oneStopLists, {
    levelPair,
    manualArticleSelection: manualEnabled,
    manualArticleNumbers: manualNumbers,
  }).map((trial) => ({
    ...trial,
    onestop_cambridge_score: score,
    onestop_level_assignment_rule: assignmentRule,
    onestop_study_key: studyConfig.studyKey,
  }));

  const merged = mergeStimuliQuestionsIntoTrials(
    _.concat(practiceTrials, readingItems),
    oneStopRowMap
  );

  const trials = merged.map((trial) => ({
    ...trial,
    response_options: _.shuffle(
      `${trial.response_true}|${trial.response_distractors}`.replace(/ ?["]+/g, '').split('|')
    ),
  }));

  return {
    trials,
    metadata: {
      studyKey: studyConfig.studyKey,
      levelPair,
      assignmentRule,
      readingArticleCount: new Set(readingItems.map((t) => t.onestop_article_number)).size,
      readingTrialCount: readingItems.length,
      levelBlockOrder: readingItems.length ? readingItems[0].onestop_level_block_order : '',
      articleSelectionMode: readingItems.length
        ? readingItems[0].onestop_article_selection_mode
        : manualEnabled
          ? 'manual'
          : 'random',
      manualArticleNumbers: readingItems.length
        ? readingItems[0].onestop_manual_article_numbers
        : manualEnabled
          ? manualNumbers.join('|')
          : '',
    },
  };
}
