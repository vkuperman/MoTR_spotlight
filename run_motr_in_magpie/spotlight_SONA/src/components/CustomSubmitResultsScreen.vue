<template>
  <Screen v-if="!$magpie.debug" title="Submitting">
    <Slide>
      <p>{{ $t('screens.SubmitResultsScreen.waiting') }}</p>
      <Wait :time="0" @done="submit(() => $magpie.nextSlide())" />
    </Slide>
    <Slide>
      <p v-if="!error">
        Thank you for participating in our study. You may now close this window.
      </p>
      <div v-else>
        <p>{{ $t('screens.SubmitResultsScreen.error') }}</p>
        <p>{{ $t('screens.SubmitResultsScreen.manual') }}</p>
        <p v-if="csv">
          <button type="button" @click="downloadResults">Download results</button>
        </p>
        <p>
          {{ $t('screens.SubmitResultsScreen.contact') }}
          <a :href="'mailto:' + $magpie.contactEmail" target="_blank" rel="noopener">
            {{ $magpie.contactEmail }}
          </a>
        </p>
      </div>
    </Slide>
  </Screen>
  <Screen v-else title="Submitting">
    <Slide>
      <p>Thank you for participating in our study. You may now close this window.</p>
    </Slide>
  </Screen>
</template>

<script>
import stringify from 'csv-stringify/lib/sync';
import { downloadResultsFiles } from '@motr-shared/resultsSafeguard';

export default {
  name: 'CustomSubmitResultsScreen',
  data() {
    return {
      error: null,
      results: [],
      csv: '',
    };
  },
  methods: {
    async submit(cb) {
      try {
        await this.$magpie.submit();
        cb();
      } catch (err) {
        this.results = this.$magpie.getAllData();
        if (this.results.length) {
          this.csv = stringify(this.results, {
            columns: Object.keys(this.results[0]),
            header: true,
          });
        }
        this.error = err.message;
        cb();
      }
    },
    async downloadResults() {
      if (!this.csv) return;
      await downloadResultsFiles(
        [{ name: 'trial_data.csv', content: this.csv }],
        'motr_results_backup'
      );
    },
  },
};
</script>
