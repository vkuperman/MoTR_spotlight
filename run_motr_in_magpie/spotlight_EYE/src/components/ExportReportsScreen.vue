<template>
  <Screen title="Thank you">
    <Slide>
      <p v-if="saving">Preparing your results…</p>
      <template v-else>
        <p>Thank you for participating.</p>
        <p v-if="downloadComplete" style="margin-top: 0.75em;">
          A results ZIP should have downloaded. If you do not see it, use the button below
          (check your browser’s Downloads folder / download permissions).
        </p>
        <p v-else-if="statusMessage" style="margin-top: 0.75em; color: #666;">
          {{ statusMessage }}
        </p>
        <div style="margin-top: 1.5em;">
          <button
            type="button"
            :disabled="!downloadFiles || !downloadFiles.length || downloading"
            @click="downloadResults"
          >
            {{ downloading ? 'Downloading…' : 'Download results ZIP' }}
          </button>
        </div>
        <p v-if="lastDownloadName" style="margin-top: 1em; font-size: 0.9em; color: #666;">
          File name: {{ lastDownloadName }}
        </p>
      </template>
    </Slide>
  </Screen>
</template>

<script>
import { Screen, Slide } from 'magpie-base';
import {
  buildCompleteResultsFiles,
  buildCompleteSessionTimes,
  createResultsDownloadBlob,
  resolveExportContext,
} from '@motr-shared/resultsSafeguard';
import {
  buildComprehensionQuestionsCsv,
  rowsForBlurMouseReports,
  stripEyeInternalFields,
} from '../eyeExportReports';

function pickNonEmpty(...values) {
  for (const value of values) {
    if (value != null && String(value).trim() !== '') return String(value).trim();
  }
  return '';
}

/** Consent value typed at start — Magpie clears measurements after each screen. */
function resolveConsentSubjectId(vm, expData, allRows) {
  const magpieExp = (vm && vm.$magpie && vm.$magpie.expData) ? vm.$magpie.expData : {};
  const m = vm && vm.$magpie && vm.$magpie.measurements ? vm.$magpie.measurements : null;
  const fromRoot = vm && vm.$root && vm.$root._eyeSubjectId != null
    ? String(vm.$root._eyeSubjectId).trim()
    : '';
  let fromRows = '';
  if (Array.isArray(allRows)) {
    for (const row of allRows) {
      if (!row) continue;
      fromRows = pickNonEmpty(row.SubjectID, row.SubjectId);
      if (fromRows) break;
    }
  }
  return pickNonEmpty(
    fromRoot,
    magpieExp.SubjectID,
    magpieExp.SubjectId,
    expData && expData.SubjectID,
    expData && expData.SubjectId,
    m && m.SubjectID,
    m && m.SubjectId,
    fromRows
  );
}

/** Ensure every CSV uses SubjectID (not SONAId) filled with the consent value. */
function rewriteSubjectIdColumn(csvText, subjectId) {
  if (!csvText || typeof csvText !== 'string') return csvText;
  const lines = csvText.split(/\r?\n/);
  if (!lines.length || !lines[0]) return csvText;

  const splitCsvLine = (line) => {
    const cells = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        cells.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
    cells.push(cur);
    return cells;
  };

  const joinCsvLine = (cells) => cells.map((cell) => {
    const s = cell == null ? '' : String(cell);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(',');

  const rawHeader = splitCsvLine(lines[0]).map((c) => {
    if (c === 'SONAId' || c === 'SonaId') return 'SubjectID';
    return c;
  });
  // Drop duplicate SubjectID headers (keep first).
  const seen = new Set();
  const keepIdx = [];
  rawHeader.forEach((name, idx) => {
    if (name === 'SubjectID' && seen.has('SubjectID')) return;
    if (name === 'SubjectID') seen.add('SubjectID');
    keepIdx.push(idx);
  });
  let cols = keepIdx.map((i) => rawHeader[i]);
  let insertedSubjectId = false;
  let subjectIdx = cols.indexOf('SubjectID');
  if (subjectIdx < 0) {
    subjectIdx = Math.min(1, cols.length);
    cols.splice(subjectIdx, 0, 'SubjectID');
    insertedSubjectId = true;
  }

  const out = [joinCsvLine(cols)];
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i] === '') {
      out.push('');
      continue;
    }
    const rowCells = splitCsvLine(lines[i]);
    const cells = keepIdx.map((idx) => (idx < rowCells.length ? rowCells[idx] : ''));
    if (insertedSubjectId) cells.splice(subjectIdx, 0, '');
    while (cells.length < cols.length) cells.push('');
    if (subjectId) cells[subjectIdx] = subjectId;
    cells.length = cols.length;
    out.push(joinCsvLine(cells));
  }
  return out.join('\n');
}

/** Firefox-safe download (anchor must be in the document). */
function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export default {
  name: 'ExportReportsScreen',
  components: { Screen, Slide },
  props: {
    skipSonaInput: { type: Boolean, default: false },
    prolificCompletionUrl: { type: String, default: '' },
    githubResultsPath: { type: String, default: '' },
  },
  data() {
    return {
      saving: true,
      downloading: false,
      downloadComplete: false,
      statusMessage: '',
      downloadFiles: null,
      downloadFolderName: '',
      lastDownloadName: '',
    };
  },
  async mounted() {
    await this.prepareFiles();
    if (this.downloadFiles && this.downloadFiles.length) {
      await this.downloadResults();
    }
  },
  methods: {
    async prepareFiles() {
      this.saving = true;
      this.statusMessage = '';
      try {
        const context = resolveExportContext(this, null);
        const sessionTimes = buildCompleteSessionTimes(this);
        const subjectId = resolveConsentSubjectId(this, context.expData, context.allRows);
        const expData = {
          ...(context.expData || {}),
          SubjectID: subjectId,
          SubjectId: subjectId,
          ParticipantId: subjectId || (context.expData && context.expData.ParticipantId) || context.participantId,
        };
        if (this.$magpie && this.$magpie.addExpData && subjectId) {
          this.$magpie.addExpData({ SubjectID: subjectId, SubjectId: subjectId });
        }
        const mouseRows = stripEyeInternalFields(rowsForBlurMouseReports(context.allRows));
        const files = buildCompleteResultsFiles(
          mouseRows,
          subjectId || context.participantId,
          expData,
          sessionTimes
        );

        const comprehensionCsv = buildComprehensionQuestionsCsv(
          context.allRows,
          subjectId || context.participantId,
          expData
        );
        if (comprehensionCsv) {
          files.push({
            name: 'comprehension_questions.csv',
            content: comprehensionCsv,
          });
        }

        this.downloadFiles = files.map((file) => {
          if (!file || typeof file.content !== 'string' || !file.name || !file.name.endsWith('.csv')) {
            return file;
          }
          return {
            ...file,
            content: rewriteSubjectIdColumn(file.content, subjectId),
          };
        });
        this.downloadFolderName = context.folderName || 'spotlight_EYE_results';
        const hasData = files.some((file) => file && file.content);
        if (!hasData) {
          this.statusMessage = 'No experiment data was recorded to save.';
        }
      } catch (e) {
        const message = e && e.message ? e.message : String(e);
        console.error('Could not prepare results:', message);
        this.statusMessage = message;
      } finally {
        this.saving = false;
      }
    },
    async downloadResults() {
      if (!this.downloadFiles || !this.downloadFiles.length || this.downloading) return;
      this.downloading = true;
      this.statusMessage = '';
      try {
        const folder = this.downloadFolderName || 'spotlight_EYE_results';
        const blob = await createResultsDownloadBlob(this.downloadFiles, folder);
        const filename = `${folder}.zip`;
        triggerDownload(blob, filename);
        this.lastDownloadName = filename;
        this.downloadComplete = true;
      } catch (e) {
        const message = e && e.message ? e.message : String(e);
        console.error('Results download failed:', message);
        this.statusMessage = `Download failed: ${message}`;
      } finally {
        this.downloading = false;
      }
    },
  },
};
</script>
