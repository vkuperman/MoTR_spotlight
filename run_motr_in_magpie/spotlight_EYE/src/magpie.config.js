import studyConfig from './studyConfig';

export default {
  experimentId: studyConfig.experimentId,
  studyKey: studyConfig.studyKey,
  githubResultsPath: studyConfig.githubResultsPath,
  serverUrl: 'https://cui-motr-new.herokuapp.com/',
  socketUrl: 'wss://cui-motr-new.herokuapp.com/socket',
  completionUrl: studyConfig.completionUrl,
  contactEmail: studyConfig.contactEmail,
  mode: studyConfig.mode,
  language: studyConfig.language,
  resultsUploadUrl: studyConfig.resultsUploadUrl,
};
