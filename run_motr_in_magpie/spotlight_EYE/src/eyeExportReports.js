/**
 * Eye-specific export helpers: blur-only mouse reports + separate comprehension CSV
 * for both blur and clear blocks (practice excluded).
 */

function csvEscape(value) {
  const s = value == null ? '' : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(columns, rows) {
  const lines = [columns.join(',')];
  for (const row of rows) {
    lines.push(columns.map((col) => csvEscape(row[col])).join(','));
  }
  return `${lines.join('\n')}\n`;
}

function pick(row, ...keys) {
  for (const key of keys) {
    if (row && row[key] != null && String(row[key]).trim() !== '') return row[key];
  }
  return '';
}

export function isPracticeRow(row) {
  if (!row) return true;
  const mode = String(row.eye_block_mode || '').toLowerCase();
  return row.eye_is_practice === true
    || row.eye_is_practice === 1
    || row.eye_is_practice === '1'
    || mode === 'practice'
    || String(row.Condition || '').toLowerCase() === 'practice';
}

export function isResponseRow(row) {
  if (!row) return false;
  if (row.response == null) return false;
  return String(row.response).trim() !== '';
}

export function isMouseMovementRow(row) {
  if (!row) return false;
  if (row.recordType === 'hover_association' || row.recordType === 'raw_position_sample') return true;
  return row.mousePositionX != null
    && row.mousePositionX !== ''
    && (row.response == null || row.response === '');
}

function eyeMode(row) {
  return String(row && row.eye_block_mode != null ? row.eye_block_mode : '').toLowerCase();
}

function isBlurBlockRow(row) {
  const mode = eyeMode(row);
  if (mode === 'clear' || mode === 'practice') return false;
  if (String(row.eye_tracking_enabled) === '0' || row.eye_tracking_enabled === false) return false;
  // Treat explicit blur, or tracking-enabled rows without a clear label, as blur.
  return mode === 'blur' || mode === '' || String(row.eye_tracking_enabled) === '1' || row.eye_tracking_enabled === true;
}

/**
 * Rows used for fixation / interest-area / raw-position / raw-trial mouse exports:
 * blur-block mouse events + blur-block comprehension rows (for joining response columns).
 */
export function rowsForBlurMouseReports(allRows) {
  if (!Array.isArray(allRows)) return [];
  const kept = [];
  for (const row of allRows) {
    if (!row || isPracticeRow(row) || !isBlurBlockRow(row)) continue;
    if (isMouseMovementRow(row) || isResponseRow(row)) kept.push(row);
  }
  return kept;
}

/**
 * One row per comprehension answer for blur and clear main texts.
 */
export function buildComprehensionQuestionsCsv(allRows, participantId) {
  if (!Array.isArray(allRows)) return '';
  const byItem = new Map();
  for (const row of allRows) {
    if (!row || isPracticeRow(row) || !isResponseRow(row)) continue;
    const mode = eyeMode(row);
    if (mode === 'practice') continue;
    if (mode && mode !== 'blur' && mode !== 'clear') continue;

    const itemId = pick(row, 'ItemId', 'item_id');
    if (itemId === '') continue;
    const key = String(itemId);
    // Keep the last non-empty response for this item.
    byItem.set(key, {
      participant_id: participantId != null ? String(participantId) : '',
      ItemId: itemId,
      Condition: pick(row, 'Condition', 'condition_id'),
      block: mode === 'clear' ? 'clear' : 'blur',
      onestop_level: pick(row, 'onestop_level'),
      onestop_article_number: pick(row, 'onestop_article_number'),
      onestop_paragraph_number: pick(row, 'onestop_paragraph_number', 'onestop_paragraph_index'),
      response: String(row.response).trim(),
      response_correct: pick(row, 'response_correct'),
    });
  }

  const rows = Array.from(byItem.values()).sort((a, b) => {
    const modeCmp = String(a.block).localeCompare(String(b.block));
    if (modeCmp !== 0) return modeCmp;
    const idA = Number(a.ItemId);
    const idB = Number(b.ItemId);
    if (Number.isFinite(idA) && Number.isFinite(idB) && idA !== idB) return idA - idB;
    return String(a.ItemId).localeCompare(String(b.ItemId));
  });

  if (!rows.length) return '';

  return toCsv(
    [
      'participant_id',
      'ItemId',
      'Condition',
      'block',
      'onestop_level',
      'onestop_article_number',
      'onestop_paragraph_number',
      'response',
      'response_correct',
    ],
    rows
  );
}

/** Remove Eye-internal tags so mouse CSVs do not expose them. */
export function stripEyeInternalFields(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => {
    if (!row || typeof row !== 'object') return row;
    const copy = { ...row };
    delete copy.eye_block_mode;
    delete copy.eye_tracking_enabled;
    delete copy.eye_is_practice;
    return copy;
  });
}
