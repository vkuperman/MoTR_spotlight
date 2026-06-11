import { generateUniqueAlphanumericId, resolveSonaId } from './resultsReports';
import { isNoUploadMode } from './previewMode';

function padDatePart(n) {
  return String(n).padStart(2, '0');
}

function buildSessionFolderName(participantId, startTime) {
  const id = participantId && String(participantId) ? String(participantId) : 'unknown';
  const datePart = [
    startTime.getFullYear(),
    padDatePart(startTime.getMonth() + 1),
    padDatePart(startTime.getDate()),
  ].join('-') + `_${padDatePart(startTime.getHours())}-${padDatePart(startTime.getMinutes())}`;
  return `motr_results_${id}_${datePart}`;
}

function resolveParticipantId(vm) {
  const expData = (vm.$magpie.getExpData && vm.$magpie.getExpData()) || {};
  let participantId =
    expData.ParticipantId
    || expData.ProlificID
    || expData.ProlificId
    || expData.SubjectID
    || expData.SubjectId
    || expData.SONAId
    || expData.SonaId
    || (vm.$root && vm.$root.participantId)
    || '';
  if (!participantId || String(participantId).trim() === '') {
    participantId = generateUniqueAlphanumericId();
    if (vm.$magpie.addExpData) vm.$magpie.addExpData({ ParticipantId: participantId });
  }
  return String(participantId).trim();
}

export function initResultsSession(vm, studyConfig) {
  if (isNoUploadMode()) return null;
  if (!vm || !vm.$root) return null;
  if (vm.$root._motrResultsSession) return vm.$root._motrResultsSession;

  const participantId = resolveParticipantId(vm);
  const expData = (vm.$magpie.getExpData && vm.$magpie.getExpData()) || {};
  const sonaId = resolveSonaId(vm, expData, null);
  const startTime = new Date();
  const sessionId = `${participantId}_${startTime.getTime()}_${generateUniqueAlphanumericId()}`;
  const folderName = buildSessionFolderName(participantId, startTime);
  const session = {
    sessionId,
    participantId,
    sonaId,
    folderName,
    startTime: startTime.toISOString(),
    studyKey: studyConfig && studyConfig.studyKey ? studyConfig.studyKey : '',
    trialsCompleted: [],
  };
  vm.$root._motrResultsSession = session;
  return session;
}

export function getResultsSession(vm) {
  if (!vm || !vm.$root || !vm.$root._motrResultsSession) return null;
  return vm.$root._motrResultsSession;
}
