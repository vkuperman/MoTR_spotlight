/** Insert after Condition in fixation, interest-area, and raw exports (order: level, article, paragraph). */
export const ONESTOP_EXPORT_COLUMNS = [
  'onestop_level',
  'onestop_article_number',
  'onestop_paragraph_number',
];

export function normalizeOneStopLevelAbbrev(level) {
  const s = String(level || '').trim().toLowerCase();
  if (!s) return '';
  if (s === 'ele' || s === 'elementary' || s === '1') return 'ele';
  if (s === 'int' || s === 'intermediate' || s === '2') return 'int';
  if (s === 'adv' || s === 'advanced' || s === '3') return 'adv';
  if (s.startsWith('elem')) return 'ele';
  if (s.startsWith('inter')) return 'int';
  if (s.startsWith('adv')) return 'adv';
  return '';
}

function getRowItemId(row) {
  if (!row) return null;
  if (row.ItemId != null && row.ItemId !== '') return String(row.ItemId);
  if (row.item_id != null && row.item_id !== '') return String(row.item_id);
  return null;
}

function pickFirstNonEmpty(...values) {
  for (const value of values) {
    if (value != null && String(value).trim() !== '') return String(value).trim();
  }
  return '';
}

export function readOneStopTrialMetaFromEl(rootEl) {
  if (!rootEl) return {};
  const q = (sel) => {
    const el = rootEl.querySelector(sel);
    return el && el.value !== '' ? String(el.value).trim() : '';
  };
  const blockLevel = q('.onestop_block_level');
  const trialLevel = q('.onestop_level');
  const paragraph = q('.onestop_paragraph_index');
  return {
    onestop_level: normalizeOneStopLevelAbbrev(blockLevel || trialLevel),
    onestop_block_level: blockLevel,
    onestop_article_number: q('.onestop_article_number'),
    onestop_paragraph_number: paragraph,
    onestop_paragraph_index: paragraph,
  };
}

export function appendOneStopTrialMeta(payload, meta) {
  if (!payload || !meta) return payload;
  if (meta.onestop_level) payload.onestop_level = meta.onestop_level;
  if (meta.onestop_block_level) payload.onestop_block_level = meta.onestop_block_level;
  if (meta.onestop_article_number) payload.onestop_article_number = meta.onestop_article_number;
  if (meta.onestop_paragraph_number) payload.onestop_paragraph_number = meta.onestop_paragraph_number;
  if (meta.onestop_paragraph_index) payload.onestop_paragraph_index = meta.onestop_paragraph_index;
  return payload;
}

export function getOneStopMetadataByItem(allRows) {
  const out = {};
  if (!Array.isArray(allRows)) return out;
  for (const row of allRows) {
    const itemId = getRowItemId(row);
    if (!itemId || out[itemId]) continue;
    const level = pickFirstNonEmpty(
      row.onestop_level,
      normalizeOneStopLevelAbbrev(row.onestop_block_level),
      normalizeOneStopLevelAbbrev(row.onestop_level),
      normalizeOneStopLevelAbbrev(row.Condition),
      normalizeOneStopLevelAbbrev(row.condition)
    );
    const articleNumber = pickFirstNonEmpty(row.onestop_article_number);
    const paragraphNumber = pickFirstNonEmpty(row.onestop_paragraph_number, row.onestop_paragraph_index);
    if (level || articleNumber || paragraphNumber) {
      out[itemId] = {
        onestop_level: level,
        onestop_article_number: articleNumber,
        onestop_paragraph_number: paragraphNumber,
      };
    }
  }
  return out;
}

export function getOneStopExportValues(row, oneStopByItem) {
  const itemId = getRowItemId(row);
  const fromItem = itemId && oneStopByItem ? oneStopByItem[itemId] : null;
  return {
    onestop_level: pickFirstNonEmpty(
      row && row.onestop_level,
      row && normalizeOneStopLevelAbbrev(row.onestop_block_level),
      row && normalizeOneStopLevelAbbrev(row.Condition),
      row && normalizeOneStopLevelAbbrev(row.condition),
      fromItem && fromItem.onestop_level
    ),
    onestop_article_number: pickFirstNonEmpty(
      row && row.onestop_article_number,
      fromItem && fromItem.onestop_article_number
    ),
    onestop_paragraph_number: pickFirstNonEmpty(
      row && row.onestop_paragraph_number,
      row && row.onestop_paragraph_index,
      fromItem && fromItem.onestop_paragraph_number
    ),
  };
}

export function applyOneStopExportFields(target, row, oneStopByItem) {
  const values = getOneStopExportValues(row, oneStopByItem);
  target.onestop_level = values.onestop_level;
  target.onestop_article_number = values.onestop_article_number;
  target.onestop_paragraph_number = values.onestop_paragraph_number;
  return target;
}

export function columnsWithOneStopAfterCondition(baseColumns) {
  const idx = baseColumns.indexOf('Condition');
  if (idx === -1) return [...baseColumns, ...ONESTOP_EXPORT_COLUMNS];
  return [
    ...baseColumns.slice(0, idx + 1),
    ...ONESTOP_EXPORT_COLUMNS,
    ...baseColumns.slice(idx + 1),
  ];
}

export function orderRawTrialColumns(columns) {
  const exclude = new Set(ONESTOP_EXPORT_COLUMNS);
  const rest = columns.filter((column) => !exclude.has(column));
  const conditionIdx = rest.indexOf('Condition');
  if (conditionIdx === -1) {
    return [...ONESTOP_EXPORT_COLUMNS, ...rest];
  }
  return [
    ...rest.slice(0, conditionIdx + 1),
    ...ONESTOP_EXPORT_COLUMNS,
    ...rest.slice(conditionIdx + 1),
  ];
}
