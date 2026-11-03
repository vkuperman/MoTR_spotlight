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
        const mouseRows = stripEyeInternalFields(rowsForBlurMouseReports(context.allRows));
        const files = buildCompleteResultsFiles(
          mouseRows,
          context.participantId,
          context.expData,
          sessionTimes
        );

        const comprehensionCsv = buildComprehensionQuestionsCsv(
          context.allRows,
          context.participantId
        );
        if (comprehensionCsv) {
          files.push({
            name: 'comprehension_questions.csv',
            content: comprehensionCsv,
          });
        }

        this.downloadFiles = files;
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
