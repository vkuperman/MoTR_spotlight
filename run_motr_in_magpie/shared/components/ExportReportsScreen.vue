<template>
  <Screen title="Thank you">
    <Slide v-if="!skipSonaInput && !submitted">
      <p>
        Thank you for participating in this study. Press Submit to complete.
      </p>
      <div style="margin-top: 1.5em;">
        <button @click="submitSonaAndNext">
          Submit
        </button>
      </div>
    </Slide>
    <Slide v-else-if="uploadError">
      <p>We could not save your results automatically. Please try again.</p>
      <p style="font-size: 0.9em; color: #666;">{{ uploadError }}</p>
      <div style="margin-top: 1.5em;">
        <button @click="retryUpload">Retry save</button>
        <button v-if="downloadFiles && downloadFiles.length" style="margin-left: 0.75em;" @click="downloadResults">
          Download results
        </button>
      </div>
    </Slide>
    <Slide v-else-if="prolificCompletionUrl && submitted && !uploadComplete && !uploadError">
      <p>Saving your results…</p>
    </Slide>
    <Slide v-else-if="prolificCompletionUrl && uploadComplete">
      <p>Thank you for participating. Please click the link below to return to Prolific</p>
      <p style="margin-top: 1em;">
        <a :href="prolificCompletionUrl" target="_blank" rel="noopener">{{ prolificCompletionUrl }}</a>
      </p>
    </Slide>
    <Slide v-else>
      <p>
        Thank you for participating! You may now close this window
      </p>
    </Slide>
  </Screen>
</template>

<script>
import { Screen, Slide } from 'magpie-base';
import {
  buildCompleteResultsFiles,
  buildCompleteSessionTimes,
  downloadResultsFiles,
  getResultsSession,
  resolveExportContext,
  retryPendingSnapshotUpload,
  uploadCompleteResults,
} from '@motr-shared/resultsSafeguard';
import { deleteResultsSnapshot } from '@motr-shared/resultsIndexedDb';
import { isNoUploadMode } from '@motr-shared/previewMode';

export default {
  name: 'ExportReportsScreen',
  components: { Screen, Slide },
  props: {
    skipSonaInput: { type: Boolean, default: false },
    /** Prolific completion URL; upload finishes before this link is shown. */
    prolificCompletionUrl: { type: String, default: '' },
    /** Override GitHub results folder (e.g. run_motr_in_magpie/Results/spotlight_PROLIFIC). */
    githubResultsPath: { type: String, default: '' },
  },
  data() {
    return {
      sonaId: '',
      submitted: false,
      uploadComplete: false,
      uploadError: '',
      saving: false,
      downloadFiles: null,
      downloadFolderName: '',
    };
  },
  async mounted() {
    if (isNoUploadMode()) {
      this.submitted = true;
      this.uploadComplete = true;
      return;
    }
    try {
      await retryPendingSnapshotUpload(this, null);
    } catch (err) {
      console.warn('Pending snapshot retry on mount failed:', err);
    }
    if (this.skipSonaInput) {
      this.submitDirectAndNext();
    }
  },
  methods: {
    async downloadResults() {
      if (!this.downloadFiles || !this.downloadFiles.length) return;
      await downloadResultsFiles(this.downloadFiles, this.downloadFolderName);
    },
    async retryUpload() {
      this.uploadError = '';
      this.uploadComplete = false;
      await this.submitDirectAndNext();
    },
    async exportAndNext() {
      if (isNoUploadMode()) {
        this.uploadComplete = true;
        this.$magpie.nextSlide();
        return;
      }
      const context = resolveExportContext(this, null);
      const sessionTimes = buildCompleteSessionTimes(this);
      const files = buildCompleteResultsFiles(
        context.allRows,
        context.participantId,
        context.expData,
        sessionTimes
      );
      this.downloadFiles = files;
      this.downloadFolderName = context.folderName;

      if (!context.uploadUrl) {
        throw new Error('Results upload is not configured (missing resultsUploadUrl).');
      }

      const hasData = files.some((file) => file.content);
      if (!hasData) {
        throw new Error('No experiment data to save.');
      }

      this.saving = true;
      try {
        try {
          await retryPendingSnapshotUpload(this, null);
        } catch (retryErr) {
          console.warn('IndexedDB retry before complete upload failed:', retryErr);
        }

        await uploadCompleteResults(context, sessionTimes, 'complete');

        const session = getResultsSession(this);
        if (session && session.sessionId) {
          try {
            await deleteResultsSnapshot(session.sessionId);
          } catch (deleteErr) {
            console.warn('Could not clear results snapshot after upload:', deleteErr);
          }
        }

        this.uploadError = '';
        this.uploadComplete = true;
        if (!this.prolificCompletionUrl) {
          this.$magpie.nextSlide();
        }
      } catch (e) {
        const message = e && e.message ? e.message : String(e);
        console.error('Results upload failed:', message);
        this.uploadError = message;
        throw e;
      } finally {
        this.saving = false;
      }
    },
    async submitSonaAndNext() {
      this.submitted = true;
      try {
        await this.exportAndNext();
      } catch (_) {
        this.submitted = false;
      }
    },
    async submitDirectAndNext() {
      this.submitted = true;
      try {
        await this.exportAndNext();
      } catch (_) {
        this.submitted = false;
      }
    }
  }
};
</script>
