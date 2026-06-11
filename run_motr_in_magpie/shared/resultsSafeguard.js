import JSZip from 'jszip';
import magpieConfig from '@magpie-config';
import {
  buildFixationReport,
  buildInterestAreaReport,
  buildRawPositionReport,
  buildRawTrialDataCsv,
  generateUniqueAlphanumericId,
  localDateString,
  localTimeString,
} from './resultsReports';
import { getResultsSession } from './resultsSession';
import {
  deleteResultsSnapshot,
  listPendingSnapshots,
  loadResultsSnapshot,
  saveResultsSnapshot,
} from './resultsIndexedDb';
import { getResultsUploadUrl, uploadResultsFiles } from './resultsUpload';

function resolveParticipantId(vm, expData) {
  const exp = expData && typeof expData === 'object' ? expData : {};
  let participantId =
    exp.ParticipantId
    || exp.ProlificID
    || exp.ProlificId
    || exp.SubjectID
    || exp.SubjectId
    || exp.SONAId
    || exp.SonaId
    || (vm.$root && vm.$root.participantId)
    || null;
  if (!participantId || String(participantId).trim() === '') {
    participantId = generateUniqueAlphanumericId();
    if (vm.$magpie.addExpData) vm.$magpie.addExpData({ ParticipantId: participantId });
  }
  return String(participantId).trim();
}

function resolveGithubResultsPath(vm, studyConfig) {
  return (vm.githubResultsPath && String(vm.githubResultsPath).trim())
    || (studyConfig && studyConfig.githubResultsPath && String(studyConfig.githubResultsPath).trim())
    || (magpieConfig.githubResultsPath && typeof magpieConfig.githubResultsPath === 'string'
      ? magpieConfig.githubResultsPath.trim()
      : '');
}

export function resolveExportContext(vm, studyConfig) {
  const allRows = vm.$magpie.getAllData();
  const expData = (vm.$magpie.getExpData && vm.$magpie.getExpData()) || {};
  const session = getResultsSession(vm);
  const participantId = session && session.participantId
    ? session.participantId
    : resolveParticipantId(vm, expData);
  const uploadUrl = getResultsUploadUrl(vm);
  const githubResultsPath = resolveGithubResultsPath(vm, studyConfig);
  const isTest = !!(vm.$magpie && vm.$magpie.debug);
  const folderName = session && session.folderName
    ? session.folderName
    : `motr_results_${participantId}_unknown`;
  return {
    participantId,
    expData,
    allRows,
    uploadUrl,
    githubResultsPath,
    isTest,
    folderName,
    sessionId: session ? session.sessionId : null,
    session,
  };
}

export function buildCheckpointSessionTimes(vm) {
  const expData = (vm.$magpie.getExpData && vm.$magpie.getExpData()) || {};
  const allRows = vm.$magpie.getAllData();
  let startTime = expData.experiment_start_time || expData.experimentStartTime;
  if (!startTime && Array.isArray(allRows) && allRows.length > 0) {
    const minT = Math.min(
      ...allRows
        .map((r) => (r.responseTime != null && typeof r.responseTime === 'number' ? r.responseTime : Infinity))
        .filter((t) => t !== Infinity)
    );
    if (minT !== Infinity && Number.isFinite(minT)) startTime = new Date(minT).toISOString();
  }
  return {
    experiment_start_time_fallback: startTime || '',
  };
}

export function buildCompleteSessionTimes(vm) {
  const checkpointTimes = buildCheckpointSessionTimes(vm);
  const endTime = new Date();
  const startTime = checkpointTimes.experiment_start_time_fallback;
  const durationMs = startTime ? (endTime.getTime() - new Date(startTime).getTime()) : '';
  const endDate = localDateString(endTime);
  const endClockTime = localTimeString(endTime);
  return {
    ...checkpointTimes,
    experiment_end_date: endDate,
    experiment_end_time: endTime.toISOString(),
    experiment_end_clock_time: endClockTime,
    experiment_end_time_local: `${endDate} ${endClockTime}`,
    experiment_duration: durationMs !== '' ? String(durationMs) : '',
  };
}

export function filterRowsForTrial(allRows, trial) {
  if (!Array.isArray(allRows)) return [];
  const itemId = trial && trial.item_id != null ? trial.item_id : (trial ? trial.ItemId : null);
  if (itemId == null) return allRows.slice();
  return allRows.filter((row) => {
    if (!row) return false;
    const rowItemId = row.ItemId != null && row.ItemId !== ''
      ? row.ItemId
      : (row.item_id != null && row.item_id !== '' ? row.item_id : null);
    return rowItemId != null && String(rowItemId) === String(itemId);
  });
}

function buildCheckpointManifest(session, context) {
  return JSON.stringify({
    sessionId: session.sessionId,
    participantId: context.participantId,
    folderName: context.folderName,
    trialsCompleted: session.trialsCompleted.slice().sort((a, b) => a - b),
    updatedAt: new Date().toISOString(),
  }, null, 2);
}

function sanitizeRowsForSnapshot(allRows) {
  if (!Array.isArray(allRows)) return [];
  return allRows.map((row) => {
    if (!row || typeof row !== 'object') return row;
    const { allWords, ...rest } = row;
    return rest;
  });
}

export function buildCompleteResultsFiles(allRows, participantId, expData, sessionTimes) {
  const fixationCsv = buildFixationReport(allRows, participantId, expData, sessionTimes);
  const interestAreaCsv = buildInterestAreaReport(allRows, participantId, expData, sessionTimes);
  const rawPositionCsv = buildRawPositionReport(allRows, participantId, expData, sessionTimes);
  const rawTrialCsv = buildRawTrialDataCsv(allRows);
  const files = [
    { name: 'fixation_report.csv', content: fixationCsv },
    { name: 'interest_area_report.csv', content: interestAreaCsv },
    { name: 'raw_trial_data.csv', content: rawTrialCsv },
  ];
  if (rawPositionCsv) {
    files.push({ name: 'raw_position_samples.csv', content: rawPositionCsv });
  }
  return files;
}

function buildFilesFromSnapshot(snapshot) {
  if (snapshot && Array.isArray(snapshot.allRows) && snapshot.allRows.length > 0) {
    return buildCompleteResultsFiles(
      snapshot.allRows,
      snapshot.participantId,
      snapshot.expData || {},
      snapshot.sessionTimes || { experiment_start_time_fallback: '' }
    );
  }
  if (snapshot && Array.isArray(snapshot.files)) return snapshot.files;
  return [];
}

export async function uploadCompleteResults(context, sessionTimes, resultsScope = 'complete') {
  const files = buildCompleteResultsFiles(
    context.allRows,
    context.participantId,
    context.expData,
    sessionTimes
  );
  const sessionComplete = JSON.stringify({
    sessionId: context.sessionId,
    participantId: context.participantId,
    folderName: context.folderName,
    completedAt: new Date().toISOString(),
    trialsCompleted: context.session && Array.isArray(context.session.trialsCompleted)
      ? context.session.trialsCompleted.slice().sort((a, b) => a - b)
      : [],
  }, null, 2);
  files.push({ name: 'session_complete.json', content: sessionComplete });
  return uploadResultsFiles(
    context.uploadUrl,
    context.participantId,
    context.folderName,
    files,
    context.isTest,
    context.githubResultsPath,
    resultsScope
  );
}

export async function createResultsDownloadBlob(files, folderName) {
  const zip = new JSZip();
  const folder = folderName && String(folderName) ? String(folderName) : 'motr_results';
  for (const file of files || []) {
    if (!file || file.content == null || file.content === '') continue;
    zip.file(`${folder}/${file.name}`, file.content);
  }
  return zip.generateAsync({ type: 'blob' });
}

export function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function downloadResultsFiles(files, folderName) {
  const blob = await createResultsDownloadBlob(files, folderName);
  triggerBlobDownload(blob, `${folderName || 'motr_results'}.zip`);
}

export async function uploadReadingTrialCheckpoint(vm, trial, trialIndex, studyConfig) {
  const context = resolveExportContext(vm, studyConfig);
  const session = getResultsSession(vm);
  if (!context.uploadUrl || !session) return;

  if (!Array.isArray(session.trialsCompleted)) session.trialsCompleted = [];
  if (!session.trialsCompleted.includes(trialIndex)) {
    session.trialsCompleted.push(trialIndex);
  }

  const trialRows = filterRowsForTrial(context.allRows, trial);
  const sessionTimes = buildCheckpointSessionTimes(vm);
  const trialNum = String(trialIndex + 1).padStart(2, '0');
  const fixationCsv = buildFixationReport(
    trialRows,
    context.participantId,
    context.expData,
    sessionTimes
  );
  const rawPositionCsv = buildRawPositionReport(
    trialRows,
    context.participantId,
    context.expData,
    sessionTimes
  );
  const rawCsv = buildRawTrialDataCsv(trialRows);
  const manifest = buildCheckpointManifest(session, context);
  const checkpointFiles = [
    { name: `trials/trial_${trialNum}_fixation.csv`, content: fixationCsv },
    { name: `trials/trial_${trialNum}_raw.csv`, content: rawCsv },
    { name: 'checkpoint_manifest.json', content: manifest },
  ];
  if (rawPositionCsv) {
    checkpointFiles.splice(1, 0, {
      name: `trials/trial_${trialNum}_raw_position_samples.csv`,
      content: rawPositionCsv,
    });
  }

  await uploadResultsFiles(
    context.uploadUrl,
    context.participantId,
    context.folderName,
    checkpointFiles,
    context.isTest,
    context.githubResultsPath,
    'partial'
  );
}

/** Run checkpoint upload and IndexedDB snapshot after the UI advances (non-blocking). */
export function deferReadingTrialSafeguards(vm, trial, trialIndex, studyConfig) {
  queueMicrotask(() => {
    uploadReadingTrialCheckpoint(vm, trial, trialIndex, studyConfig).catch((err) => {
      console.warn('Trial checkpoint upload failed:', err);
    });
    persistResultsSnapshot(vm, studyConfig).catch((err) => {
      console.warn('Results snapshot failed:', err);
    });
  });
}

export async function persistResultsSnapshot(vm, studyConfig) {
  const context = resolveExportContext(vm, studyConfig);
  const session = getResultsSession(vm);
  if (!session) return;

  const sessionTimes = buildCheckpointSessionTimes(vm);

  await saveResultsSnapshot(session.sessionId, {
    participantId: context.participantId,
    folderName: context.folderName,
    uploadUrl: context.uploadUrl,
    githubResultsPath: context.githubResultsPath,
    isTest: context.isTest,
    allRows: sanitizeRowsForSnapshot(context.allRows),
    expData: context.expData || {},
    sessionTimes,
    trialsCompleted: session.trialsCompleted || [],
    pendingComplete: true,
    savedAt: new Date().toISOString(),
  });
}

async function uploadSnapshotPayload(snapshot) {
  const files = buildFilesFromSnapshot(snapshot);
  if (!snapshot || !snapshot.uploadUrl || !snapshot.folderName || !files.length) {
    return false;
  }
  const sessionComplete = JSON.stringify({
    sessionId: snapshot.sessionId,
    participantId: snapshot.participantId,
    folderName: snapshot.folderName,
    completedAt: new Date().toISOString(),
    trialsCompleted: Array.isArray(snapshot.trialsCompleted)
      ? snapshot.trialsCompleted.slice().sort((a, b) => a - b)
      : [],
    recoveredFromSnapshot: true,
    rebuiltFromAllRows: Array.isArray(snapshot.allRows) && snapshot.allRows.length > 0,
  }, null, 2);
  const uploadFiles = files.slice();
  uploadFiles.push({ name: 'session_complete.json', content: sessionComplete });
  await uploadResultsFiles(
    snapshot.uploadUrl,
    snapshot.participantId,
    snapshot.folderName,
    uploadFiles,
    !!snapshot.isTest,
    snapshot.githubResultsPath || '',
    'complete'
  );
  return true;
}

export async function retryPendingSnapshotUpload(vm, studyConfig) {
  const session = getResultsSession(vm);
  if (session) {
    const snapshot = await loadResultsSnapshot(session.sessionId);
    if (snapshot && snapshot.pendingComplete) {
      try {
        await uploadSnapshotPayload(snapshot);
        await deleteResultsSnapshot(session.sessionId);
        return true;
      } catch (err) {
        console.warn('Pending session snapshot upload failed:', err);
      }
    }
  }

  let pending = [];
  try {
    pending = await listPendingSnapshots();
  } catch (err) {
    console.warn('Could not list pending snapshots:', err);
    return false;
  }

  for (const snapshot of pending) {
    try {
      await uploadSnapshotPayload(snapshot);
      await deleteResultsSnapshot(snapshot.sessionId);
      return true;
    } catch (err) {
      console.warn('Pending snapshot upload failed:', err);
    }
  }
  return false;
}

export { initResultsSession, getResultsSession } from './resultsSession';
