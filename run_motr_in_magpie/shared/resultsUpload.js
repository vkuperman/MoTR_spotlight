import magpieConfig from '@magpie-config';

/** Vercel serverless request body limit is 4.5 MB; stay safely below it. */
const MAX_REQUEST_BODY_CHARS = 4 * 1024 * 1024;

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

function buildUploadPayload({
  participantId,
  folderName,
  fileName,
  fileBase64,
  contentEncoding,
  isTest,
  githubResultsPath,
  resultsScope,
}) {
  const payload = {
    participantId,
    folderName,
    fileName,
    fileBase64,
    contentEncoding,
    isTest: !!isTest,
    resultsScope: resultsScope === 'partial' ? 'partial' : 'complete',
  };
  if (magpieConfig.studyKey) {
    payload.studyKey = magpieConfig.studyKey;
  }
  if (githubResultsPath && typeof githubResultsPath === 'string' && githubResultsPath.trim() !== '') {
    payload.githubResultsPath = githubResultsPath.trim();
  }
  return payload;
}

function requestBodyLength(payload) {
  return JSON.stringify(payload).length;
}

async function prepareEncodedPart(content, fileName) {
  const { blob, contentEncoding } = await compressContentForUpload(content, fileName);
  const fileBase64 = await blobToBase64(blob);
  return { fileBase64, contentEncoding };
}

async function csvFitsUploadRequest(csvContent, fileName, uploadMeta) {
  const { fileBase64, contentEncoding } = await prepareEncodedPart(csvContent, fileName);
  const payload = buildUploadPayload({
    ...uploadMeta,
    fileName,
    fileBase64,
    contentEncoding,
  });
  return requestBodyLength(payload) <= MAX_REQUEST_BODY_CHARS;
}

function partFileName(baseFileName, partIndex, partCount) {
  if (partCount <= 1) return baseFileName;
  return baseFileName.replace(/\.csv$/i, `_part${String(partIndex + 1).padStart(2, '0')}.csv`);
}

async function splitCsvOnce(csvContent, baseFileName, uploadMeta) {
  const lines = csvContent.split('\n');
  if (lines.length <= 1) {
    return [{ fileName: baseFileName, content: csvContent }];
  }

  const header = lines[0];
  const dataLines = lines.slice(1).filter((line) => line.length > 0);
  if (!dataLines.length) {
    return [{ fileName: baseFileName, content: csvContent }];
  }

  if (await csvFitsUploadRequest(csvContent, baseFileName, uploadMeta)) {
    return [{ fileName: baseFileName, content: csvContent }];
  }

  const parts = [];
  let batch = [];
  for (const line of dataLines) {
    batch.push(line);
    const candidate = [header, ...batch].join('\n');
    if (!(await csvFitsUploadRequest(candidate, baseFileName, uploadMeta)) && batch.length > 1) {
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

async function splitCsvUntilFits(csvContent, baseFileName, uploadMeta) {
  if (await csvFitsUploadRequest(csvContent, baseFileName, uploadMeta)) {
    return [{ fileName: baseFileName, content: csvContent }];
  }

  const batched = await splitCsvOnce(csvContent, baseFileName, uploadMeta);
  const fitted = [];

  for (const part of batched) {
    if (await csvFitsUploadRequest(part.content, part.fileName, uploadMeta)) {
      fitted.push(part);
      continue;
    }
    if (part.content.split('\n').length <= 2) {
      throw new Error(
        `Results file ${part.fileName} is too large to upload in one request after splitting.`
      );
    }
    fitted.push(...(await splitCsvUntilFits(part.content, part.fileName, uploadMeta)));
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

async function splitContentForUpload(content, baseFileName, uploadMeta) {
  if (!baseFileName.endsWith('.csv') || !content) {
    return [{ fileName: baseFileName, content }];
  }
  return splitCsvUntilFits(content, baseFileName, uploadMeta);
}

async function uploadResultsFile(
  uploadUrl,
  participantId,
  folderName,
  fileName,
  fileContent,
  isTest,
  githubResultsPath,
  resultsScope = 'complete'
) {
  const uploadMeta = {
    participantId,
    folderName,
    isTest,
    githubResultsPath,
    resultsScope,
  };
  const parts = await splitContentForUpload(fileContent || '', fileName, uploadMeta);
  const paths = [];
  for (const part of parts) {
    const { fileBase64, contentEncoding } = await prepareEncodedPart(part.content, part.fileName);
    const payload = buildUploadPayload({
      ...uploadMeta,
      fileName: part.fileName,
      fileBase64,
      contentEncoding,
    });
    if (requestBodyLength(payload) > MAX_REQUEST_BODY_CHARS) {
      throw new Error(
        `Results file ${part.fileName} is still too large after splitting (${requestBodyLength(payload)} bytes).`
      );
    }
    const res = await fetch(uploadUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`${res.status} ${errText}`);
    }
    const json = await res.json();
    if (json && json.path) paths.push(json.path);
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
  resultsScope = 'complete'
) {
  const paths = [];
  for (const file of files) {
    if (!file || file.content == null || file.content === '') continue;
    const uploaded = await uploadResultsFile(
      uploadUrl,
      participantId,
      folderName,
      file.name,
      file.content,
      isTest,
      githubResultsPath,
      resultsScope
    );
    paths.push(...uploaded);
  }
  return paths;
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
  return splitCsvUntilFits(csvContent, baseFileName, uploadMeta);
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
