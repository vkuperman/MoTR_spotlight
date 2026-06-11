import magpieConfig from '@magpie-config';

/** Stay under Vercel serverless body limit (~4.5 MB); JSON + base64 overhead included. */
const MAX_UPLOAD_BASE64_CHARS = 3 * 1024 * 1024;

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

async function gzipBase64Length(csvContent) {
  const { blob } = await compressCsvForUpload(csvContent);
  const base64 = await blobToBase64(blob);
  return base64.length;
}

async function splitCsvForUpload(csvContent, baseFileName) {
  const lines = csvContent.split('\n');
  if (lines.length <= 1) {
    return [{ fileName: baseFileName, content: csvContent }];
  }

  const header = lines[0];
  const dataLines = lines.slice(1).filter((line) => line.length > 0);
  if (!dataLines.length) {
    return [{ fileName: baseFileName, content: csvContent }];
  }

  if ((await gzipBase64Length(csvContent)) <= MAX_UPLOAD_BASE64_CHARS) {
    return [{ fileName: baseFileName, content: csvContent }];
  }

  const parts = [];
  let batch = [];
  for (const line of dataLines) {
    batch.push(line);
    const candidate = [header, ...batch].join('\n');
    if ((await gzipBase64Length(candidate)) > MAX_UPLOAD_BASE64_CHARS && batch.length > 1) {
      batch.pop();
      parts.push([header, ...batch].join('\n'));
      batch = [line];
    }
  }
  if (batch.length) {
    parts.push([header, ...batch].join('\n'));
  }

  return parts.map((content, index) => ({
    fileName:
      parts.length === 1
        ? baseFileName
        : baseFileName.replace(/\.csv$/i, `_part${String(index + 1).padStart(2, '0')}.csv`),
    content,
  }));
}

async function splitContentForUpload(content, baseFileName) {
  if (!baseFileName.endsWith('.csv') || !content) {
    return [{ fileName: baseFileName, content }];
  }
  return splitCsvForUpload(content, baseFileName);
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
  const parts = await splitContentForUpload(fileContent || '', fileName);
  const paths = [];
  for (const part of parts) {
    const { blob, contentEncoding } = await compressContentForUpload(part.content, part.fileName);
    const fileBase64 = await blobToBase64(blob);
    if (fileBase64.length > MAX_UPLOAD_BASE64_CHARS) {
      throw new Error(
        `Results file ${part.fileName} is still too large after splitting (${fileBase64.length} chars).`
      );
    }
    const payload = {
      participantId,
      folderName,
      fileName: part.fileName,
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

export {
  compressCsvForUpload,
  gzipBase64Length,
  splitCsvForUpload,
  uploadResultsFile,
  uploadResultsFiles,
  getResultsUploadUrl,
  blobToBase64,
  MAX_UPLOAD_BASE64_CHARS,
};
