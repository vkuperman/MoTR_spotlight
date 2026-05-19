<template>
  <Screen v-if="!$magpie.debug" title="Submitting">
    <Slide>
      <p>{{ $t('screens.SubmitResultsScreen.waiting') }}</p>
      <Wait :time="0" @done="submit(() => $magpie.nextSlide())" />
    </Slide>
    <Slide>
      <p v-if="!error">
        Thank you for participating in our study. Follow this URL to complete your submission and be redirected to Prolific:
        <a href="https://app.prolific.com/submissions/complete?cc=C1FQEQTP" target="_blank" rel="noopener">
          https://app.prolific.com/submissions/complete?cc=C1FQEQTP
        </a>
        <Wait :time="3000" @done="redirectToCompletionUrl" />
      </p>
      <div v-else>
        <p>{{ $t('screens.SubmitResultsScreen.error') }}</p>
        <p>{{ $t('screens.SubmitResultsScreen.manual') }}</p>
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
      <p>
        Thank you for participating in our study. Follow this URL to complete your submission and be redirected to Prolific:
        <a href="https://app.prolific.com/submissions/complete?cc=C1FQEQTP" target="_blank" rel="noopener">
          https://app.prolific.com/submissions/complete?cc=C1FQEQTP
        </a>
      </p>
    </Slide>
  </Screen>
</template>

<script>
import stringify from 'csv-stringify/lib/sync';

export default {
  name: 'CustomSubmitResultsScreen',
  data() {
    return {
      error: null,
      results: [],
      csv: ''
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
            header: true
          });
        }
        this.error = err.message;
        cb();
      }
    },
    redirectToCompletionUrl() {
      if (this.$magpie.completionUrl && this.$magpie.mode === 'prolific') {
        window.location = this.$magpie.completionUrl;
      }
    }
  }
};
</script>
