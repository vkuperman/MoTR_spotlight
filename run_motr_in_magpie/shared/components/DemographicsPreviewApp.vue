<template>
  <div class="motr-root">
    <Experiment title="Demographics preview (OneStop)" translate="no">
      <Screen title="Demographics" class="instructions" key="demographics-preview">
        <p style="width: 40em; margin: 0 auto 1em; text-align: center; color: #666; font-size: 0.9em;">
          Preview mode — complete the questionnaire below. Responses are logged to the browser console only (not uploaded).
        </p>
        <DemographicsOneStopQuestionnaire @complete="onDemographicsComplete" />
      </Screen>
      <Screen title="Preview complete" class="instructions" key="demographics-preview-done">
        <div style="width: 40em; margin: auto; text-align: center;">
          <p>Demographics questionnaire complete.</p>
          <p style="color: #666; font-size: 0.9em;">Open the browser console (F12) to inspect submitted fields.</p>
          <p style="margin-top: 1.5em;">
            <a :href="fullStudyUrl">Open full study</a>
          </p>
        </div>
      </Screen>
    </Experiment>
  </div>
</template>

<script>
import DemographicsOneStopQuestionnaire from './DemographicsOneStopQuestionnaire.vue';

export default {
  name: 'DemographicsPreviewApp',
  components: { DemographicsOneStopQuestionnaire },
  computed: {
    fullStudyUrl() {
      const url = new URL(window.location.href);
      url.searchParams.delete('preview');
      if (url.hash === '#demographics-preview' || url.hash === '#preview=demographics') {
        url.hash = '';
      }
      return url.toString();
    },
  },
  methods: {
    onDemographicsComplete() {
      const rows = this.$magpie.getAllData ? this.$magpie.getAllData() : [];
      const demo = rows.filter((r) => r && r.source === 'demographics_onestop');
      // eslint-disable-next-line no-console
      console.log('[demographics preview] submitted data:', demo.length ? demo[demo.length - 1] : rows);
      this.$magpie.saveAndNextScreen();
    },
  },
};
</script>
