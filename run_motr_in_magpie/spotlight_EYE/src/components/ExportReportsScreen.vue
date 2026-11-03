<template>
  <Screen title="Thank you">
    <Slide v-if="saving && !uploadError && !downloadComplete">
      <p>Saving your results…</p>
    </Slide>
    <Slide v-else-if="uploadError && !downloadComplete">
      <p>Could not save your results automatically. Please download them below.</p>
      <p style="font-size: 0.9em; color: #666;">{{ uploadError }}</p>
      <div style="margin-top: 1.5em;">
        <button type="button" @click="downloadResults">Download results</button>
        <button type="button" style="margin-left: 0.75em;" @click="retrySave">Retry</button>
      </div>
    </Slide>
    <Slide v-else-if="downloadComplete || uploadComplete">
      <p v-if="downloadComplete">Your results ZIP was downloaded to this computer.</p>
      <p v-else>Your results were saved.</p>
      <p v-if="uploadComplete && downloadComplete" style="margin-top: 0.75em;">
        Server upload also succeeded.
      </p>
      <p v-else-if="uploadError" style="margin-top: 0.75em; font-size: 0.9em; color: #666;">
        {{ uploadError }}
      </p>
      <div style="margin-top: 1.5em;">
        <button
          v-if="downloadFiles && downloadFiles.length"
          type="button"
          @click="downloadResults"
        >
          Download results again
        </button>
      </div>
      <p v-if="prolificCompletionUrl" style="margin-top: 1.5em;">
        Return to Prolific:
        <a :href="prolificCompletionUrl" target="_blank" rel="noopener">{{ prolificCompletionUrl }}</a>
      </p>
    </Slide>
    <Slide v-else>
      <p>Thank you for participating! You may now close this window.</p>
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
} from '@motr-shared/resultsSafeguard';
import { deleteResultsSnapshot } from '@motr-shared/resultsIndexedDb';
import { uploadResultsFiles } from '@motr-shared/resultsUpload';

function buildCompleteUploadFiles(context, sessionTimes) {
  const files = buildCompleteResultsFiles(
    context.allRows,
    context.participantId,
    context.expData,
    sessionTimes
  );
  const trialsCompleted = context.session && Array.isArray(context.session.trialsCompleted)
    ? context.session.trialsCompleted
    : [];
  const uploadFiles = trialsCompleted.length > 0
    ? files.filter((file) => file.name !== 'raw_position_samples.csv')
    : files.slice();
  uploadFiles.push({
    name: 'session_complete.json',
    content: JSON.stringify({
      sessionId: context.sessionId,
      participantId: context.participantId,
      folderName: context.folderName,
      completedAt: new Date().toISOString(),
      trialsCompleted: trialsCompleted.slice().sort((a, b) => a - b),
      rawPositionInPartialCheckpoints: trialsCompleted.length > 0,
    }, null, 2),
  });
  return uploadFiles;
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
      uploadComplete: false,
      downloadComplete: false,
      uploadError: '',
      saving: false,
      downloadFiles: null,
      downloadFolderName: '',
    };
  },
  async mounted() {
    try {
      await retryPendingSnapshotUpload(this, null);
    } catch (err) {
      console.warn('Pending snapshot retry on mount failed:', err);
    }
    await this.exportAndNext();
  },
  methods: {
    async downloadResults() {
      if (!this.downloadFiles || !this.downloadFiles.length) return;
      await downloadResultsFiles(this.downloadFiles, this.downloadFolderName);
      this.downloadComplete = true;
    },
    async retrySave() {
      this.uploadError = '';
      this.uploadComplete = false;
      this.downloadComplete = false;
      await this.exportAndNext();
    },
    async exportAndNext() {
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

      const hasData = files.some((file) => file.content);
      if (!hasData) {
        this.uploadError = 'No experiment data to save.';
        return;
      }

      this.saving = true;
      this.uploadError = '';
      try {
        // Always download so local testing gets a ZIP without a dedicated Eye upload API.
        await downloadResultsFiles(files, context.folderName);
        this.downloadComplete = true;

        if (context.uploadUrl) {
          let recoveredFromSnapshot = false;
          try {
            recoveredFromSnapshot = await retryPendingSnapshotUpload(this, null);
          } catch (retryErr) {
            console.warn('IndexedDB retry before complete upload failed:', retryErr);
          }

          if (!recoveredFromSnapshot) {
            await uploadResultsFiles(
              context.uploadUrl,
              context.participantId,
              context.folderName,
              buildCompleteUploadFiles(context, sessionTimes),
              context.isTest,
              context.githubResultsPath || this.githubResultsPath,
              'complete'
            );
          }

          const session = getResultsSession(this);
          if (session && session.sessionId) {
            try {
              await deleteResultsSnapshot(session.sessionId);
            } catch (deleteErr) {
              console.warn('Could not clear results snapshot after upload:', deleteErr);
            }
          }
          this.uploadComplete = true;
        }
      } catch (e) {
        const message = e && e.message ? e.message : String(e);
        console.error('Results save failed:', message);
        if (!this.downloadComplete) {
          this.uploadError = message;
        } else {
          this.uploadError = `Download succeeded, but upload failed: ${message}`;
        }
      } finally {
        this.saving = false;
      }
    },
  },
};
</script>
