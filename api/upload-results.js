/**
 * Serverless function: POST /api/upload-results
 *
 * Multi-file batch (preferred; one Git commit per request):
 *   { participantId, folderName, files: [{ fileName, fileBase64, contentEncoding?: 'gzip'|'none' }],
 *     isTest?, githubResultsPath?, resultsScope?: 'partial'|'complete', checkpointLabel? }
 *
 * Single file (legacy fallback):
 *   { participantId, folderName, fileName, fileBase64, contentEncoding?: 'gzip'|'none',
 *     isTest?, githubResultsPath? }
 *
 * Legacy zip:
 *   { participantId, zipBase64, isTest?, githubResultsPath? }
 *
 * Optional env:
 * - GITHUB_TOKEN + GITHUB_REPO: push to GitHub (default run_motr_in_magpie/Results/)
 * - GITHUB_RESULTS_PATH: folder path in repo (default run_motr_in_magpie/Results)
 * - GITHUB_BRANCH: branch to commit to (default main)
 * - RESEND_API_KEY + EMAIL_TO: email session ZIP to EMAIL_TO on complete uploads (GitHub still required)
 * At least one of (GitHub) or (Resend + EMAIL_TO) must be set.
 */

import { gunzipSync } from 'zlib';

const STUDY_KEY_BY_APP = {
  SONA: 'spotlight_SONA',
  PROLIFIC: 'spotlight_PROLIFIC',
};

const RESULTS_PATH_BY_APP = {
  SONA: 'run_motr_in_magpie/Results/spotlight_SONA',
  PROLIFIC: 'run_motr_in_magpie/Results/spotlight_PROLIFIC',
};

const RESULTS_BASE_PATH = 'run_motr_in_magpie/Results';

function normalizeResultsPath(pathValue) {
  return String(pathValue || '')
    .replace(/\\/g, '/')
    .replace(/\/+$/, '');
}

function expectedStudyKeyForDeployment() {
  const app = String(process.env.SPOTLIGHT_APP || '').toUpperCase();
  return STUDY_KEY_BY_APP[app] || '';
}

function canonicalResultsPathForDeployment() {
  const app = String(process.env.SPOTLIGHT_APP || '').toUpperCase();
  return RESULTS_PATH_BY_APP[app] || '';
}

/** Accept exact server path or study subfolder when Vercel still uses base Results path. */
function resolveResultsPath(serverPath, requestedPath) {
  const server = normalizeResultsPath(serverPath);
  const requested = normalizeResultsPath(requestedPath || server);
  const canonical = canonicalResultsPathForDeployment();

  if (server === requested) return server;
  if (canonical && requested === canonical) return canonical;
  if (canonical && server === RESULTS_BASE_PATH && requested === canonical) return canonical;
  return null;
}

function safeParticipantId(id) {
  if (id == null || typeof id !== 'string') return 'unknown';
  return id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64) || 'unknown';
}

function safeFolderName(name) {
  if (name == null || typeof name !== 'string') return 'motr_results_unknown';
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'motr_results_unknown';
}

function safeFileName(name) {
  if (name == null || typeof name !== 'string') return 'results.csv';
  const segments = name.split('/').map((segment) => {
    const cleaned = segment.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
    return cleaned || 'file';
  });
  const base = segments.join('/');
  if (base.endsWith('.csv') || base.endsWith('.json')) return base;
  return `${base}.csv`;
}

function decodeUploadedFile(fileBase64, contentEncoding) {
  const raw = Buffer.from(fileBase64, 'base64');
  if (contentEncoding === 'gzip') {
    return gunzipSync(raw);
  }
  return raw;
}

function encodeRepoPath(repoPath) {
  return String(repoPath || '')
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

async function getGitHubFileSha({
  githubToken,
  owner,
  repoName,
  githubBranch,
  repoPath,
}) {
  const url = `https://api.github.com/repos/${owner}/${repoName}/contents/${encodeRepoPath(repoPath)}?ref=${encodeURIComponent(githubBranch)}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${githubToken}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  if (response.status === 404) return null;
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`GitHub file lookup failed (${response.status}): ${errText}`);
  }
  const data = await response.json();
  return data && data.sha ? data.sha : null;
}

function githubHeaders(githubToken, extra = {}) {
  return {
    Authorization: `Bearer ${githubToken}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...extra,
  };
}

async function githubJson(githubToken, url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: githubHeaders(githubToken, options.headers || {}),
  });
  if (!response.ok) {
    const errText = await response.text();
    const err = new Error(`GitHub API failed (${response.status}): ${errText}`);
    err.status = response.status;
    err.retryAfterSeconds = parseRetryAfterSeconds(response.headers.get('retry-after'));
    throw err;
  }
  if (response.status === 204) return null;
  return response.json();
}

function parseRetryAfterSeconds(retryAfterHeader) {
  if (!retryAfterHeader) return null;
  const asNumber = Number(retryAfterHeader);
  if (Number.isFinite(asNumber) && asNumber >= 0) return asNumber;
  const asDate = Date.parse(retryAfterHeader);
  if (!Number.isFinite(asDate)) return null;
  return Math.max(0, Math.ceil((asDate - Date.now()) / 1000));
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isGitRefConflict(err) {
  return err && (err.status === 409 || err.status === 422);
}

function isGitRateLimit(err) {
  if (!err || (err.status !== 403 && err.status !== 429)) return false;
  const message = String(err.message || '').toLowerCase();
  return message.includes('rate limit') || message.includes('secondary rate');
}

/** Git Trees API inline content is limited to 1 MB per file; larger files need a blob. */
const INLINE_TREE_MAX_BYTES = 900 * 1024;

async function pushFileToGitHub({
  githubToken,
  owner,
  repoName,
  githubBranch,
  repoPath,
  fileBuffer,
  commitMessage,
}) {
  const sha = await getGitHubFileSha({
    githubToken,
    owner,
    repoName,
    githubBranch,
    repoPath,
  });
  const url = `https://api.github.com/repos/${owner}/${repoName}/contents/${encodeRepoPath(repoPath)}`;
  const body = {
    message: commitMessage,
    content: fileBuffer.toString('base64'),
    branch: githubBranch,
  };
  if (sha) body.sha = sha;
  return githubJson(githubToken, url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function createGitBlob({ githubToken, owner, repoName, fileBuffer }) {
  const data = await githubJson(
    githubToken,
    `https://api.github.com/repos/${owner}/${repoName}/git/blobs`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: fileBuffer.toString('base64'),
        encoding: 'base64',
      }),
    }
  );
  return data.sha;
}

async function pushFilesBatchToGitHubOnce({
  githubToken,
  owner,
  repoName,
  githubBranch,
  files,
  commitMessage,
}) {
  const refData = await githubJson(
    githubToken,
    `https://api.github.com/repos/${owner}/${repoName}/git/refs/heads/${encodeURIComponent(githubBranch)}`
  );
  const parentSha = refData.object.sha;
  const parentCommit = await githubJson(
    githubToken,
    `https://api.github.com/repos/${owner}/${repoName}/git/commits/${parentSha}`
  );
  const baseTreeSha = parentCommit.tree.sha;

  const treeEntries = [];
  for (const file of files) {
    if (file.fileBuffer.length <= INLINE_TREE_MAX_BYTES) {
      treeEntries.push({
        path: file.repoPath,
        mode: '100644',
        type: 'blob',
        content: file.fileBuffer.toString('base64'),
        encoding: 'base64',
      });
      continue;
    }
    const blobSha = await createGitBlob({
      githubToken,
      owner,
      repoName,
      fileBuffer: file.fileBuffer,
    });
    treeEntries.push({
      path: file.repoPath,
      mode: '100644',
      type: 'blob',
      sha: blobSha,
    });
  }

  const treeData = await githubJson(
    githubToken,
    `https://api.github.com/repos/${owner}/${repoName}/git/trees`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree: treeEntries,
      }),
    }
  );

  const commitData = await githubJson(
    githubToken,
    `https://api.github.com/repos/${owner}/${repoName}/git/commits`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: commitMessage,
        tree: treeData.sha,
        parents: [parentSha],
      }),
    }
  );

  await githubJson(
    githubToken,
    `https://api.github.com/repos/${owner}/${repoName}/git/refs/heads/${encodeURIComponent(githubBranch)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sha: commitData.sha,
        force: false,
      }),
    }
  );

  return {
    commitSha: commitData.sha,
    paths: files.map((file) => file.repoPath),
  };
}

function retryDelayMs(err, attempt) {
  if (isGitRateLimit(err)) {
    const retryAfterMs = err.retryAfterSeconds != null
      ? err.retryAfterSeconds * 1000
      : Math.min(60000, 5000 * (2 ** attempt));
    return retryAfterMs + Math.floor(Math.random() * 1000);
  }
  return Math.min(8000, 500 * (2 ** attempt)) + Math.floor(Math.random() * 250);
}

function shouldRetryGitPush(err, attempt, maxAttempts) {
  if (attempt >= maxAttempts - 1) return false;
  return isGitRefConflict(err) || isGitRateLimit(err);
}

async function pushFilesBatchToGitHub(args) {
  const maxAttempts = 6;
  let lastErr = null;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      return await pushFilesBatchToGitHubOnce(args);
    } catch (err) {
      lastErr = err;
      if (!shouldRetryGitPush(err, attempt, maxAttempts)) {
        throw err;
      }
      await sleep(retryDelayMs(err, attempt));
    }
  }
  throw lastErr;
}

function buildRepoPath(resultsSubdir, resultsScope, folderName, fileName) {
  return resultsScope === 'partial'
    ? `${resultsSubdir}/partial/${folderName}/${fileName}`
    : `${resultsSubdir}/${folderName}/${fileName}`;
}

function buildBatchCommitMessage({
  resultsScope,
  folderName,
  checkpointLabel,
  fileNames,
}) {
  const names = (fileNames || []).join(', ');
  if (resultsScope === 'partial') {
    const label = checkpointLabel ? ` ${checkpointLabel}` : '';
    return `[skip ci] Add results checkpoint${label}: ${folderName} (${names})`;
  }
  return `[skip ci] Add results: ${folderName} (${names})`;
}

async function sendEmailWithZip(resendKey, emailTo, participantId, timestamp, zipBase64, folderName) {
  const zipFilename = `${safeFolderName(folderName) || participantId}_motr_results_${timestamp}.zip`;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'MoTR Results <onboarding@resend.dev>',
      to: [emailTo],
      subject: `MoTR results: ${participantId}`,
      text: `Results for participant ${participantId} (${timestamp}). A ZIP copy is attached; files were also saved to GitHub.`,
      attachments: [{ filename: zipFilename, content: zipBase64 }],
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend: ${res.status} ${err}`);
  }
}

async function buildZipBase64FromDecodedFiles(folderName, decodedFiles) {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  const folder = safeFolderName(folderName);
  for (const file of decodedFiles) {
    const entryName = file.fileName || 'results.csv';
    zip.file(`${folder}/${entryName}`, file.fileBuffer);
  }
  const buf = await zip.generateAsync({ type: 'nodebuffer' });
  return buf.toString('base64');
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const githubToken = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO || 'vkuperman/MoTR_spotlight';
  const defaultResultsPath = (process.env.GITHUB_RESULTS_PATH || 'run_motr_in_magpie/Results').replace(
    /\/+$/,
    ''
  );
  const githubBranch = process.env.GITHUB_BRANCH || 'main';
  const resendKey = process.env.RESEND_API_KEY;
  const emailTo = process.env.EMAIL_TO || 'readinglabmotr@gmail.com';

  const useGitHub = !!githubToken;
  const useEmail = !!(resendKey && emailTo);
  if (!useGitHub && !useEmail) {
    return res.status(500).json({
      error: 'Server not configured: set GITHUB_TOKEN or RESEND_API_KEY and EMAIL_TO',
    });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (_) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const participantId = safeParticipantId(body.participantId);
  const serverResultsPath = normalizeResultsPath(defaultResultsPath);
  const requestedResultsPath = normalizeResultsPath(body.githubResultsPath || serverResultsPath);
  const expectedStudyKey = expectedStudyKeyForDeployment();

  if (body.studyKey && expectedStudyKey && body.studyKey !== expectedStudyKey) {
    return res.status(403).json({
      error: 'studyKey does not match this API deployment',
      expectedStudyKey,
      receivedStudyKey: body.studyKey,
      spotlightApp: process.env.SPOTLIGHT_APP || '',
    });
  }

  const resultsPath = resolveResultsPath(serverResultsPath, requestedResultsPath);
  if (!resultsPath) {
    return res.status(403).json({
      error: 'githubResultsPath does not match this API deployment',
      expectedGithubResultsPath: canonicalResultsPathForDeployment() || serverResultsPath,
      serverGithubResultsPath: serverResultsPath,
      receivedGithubResultsPath: requestedResultsPath,
      spotlightApp: process.env.SPOTLIGHT_APP || '',
    });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const isTest = body.isTest === true || body.isTest === 'true';
  const resultsScope = body.resultsScope === 'partial' ? 'partial' : 'complete';
  const resultsSubdir = isTest ? `${resultsPath}/test` : resultsPath;
  const result = { ok: true };
  let decodedFilesForEmail = [];

  const fileBase64 = body.fileBase64;
  const zipBase64 = body.zipBase64;
  const batchFiles = Array.isArray(body.files) ? body.files : [];
  const isBatchUpload =
    batchFiles.length > 0
    && body.folderName
    && batchFiles.every(
      (file) => file
        && typeof file.fileName === 'string'
        && typeof file.fileBase64 === 'string'
        && file.fileBase64.length > 0
    );
  const isSingleFile =
    !isBatchUpload
    && fileBase64
    && typeof fileBase64 === 'string'
    && body.fileName
    && body.folderName;

  if (!isBatchUpload && !isSingleFile && (!zipBase64 || typeof zipBase64 !== 'string')) {
    return res.status(400).json({ error: 'Missing files batch, fileBase64, or zipBase64' });
  }

  if (useGitHub) {
    const [owner, repoName] = repo.split('/');
    if (!owner || !repoName) {
      return res.status(500).json({ error: 'Invalid GITHUB_REPO' });
    }

    try {
      if (isBatchUpload) {
        const folderName = safeFolderName(body.folderName);
        const decodedFiles = batchFiles.map((file) => {
          const fileName = safeFileName(file.fileName);
          const encoding = file.contentEncoding === 'gzip' ? 'gzip' : 'none';
          const fileBuffer = decodeUploadedFile(file.fileBase64, encoding);
          const repoPath = buildRepoPath(resultsSubdir, resultsScope, folderName, fileName);
          return { fileName, repoPath, fileBuffer };
        });
        decodedFilesForEmail = decodedFiles.map((file) => ({
          fileName: file.fileName,
          fileBuffer: file.fileBuffer,
        }));
        const commitMessage = buildBatchCommitMessage({
          resultsScope,
          folderName,
          checkpointLabel: body.checkpointLabel,
          fileNames: decodedFiles.map((file) => file.fileName),
        });
        const batchResult = await pushFilesBatchToGitHub({
          githubToken,
          owner,
          repoName,
          githubBranch,
          files: decodedFiles,
          commitMessage,
        });
        result.paths = batchResult.paths;
        result.path = batchResult.paths[0] || '';
        result.commitSha = batchResult.commitSha;
      } else if (isSingleFile) {
        const folderName = safeFolderName(body.folderName);
        const fileName = safeFileName(body.fileName);
        const encoding = body.contentEncoding === 'gzip' ? 'gzip' : 'none';
        const fileBuffer = decodeUploadedFile(fileBase64, encoding);
        const repoPath = buildRepoPath(resultsSubdir, resultsScope, folderName, fileName);
        await pushFileToGitHub({
          githubToken,
          owner,
          repoName,
          githubBranch,
          repoPath,
          fileBuffer,
          commitMessage: `[skip ci] Add results file: ${folderName}/${fileName}`,
        });
        result.path = repoPath;
      } else {
        const filename = `${resultsSubdir}/${participantId}_motr_results_${timestamp}.zip`;
        const fileBuffer = Buffer.from(zipBase64, 'base64');
        await pushFileToGitHub({
          githubToken,
          owner,
          repoName,
          githubBranch,
          repoPath: filename,
          fileBuffer,
          commitMessage: `[skip ci] Add results: ${participantId}_motr_results_${timestamp}.zip`,
        });
        result.path = filename;
      }
    } catch (err) {
      console.error('GitHub upload error', err);
      return res.status(500).json({ error: 'GitHub upload failed', details: String(err.message) });
    }
  }

  if (useEmail && resultsScope === 'complete') {
    try {
      let emailZip = typeof zipBase64 === 'string' && zipBase64.length > 0 ? zipBase64 : '';
      if (!emailZip && decodedFilesForEmail.length > 0) {
        emailZip = await buildZipBase64FromDecodedFiles(body.folderName, decodedFilesForEmail);
      }
      if (!emailZip && isSingleFile && fileBase64) {
        emailZip = fileBase64;
      }
      if (emailZip) {
        await sendEmailWithZip(
          resendKey,
          emailTo,
          participantId,
          timestamp,
          emailZip,
          body.folderName || participantId
        );
        result.email = emailTo;
      } else {
        result.emailSkipped = 'No ZIP available for email backup';
      }
    } catch (err) {
      console.error('Email failed', err);
      result.emailError = String(err.message);
    }
  }

  return res.status(200).json(result);
}
