import {
  uploadResultsFile as sharedUploadResultsFile,
  uploadResultsFiles as sharedUploadResultsFiles,
  getResultsUploadUrl,
  blobToBase64,
  MAX_REQUEST_BODY_CHARS,
} from '../../../shared/resultsUpload.js';

/** Stay well under Vercel's ~4.5 MB request body limit (UTF-8 bytes). */
const MAX_REQUEST_BODY_BYTES = Math.floor(2.5 * 1024 * 1024);

const prolificUploadOptions = { maxRequestBodyChars: MAX_REQUEST_BODY_BYTES };

async function uploadResultsFiles(
  uploadUrl,
  participantId,
  folderName,
  files,
  isTest,
  githubResultsPath,
  resultsScope = 'complete',
  options = {}
) {
  return sharedUploadResultsFiles(
    uploadUrl,
    participantId,
    folderName,
    files,
    isTest,
    githubResultsPath,
    resultsScope,
    { ...prolificUploadOptions, ...options }
  );
}

async function uploadResultsFile(
  uploadUrl,
  participantId,
  folderName,
  fileName,
  fileContent,
  isTest,
  githubResultsPath,
  resultsScope = 'complete',
  options = {}
) {
  return sharedUploadResultsFile(
    uploadUrl,
    participantId,
    folderName,
    fileName,
    fileContent,
    isTest,
    githubResultsPath,
    resultsScope,
    { ...prolificUploadOptions, ...options }
  );
}

export {
  uploadResultsFile,
  uploadResultsFiles,
  getResultsUploadUrl,
  blobToBase64,
  MAX_REQUEST_BODY_BYTES,
  MAX_REQUEST_BODY_CHARS,
};
