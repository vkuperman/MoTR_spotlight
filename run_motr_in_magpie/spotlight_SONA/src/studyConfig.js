/**
 * spotlight_SONA — edit consent in components/ConsentSONA.vue;
 * edit article selection here.
 */
export default {
  studyKey: 'spotlight_SONA',
  studyLabel: 'Spotlight SONA',
  experimentId: 'spotlight-sona',
  githubResultsPath: 'run_motr_in_magpie/Results/spotlight_SONA',
  resultsUploadUrl: 'https://mo-tr-spotlight.vercel.app/api/upload-results',
  /** Random (or manual) selection: articles per level block (2 blocks → 12 texts total). Prolific uses 3 per block (6 total). */
  articlesPerLevel: 6,
  manualArticleSelectionEnabled: false,
  manualArticleNumbers: [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
    16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
  ],
  completionUrl: 'https://app.prolific.com/submissions/complete?cc=C1FQEQTP',
  contactEmail: 'hendele@mcmaster.ca',
  mode: 'debug',
  language: 'en',
};
