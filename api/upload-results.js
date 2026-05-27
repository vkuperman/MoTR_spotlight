/**
 * Serverless function: POST /api/upload-results
 * Body: { participantId: string, zipBase64: string }
 *
 * Optional env:
 * - GITHUB_TOKEN + GITHUB_REPO: push zip to GitHub (default run_motr_in_magpie/Results/)
 * - GITHUB_RESULTS_PATH: folder path in repo (default run_motr_in_magpie/Results)
 * - GITHUB_BRANCH: branch to commit to (default main)
 * - RESEND_API_KEY + EMAIL_TO: email zip to EMAIL_TO (Resend free tier: only to account owner until domain verified)
 * At least one of (GitHub) or (Resend + EMAIL_TO) must be set.
 */

function safeParticipantId(id) {
  if (id == null || typeof id !== 'string') return 'unknown';
  return id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64) || 'unknown';
}

async function sendEmailWithZip(resendKey, emailTo, participantId, timestamp, zipBase64) {
  const zipFilename = `${participantId}_motr_results_${timestamp}.zip`;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'MoTR Results <onboarding@resend.dev>',
      to: [emailTo],
      subject: `MoTR results: ${participantId}`,
      text: `Results for participant ${participantId} (${timestamp}).`,
      attachments: [{ filename: zipFilename, content: zipBase64 }]
    })
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
  const resultsPath = (process.env.GITHUB_RESULTS_PATH || 'run_motr_in_magpie/Results').replace(/\/+$/, '');
  const githubBranch = process.env.GITHUB_BRANCH || 'main';
  const resendKey = process.env.RESEND_API_KEY;
  const emailTo = process.env.EMAIL_TO || 'vkuperman@yahoo.com';

  const useGitHub = !!githubToken;
  const useEmail = !!(resendKey && emailTo);
  if (!useGitHub && !useEmail) {
    return res.status(500).json({
      error: 'Server not configured: set GITHUB_TOKEN or RESEND_API_KEY and EMAIL_TO'
    });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (_) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const participantId = safeParticipantId(body.participantId);
  const zipBase64 = body.zipBase64;
  if (!zipBase64 || typeof zipBase64 !== 'string') {
    return res.status(400).json({ error: 'Missing zipBase64' });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const isTest = body.isTest === true || body.isTest === 'true';
  const resultsSubdir = isTest ? `${resultsPath}/test` : resultsPath;
  const filename = `${resultsSubdir}/${participantId}_motr_results_${timestamp}.zip`;
  const result = { ok: true };

  if (useEmail) {
    try {
      await sendEmailWithZip(resendKey, emailTo, participantId, timestamp, zipBase64);
      result.email = emailTo;
    } catch (err) {
      console.error('Email failed', err);
      return res.status(500).json({ error: 'Email failed', details: String(err.message) });
    }
  }

  if (useGitHub) {
    const [owner, repoName] = repo.split('/');
    if (!owner || !repoName) {
      return res.status(500).json({ error: 'Invalid GITHUB_REPO' });
    }
    const url = `https://api.github.com/repos/${owner}/${repoName}/contents/${encodeURIComponent(filename)}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `Add results: ${participantId}_motr_results_${timestamp}.zip`,
        content: zipBase64,
        branch: githubBranch
      })
    });
    if (!response.ok) {
      const errText = await response.text();
      console.error('GitHub API error', response.status, errText);
      return res.status(response.status).json({ error: 'GitHub upload failed', details: errText });
    }
    result.path = filename;
  }

  return res.status(200).json(result);
}
