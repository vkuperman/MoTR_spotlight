/**
 * spotlight_PROLIFIC — edit consent in components/ConsentPROLIFIC.vue;
 * edit article selection here.
 */
export default {
  studyKey: 'spotlight_PROLIFIC',
  studyLabel: 'Spotlight Prolific',
  experimentId: 'spotlight-prolific',
  githubResultsPath: 'run_motr_in_magpie/Results/spotlight_PROLIFIC',
  resultsUploadUrl: 'https://mo-tr-spotlight-prolific.vercel.app/api/upload-results',
  /** Random draw: 2 articles in each of 2 level blocks (4 texts). */
  articlesPerLevel: 2,
  /**
   * Pool for that random draw. Other OneStop texts stay in the repo.
   * Clear this list to draw from all 30 articles again.
   */
  allowedArticleNumbers: [6, 7, 8, 9, 10, 11, 12, 13, 16, 22, 23, 24, 26, 27, 29],
  manualArticleSelectionEnabled: false,
  manualArticleNumbers: [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
    16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
  ],
  /**
   * Cambridge score is still saved, but does not choose the pair.
   * Block order within the enabled pair is shuffled per participant.
   * Set another pair's `enabled` to true to include it in the random draw.
   */
  levelPairs: [
    { levels: ['elementary', 'intermediate'], enabled: false },
    { levels: ['intermediate', 'advanced'], enabled: false },
    { levels: ['elementary', 'advanced'], enabled: true },
  ],
  completionUrl: 'https://app.prolific.com/submissions/complete?cc=CYEW5RDZ',
  contactEmail: 'hendele@mcmaster.ca',
  mode: 'prolific',
  language: 'en',
};
