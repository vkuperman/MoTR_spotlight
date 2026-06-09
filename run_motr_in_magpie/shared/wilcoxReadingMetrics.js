/** Wilcox et al. (2024) default association duration thresholds (ms). */
export const WILCOX_ASSOCIATION_MIN_MS = 160;
export const WILCOX_ASSOCIATION_MAX_MS = 4000;

export function getHoverDurationMs(row) {
  if (!row || row.clickDurationMs == null || row.clickDurationMs === '') return null;
  const duration = Number(row.clickDurationMs);
  return Number.isFinite(duration) ? duration : null;
}

/** Same bounds as mergeAssociations.py: duration > minMs && duration < maxMs. */
export function isWilcoxAssociationDuration(durationMs, options = {}) {
  const minMs = options.minMs != null ? options.minMs : WILCOX_ASSOCIATION_MIN_MS;
  const maxMs = options.maxMs != null ? options.maxMs : WILCOX_ASSOCIATION_MAX_MS;
  return durationMs != null && durationMs > minMs && durationMs < maxMs;
}

export function isValidHoverAssociation(row, options = {}) {
  if (!row || row.mousePositionX == null || row.mousePositionX === '') return false;
  if (row.recordType === 'raw_position_sample') return false;
  const isHover = row.recordType === 'hover_association'
    || row.clickDurationMs != null
    || row.revealMode === 'hover';
  if (!isHover) return false;
  return isWilcoxAssociationDuration(getHoverDurationMs(row), options);
}

export function filterValidHoverRows(rows, options = {}) {
  return (rows || []).filter((row) => isValidHoverAssociation(row, options));
}

export function getRowTime(row) {
  if (!row) return 0;
  const responseTime = row.responseTime != null && row.responseTime !== '' ? Number(row.responseTime) : NaN;
  if (Number.isFinite(responseTime)) return responseTime;
  const sampleTime = row.sampleTimeMs != null && row.sampleTimeMs !== '' ? Number(row.sampleTimeMs) : NaN;
  return Number.isFinite(sampleTime) ? sampleTime : 0;
}

export function getRowWordIndex(row) {
  if (!row || row.Index == null || row.Index === '') return null;
  const index = Number(row.Index);
  if (!Number.isFinite(index) || index < 1) return null;
  return index;
}

/**
 * Merge consecutive samples/events on the same word into Wilcox-style associations.
 * Mirrors MoTR/post_processing/utils/mergeAssociations.py.
 */
export function mergeWilcoxAssociations(sortedRows, options = {}) {
  const minMs = options.minMs != null ? options.minMs : WILCOX_ASSOCIATION_MIN_MS;
  const maxMs = options.maxMs != null ? options.maxMs : WILCOX_ASSOCIATION_MAX_MS;
  const associations = [];
  if (!Array.isArray(sortedRows) || sortedRows.length === 0) return associations;

  let streakStartTime = null;
  let streakWord = null;

  const flushAssociation = (wordIndex, endTime) => {
    if (streakWord == null || streakStartTime == null || wordIndex == null) return;
    const duration = endTime - streakStartTime;
    if (duration > minMs && duration < maxMs) {
      associations.push({
        wordIndex: streakWord,
        duration,
        startTime: streakStartTime,
        endTime,
      });
    }
  };

  for (let i = 0; i < sortedRows.length; i++) {
    const row = sortedRows[i];
    const word = getRowWordIndex(row);
    const time = getRowTime(row);

    if (word == null) {
      if (streakWord != null) flushAssociation(streakWord, time);
      streakWord = null;
      streakStartTime = null;
      continue;
    }

    if (streakWord == null || streakWord !== word) {
      if (streakWord != null) flushAssociation(streakWord, time);
      streakWord = word;
      streakStartTime = time;
    }
  }

  return associations;
}

/**
 * Build associations from hover dwell rows when raw samples are unavailable.
 */
export function hoverRowsToWilcoxAssociations(sortedHoverRows, options = {}) {
  const minMs = options.minMs != null ? options.minMs : WILCOX_ASSOCIATION_MIN_MS;
  const maxMs = options.maxMs != null ? options.maxMs : WILCOX_ASSOCIATION_MAX_MS;
  const associations = [];
  for (const row of sortedHoverRows || []) {
    const wordIndex = getRowWordIndex(row);
    const duration = getHoverDurationMs(row);
    if (wordIndex == null || !isWilcoxAssociationDuration(duration, { minMs, maxMs })) continue;
    associations.push({
      wordIndex,
      duration,
      startTime: getRowTime(row),
      endTime: getRowTime(row) + duration,
    });
  }
  return associations.sort((a, b) => a.startTime - b.startTime || a.wordIndex - b.wordIndex);
}

/**
 * Inclusive regression-path (go-past) duration per word.
 * Mirrors MoTR/post_processing/utils/extractLingusticFeatures.py get_go_past_time().
 */
export function computeWilcoxGoPastByWord(associations) {
  const byWord = new Map();
  if (!Array.isArray(associations) || associations.length === 0) return byWord;

  for (let i = 0; i < associations.length; i++) {
    const assoc = associations[i];
    const wordIndex = assoc.wordIndex;
    const isFirstPass = associations.slice(0, i).every((a) => a.wordIndex < wordIndex);
    if (!isFirstPass) continue;

    let total = assoc.duration;
    for (let j = i + 1; j < associations.length; j++) {
      if (associations[j].wordIndex <= wordIndex) {
        total += associations[j].duration;
      } else {
        break;
      }
    }

    if (!byWord.has(wordIndex)) {
      byWord.set(wordIndex, Math.round(total));
    }
  }

  return byWord;
}

export function buildWilcoxAssociationsForItem(rawSampleRows, hoverRows, options = {}) {
  const rawSorted = (rawSampleRows || []).slice().sort((a, b) => getRowTime(a) - getRowTime(b));
  if (rawSorted.length > 0) {
    return mergeWilcoxAssociations(rawSorted, options);
  }
  const hoverSorted = (hoverRows || []).slice().sort((a, b) => getRowTime(a) - getRowTime(b));
  return hoverRowsToWilcoxAssociations(hoverSorted, options);
}
