import magpieConfig from '@magpie-config';

/** Vercel serverless request body limit is 4.5 MB; stay safely below it. */
const MAX_REQUEST_BODY_CHARS = (
  typeof process !== 'undefined'
  && process.env
  && process.env.MOTR_MAX_UPLOAD_BODY_CHARS
)
  ? Number(process.env.MOTR_MAX_UPLOAD_BODY_CHARS)
  : 4 * 1024 * 1024;

const MIN_UPLOAD_INTERVAL_MS = 2500;
const MAX_UPLOAD_ATTEMPTS = 6;

let uploadChain = Promise.resolve();
let lastUploadFinishedAt = 0;

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isRetryableUploadError(err) {
  const message = String(err && err.message ? err.message : err).toLowerCase();
  return message.includes('rate limit')
    || message.includes('secondary rate')
    || message.includes('github upload failed')
    || message.startsWith('429 ')
    || message.startsWith('503 ')
    || message.startsWith('500 ');
}

function uploadRetryDelayMs(attempt) {
  return Math.min(60000, 2000 * (2 ** attempt)) + Math.floor(Math.random() * 1500);
}

function enqueueUpload(task) {
  const run = uploadChain.then(async () => {
    const waitMs = Math.max(0, MIN_UPLOAD_INTERVAL_MS - (Date.now() - lastUploadFinishedAt));
    if (waitMs > 0) {
      await sleep(waitMs);
    }
    try {
      return await task();
    } finally {
      lastUploadFinishedAt = Date.now();
    }
  });
  uploadChain = run.catch(() => {});
  return run;
}

async function compressCsvForUpload(csvContent) {
  if (typeof CompressionStream !== 'undefined') {
    const stream = new Blob([csvContent]).stream().pipeThrough(new CompressionStream('gzip'));
    const blob = await new Response(stream).blob();
    return { blob, contentEncoding: 'gzip' };
  }
  return { blob: new Blob([csvContent], { type: 'text/csv' }), contentEncoding: 'none' };
}

async function compressContentForUpload(content, fileName) {
  if (fileName.endsWith('.json')) {
    return { blob: new Blob([content], { type: 'application/json' }), contentEncoding: 'none' };
  }
  return compressCsvForUpload(content);
}

function buildUploadMeta({
  participantId,
  folderName,
  isTest,
  githubResultsPath,
  resultsScope,
  checkpointLabel,
}) {
  return {
    participantId,
    folderName,
    isTest,
    githubResultsPath,
    resultsScope,
    checkpointLabel,
  };
}

function buildSingleUploadPayload(uploadMeta, fileName, fileBase64, contentEncoding) {
  const payload = {
    participantId: uploadMeta.participantId,
    folderName: uploadMeta.folderName,
    fileName,
    fileBase64,
    contentEncoding,
    isTest: !!uploadMeta.isTest,
    resultsScope: uploadMeta.resultsScope === 'partial' ? 'partial' : 'complete',
  };
  if (magpieConfig.studyKey) {
    payload.studyKey = magpieConfig.studyKey;
  }
  if (
    uploadMeta.githubResultsPath
    && typeof uploadMeta.githubResultsPath === 'string'
    && uploadMeta.githubResultsPath.trim() !== ''
  ) {
    payload.githubResultsPath = uploadMeta.githubResultsPath.trim();
  }
  return payload;
}

function buildBatchUploadPayload(uploadMeta, encodedFiles, zipBase64 = '') {
  const payload = {
    participantId: uploadMeta.participantId,
    folderName: uploadMeta.folderName,
    files: encodedFiles.map((file) => ({
      fileName: file.fileName,
      fileBase64: file.fileBase64,
      contentEncoding: file.contentEncoding,
    })),
    isTest: !!uploadMeta.isTest,
    resultsScope: uploadMeta.resultsScope === 'partial' ? 'partial' : 'complete',
  };
  if (uploadMeta.checkpointLabel) {
    payload.checkpointLabel = uploadMeta.checkpointLabel;
  }
  if (zipBase64 && typeof zipBase64 === 'string' && zipBase64.length > 0) {
    payload.zipBase64 = zipBase64;
  }
  if (magpieConfig.studyKey) {
    payload.studyKey = magpieConfig.studyKey;
  }
  if (
    uploadMeta.githubResultsPath
    && typeof uploadMeta.githubResultsPath === 'string'
    && uploadMeta.githubResultsPath.trim() !== ''
  ) {
    payload.githubResultsPath = uploadMeta.githubResultsPath.trim();
  }
  return payload;
}

function requestBodyLength(payload) {
  return JSON.stringify(payload).length;
}

async function prepareEncodedPart(content, fileName) {
  const { blob, contentEncoding } = await compressContentForUpload(content, fileName);
  const fileBase64 = await blobToBase64(blob);
  return { fileName, fileBase64, contentEncoding };
}

async function csvFitsUploadRequest(csvContent, fileName, uploadMeta, maxRequestBodyChars) {
  const encoded = await prepareEncodedPart(csvContent, fileName);
  const payload = buildBatchUploadPayload(uploadMeta, [encoded]);
  return requestBodyLength(payload) <= maxRequestBodyChars;
}

function partFileName(baseFileName, partIndex, partCount) {
  if (partCount <= 1) return baseFileName;
  return baseFileName.replace(/\.csv$/i, `_part${String(partIndex + 1).padStart(2, '0')}.csv`);
}

async function splitCsvOnce(csvContent, baseFileName, uploadMeta, maxRequestBodyChars) {
  const lines = csvContent.split('\n');
  if (lines.length <= 1) {
    return [{ fileName: baseFileName, content: csvContent }];
  }

  const header = lines[0];
  const dataLines = lines.slice(1).filter((line) => line.length > 0);
  if (!dataLines.length) {
    return [{ fileName: baseFileName, content: csvContent }];
  }

  if (await csvFitsUploadRequest(csvContent, baseFileName, uploadMeta, maxRequestBodyChars)) {
    return [{ fileName: baseFileName, content: csvContent }];
  }

  const parts = [];
  let batch = [];
  for (const line of dataLines) {
    batch.push(line);
    const candidate = [header, ...batch].join('\n');
    if (
      !(await csvFitsUploadRequest(candidate, baseFileName, uploadMeta, maxRequestBodyChars))
      && batch.length > 1
    ) {
      batch.pop();
      parts.push([header, ...batch].join('\n'));
      batch = [line];
    }
  }
  if (batch.length) {
    parts.push([header, ...batch].join('\n'));
  }

  return parts.map((content, index) => ({
    fileName: partFileName(baseFileName, index, parts.length),
    content,
  }));
}

async function splitCsvUntilFits(csvContent, baseFileName, uploadMeta, maxRequestBodyChars) {
  if (await csvFitsUploadRequest(csvContent, baseFileName, uploadMeta, maxRequestBodyChars)) {
    return [{ fileName: baseFileName, content: csvContent }];
  }

  const batched = await splitCsvOnce(csvContent, baseFileName, uploadMeta, maxRequestBodyChars);
  const fitted = [];

  for (const part of batched) {
    if (await csvFitsUploadRequest(part.content, part.fileName, uploadMeta, maxRequestBodyChars)) {
      fitted.push(part);
      continue;
    }
    if (part.content.split('\n').length <= 2) {
      throw new Error(
        `Results file ${part.fileName} is too large to upload in one request after splitting.`
      );
    }
    fitted.push(
      ...(await splitCsvUntilFits(part.content, part.fileName, uploadMeta, maxRequestBodyChars))
    );
  }

  if (fitted.length <= 1) {
    return fitted;
  }

  const stem = baseFileName.replace(/(_part\d+)?\.csv$/i, '');
  return fitted.map((part, index) => ({
    fileName: `${stem}_part${String(index + 1).padStart(2, '0')}.csv`,
    content: part.content,
  }));
}

async function splitContentForUpload(content, baseFileName, uploadMeta, maxRequestBodyChars) {
  if (!baseFileName.endsWith('.csv') || !content) {
    return [{ fileName: baseFileName, content }];
  }
  return splitCsvUntilFits(content, baseFileName, uploadMeta, maxRequestBodyChars);
}

function packEncodedFilesIntoBatches(encodedFiles, uploadMeta, maxRequestBodyChars) {
  const batches = [];
  let current = [];

  const flush = () => {
    if (current.length) {
      batches.push(current);
      current = [];
    }
  };

  for (const file of encodedFiles) {
    const candidate = [...current, file];
    const payload = buildBatchUploadPayload(uploadMeta, candidate);
    if (requestBodyLength(payload) <= maxRequestBodyChars) {
      current = candidate;
      continue;
    }
    flush();
    const singlePayload = buildBatchUploadPayload(uploadMeta, [file]);
    if (requestBodyLength(singlePayload) > maxRequestBodyChars) {
      throw new Error(
        `Results file ${file.fileName} is too large to upload in one request (${requestBodyLength(singlePayload)} bytes).`
      );
    }
    current = [file];
  }
  flush();
  return batches;
}

async function postUploadPayload(uploadUrl, payload, maxRequestBodyChars) {
  if (requestBodyLength(payload) > maxRequestBodyChars) {
    throw new Error(`Upload payload exceeds request size limit (${requestBodyLength(payload)} bytes).`);
  }

  let lastErr = null;
  for (let attempt = 0; attempt < MAX_UPLOAD_ATTEMPTS; attempt += 1) {
    try {
      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errText = await res.text();
        const err = new Error(`${res.status} ${errText}`);
        if (!isRetryableUploadError(err) || attempt === MAX_UPLOAD_ATTEMPTS - 1) {
          throw err;
        }
        lastErr = err;
        await sleep(uploadRetryDelayMs(attempt));
        continue;
      }
      return res.json();
    } catch (err) {
      lastErr = err;
      if (!isRetryableUploadError(err) || attempt === MAX_UPLOAD_ATTEMPTS - 1) {
        throw err;
      }
      await sleep(uploadRetryDelayMs(attempt));
    }
  }
  throw lastErr || new Error('Upload failed after retries');
}

async function uploadEncodedBatches(uploadUrl, uploadMeta, encodedBatches, maxRequestBodyChars, options = {}) {
  const paths = [];
  const zipBase64 = options.zipBase64 || '';
  for (let batchIndex = 0; batchIndex < encodedBatches.length; batchIndex += 1) {
    const batch = encodedBatches[batchIndex];
    const includeZip = batchIndex === 0 && zipBase64;
    const payload = buildBatchUploadPayload(uploadMeta, batch, includeZip ? zipBase64 : '');
    const json = await enqueueUpload(() => postUploadPayload(uploadUrl, payload, maxRequestBodyChars));
    if (json && Array.isArray(json.paths)) {
      paths.push(...json.paths);
    } else if (json && json.path) {
      paths.push(json.path);
    }
  }
  return paths;
}

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
  const maxRequestBodyChars = options.maxRequestBodyChars || MAX_REQUEST_BODY_CHARS;
  const uploadMeta = buildUploadMeta({
    participantId,
    folderName,
    isTest,
    githubResultsPath,
    resultsScope,
    checkpointLabel: options.checkpointLabel,
  });

  const encodedFiles = [];
  for (const file of files || []) {
    if (!file || file.content == null || file.content === '') continue;
    const parts = await splitContentForUpload(
      file.content,
      file.name,
      uploadMeta,
      maxRequestBodyChars
    );
    for (const part of parts) {
      const encoded = await prepareEncodedPart(part.content, part.fileName);
      encodedFiles.push(encoded);
    }
  }

  if (!encodedFiles.length) return [];

  const encodedBatches = packEncodedFilesIntoBatches(
    encodedFiles,
    uploadMeta,
    maxRequestBodyChars
  );
  return uploadEncodedBatches(
    uploadUrl,
    uploadMeta,
    encodedBatches,
    maxRequestBodyChars,
    { zipBase64: options.zipBase64 || '' }
  );
}

/** @deprecated Use uploadResultsFiles; kept for compatibility. */
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
  return uploadResultsFiles(
    uploadUrl,
    participantId,
    folderName,
    [{ name: fileName, content: fileContent }],
    isTest,
    githubResultsPath,
    resultsScope,
    options
  );
}

function getResultsUploadUrl(vm) {
  const fromMagpie = vm.$magpie && vm.$magpie.resultsUploadUrl;
  if (fromMagpie && typeof fromMagpie === 'string' && fromMagpie.trim() !== '') {
    return fromMagpie.trim();
  }
  const fromConfig = magpieConfig.resultsUploadUrl;
  if (fromConfig && typeof fromConfig === 'string' && fromConfig.trim() !== '') {
    return fromConfig.trim();
  }
  return '';
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result;
      const base64 = dataUrl.indexOf(',') >= 0 ? dataUrl.split(',')[1] : dataUrl;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/** @deprecated use MAX_REQUEST_BODY_CHARS; kept for tests */
const MAX_UPLOAD_BASE64_CHARS = MAX_REQUEST_BODY_CHARS;

async function gzipBase64Length(csvContent) {
  const { blob } = await compressCsvForUpload(csvContent);
  const base64 = await blobToBase64(blob);
  return base64.length;
}

/** @deprecated use splitCsvUntilFits */
async function splitCsvForUpload(csvContent, baseFileName, uploadMeta = {}) {
  return splitCsvUntilFits(csvContent, baseFileName, uploadMeta, MAX_REQUEST_BODY_CHARS);
}

export {
  compressCsvForUpload,
  gzipBase64Length,
  splitCsvForUpload,
  splitCsvUntilFits,
  uploadResultsFile,
  uploadResultsFiles,
  getResultsUploadUrl,
  blobToBase64,
  MAX_REQUEST_BODY_CHARS,
  MAX_UPLOAD_BASE64_CHARS,
};
