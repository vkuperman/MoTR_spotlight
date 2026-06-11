/**
 * Serverless function: POST /api/upload-results
 *
 * Single file (preferred for large sessions):
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
 * - RESEND_API_KEY + EMAIL_TO: email zip to EMAIL_TO (Resend free tier: only to account owner until domain verified)
 * At least one of (GitHub) or (Resend + EMAIL_TO) must be set.
 */

import { gunzipSync } from 'zlib';

const STUDY_KEY_BY_APP = {
  SONA: 'spotlight_SONA',
  PROLIFIC: 'spotlight_PROLIFIC',
};

function normalizeResultsPath(pathValue) {
  return String(pathValue || '')
    .replace(/\\/g, '/')
    .replace(/\/+$/, '');
}

function expectedStudyKeyForDeployment() {
  const app = String(process.env.SPOTLIGHT_APP || '').toUpperCase();
  return STUDY_KEY_BY_APP[app] || '';
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

async function pushFileToGitHub({
  githubToken,
  owner,
  repoName,
  githubBranch,
  repoPath,
  fileBuffer,
  commitMessage,
}) {
  const url = `https://api.github.com/repos/${owner}/${repoName}/contents/${encodeURIComponent(repoPath)}`;
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${githubToken}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: commitMessage,
      content: fileBuffer.toString('base64'),
      branch: githubBranch,
    }),
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`GitHub upload failed (${response.status}): ${errText}`);
  }
  return response.json();
}

async function sendEmailWithZip(resendKey, emailTo, participantId, timestamp, zipBase64) {
  const zipFilename = `${participantId}_motr_results_${timestamp}.zip`;
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
      text: `Results for participant ${participantId} (${timestamp}).`,
      attachments: [{ filename: zipFilename, content: zipBase64 }],
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend: ${res.status} ${err}`);
  }
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
  const emailTo = process.env.EMAIL_TO || 'vkuperman@yahoo.com';

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

  if (requestedResultsPath !== serverResultsPath) {
    return res.status(403).json({
      error: 'githubResultsPath does not match this API deployment',
      expectedGithubResultsPath: serverResultsPath,
      receivedGithubResultsPath: requestedResultsPath,
      spotlightApp: process.env.SPOTLIGHT_APP || '',
    });
  }

  const resultsPath = serverResultsPath;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const isTest = body.isTest === true || body.isTest === 'true';
  const resultsScope = body.resultsScope === 'partial' ? 'partial' : 'complete';
  const resultsSubdir = isTest ? `${resultsPath}/test` : resultsPath;
  const result = { ok: true };

  const fileBase64 = body.fileBase64;
  const zipBase64 = body.zipBase64;
  const isSingleFile =
    fileBase64 && typeof fileBase64 === 'string' && body.fileName && body.folderName;

  if (!isSingleFile && (!zipBase64 || typeof zipBase64 !== 'string')) {
    return res.status(400).json({ error: 'Missing fileBase64 or zipBase64' });
  }

  if (useGitHub) {
    const [owner, repoName] = repo.split('/');
    if (!owner || !repoName) {
      return res.status(500).json({ error: 'Invalid GITHUB_REPO' });
    }

    try {
      if (isSingleFile) {
        const folderName = safeFolderName(body.folderName);
        const fileName = safeFileName(body.fileName);
        const encoding = body.contentEncoding === 'gzip' ? 'gzip' : 'none';
        const fileBuffer = decodeUploadedFile(fileBase64, encoding);
        const repoPath = resultsScope === 'partial'
          ? `${resultsSubdir}/partial/${folderName}/${fileName}`
          : `${resultsSubdir}/${folderName}/${fileName}`;
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

  if (useEmail) {
    try {
      const emailBase64 = isSingleFile ? fileBase64 : zipBase64;
      await sendEmailWithZip(resendKey, emailTo, participantId, timestamp, emailBase64);
      result.email = emailTo;
    } catch (err) {
      console.error('Email failed', err);
      return res.status(500).json({ error: 'Email failed', details: String(err.message) });
    }
  }

  return res.status(200).json(result);
}
