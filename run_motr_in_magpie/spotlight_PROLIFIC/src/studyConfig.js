/**
 * Upload destination comes from the Vercel project that builds this app.
 * Prolific: SPOTLIGHT_APP=PROLIFIC and GITHUB_RESULTS_PATH=.../spotlight_PROLIFIC
 * SONA:     SPOTLIGHT_APP=SONA and GITHUB_RESULTS_PATH=.../spotlight_SONA
 */
const RESULTS_PATH_BY_APP = {
  SONA: 'run_motr_in_magpie/Results/spotlight_SONA',
  PROLIFIC: 'run_motr_in_magpie/Results/spotlight_PROLIFIC',
};

const STUDY_KEY_BY_APP = {
  SONA: 'spotlight_SONA',
  PROLIFIC: 'spotlight_PROLIFIC',
};

function trimPath(value) {
  return String(value || '').replace(/\\/g, '/').replace(/\/+$/, '').trim();
}

function appFromResultsPath(path) {
  if (path.endsWith('spotlight_SONA')) return 'SONA';
  if (path.endsWith('spotlight_PROLIFIC')) return 'PROLIFIC';
  return '';
}

const envApp = String(process.env.SPOTLIGHT_APP || '').toUpperCase();
const envResultsPath = trimPath(process.env.GITHUB_RESULTS_PATH);
const spotlightApp = envApp === 'SONA' || envApp === 'PROLIFIC'
  ? envApp
  : (appFromResultsPath(envResultsPath) || 'PROLIFIC');

const githubResultsPath = envResultsPath || RESULTS_PATH_BY_APP[spotlightApp];
const studyApp = appFromResultsPath(githubResultsPath) || spotlightApp;
const isSona = studyApp === 'SONA';

function resultsUploadUrl() {
  const explicit = String(process.env.RESULTS_UPLOAD_URL || '').trim();
  if (explicit) return explicit.replace(/\/+$/, '');
  const host = String(
    process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || ''
  ).trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
  if (host) return `https://${host}/api/upload-results`;
  return 'https://mo-tr-spotlight-prolific.vercel.app/api/upload-results';
}

export default {
  studyKey: STUDY_KEY_BY_APP[studyApp],
  studyLabel: isSona ? 'Spotlight SONA' : 'Spotlight Prolific',
  experimentId: isSona ? 'spotlight-sona' : 'spotlight-prolific',
  githubResultsPath,
  resultsUploadUrl: resultsUploadUrl(),
  /** Random selection: 4 articles in each of 2 level blocks (8 texts from the 15-article allow-list). */
  articlesPerLevel: 4,
  manualArticleSelectionEnabled: false,
  allowedArticleNumbers: [6, 7, 8, 9, 10, 11, 12, 13, 16, 22, 23, 24, 26, 27, 29],
  manualArticleNumbers: [6, 7, 8, 9, 10, 11, 12, 13, 16, 22, 23, 24, 26, 27, 29],
  completionUrl: 'https://app.prolific.com/submissions/complete?cc=CYEW5RDZ',
  contactEmail: 'hendele@mcmaster.ca',
  mode: isSona ? 'sona' : 'prolific',
  language: 'en',
};
