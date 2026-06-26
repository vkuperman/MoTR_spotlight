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
  /** Random (or manual) selection: articles per level block (2 blocks → 4 texts total from pool of 30). */
  articlesPerLevel: 2,
  manualArticleSelectionEnabled: false,
  manualArticleNumbers: [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
    16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
  ],
  completionUrl: 'https://app.prolific.com/submissions/complete?cc=CYEW5RDZ',
  contactEmail: 'hendele@mcmaster.ca',
  mode: 'prolific',
  language: 'en',
};
