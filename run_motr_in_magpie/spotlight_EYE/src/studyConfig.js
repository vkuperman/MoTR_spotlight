/**
 * spotlight_EYE — dual-block (blur vs clear) MoTR study.
 * No Cambridge; no demographics. Article pool matches Prolific allow-list.
 */
export default {
  studyKey: 'spotlight_EYE',
  studyLabel: 'Spotlight Eye',
  experimentId: 'spotlight-eye',
  githubResultsPath: 'run_motr_in_magpie/Results/spotlight_EYE',
  /** Local / lab Eye: ZIP download only (no Prolific upload API). */
  resultsUploadUrl: '',
  /** Per blur/clear block: 4 articles (2 elementary + 2 advanced). */
  articlesPerBlock: 4,
  elementaryPerBlock: 2,
  advancedPerBlock: 2,
  /**
   * Same 15-article pool as Prolific.
   */
  allowedArticleNumbers: [6, 7, 8, 9, 10, 11, 12, 13, 16, 22, 23, 24, 26, 27, 29],
  manualArticleSelectionEnabled: false,
  manualArticleNumbers: [],
  completionUrl: '',
  contactEmail: 'hendele@mcmaster.ca',
  mode: 'eye',
  language: 'en',
};
