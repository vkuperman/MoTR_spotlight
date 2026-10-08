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
  /** Random selection: 4 articles in each of 2 level blocks (8 texts from the 15-article allow-list). */
  articlesPerLevel: 4,
  manualArticleSelectionEnabled: false,
  allowedArticleNumbers: [6, 7, 8, 9, 10, 11, 12, 13, 16, 22, 23, 24, 26, 27, 29],
  manualArticleNumbers: [6, 7, 8, 9, 10, 11, 12, 13, 16, 22, 23, 24, 26, 27, 29],
  completionUrl: 'https://app.prolific.com/submissions/complete?cc=CYEW5RDZ',
  contactEmail: 'hendele@mcmaster.ca',
  mode: 'prolific',
  language: 'en',
};
