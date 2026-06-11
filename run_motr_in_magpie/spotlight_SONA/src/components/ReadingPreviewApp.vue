<template>
  <div class="motr-root">
    <div v-if="!stimuliReady" class="instructions" style="padding: 2rem; text-align: center;">
      <p>Loading preview…</p>
    </div>
    <Experiment v-else title="Reading preview (SONA)" translate="no">
      <InstructionScreen :title="'Instruction'">
        <p style="color: #666; font-size: 0.9em; text-align: center; margin-bottom: 1.25em;">
          Preview mode — no data is uploaded or saved.
        </p>
        <p>
          In this study, you will read short texts and answer questions about them. However, unlike in normal reading,
          the texts will be blurred. <strong>Move your mouse over the text to reveal it with the spotlight;</strong>
          the revealed area follows your mouse. Take as much time to read the text as you need in order to understand it.
          When you are done reading, answer the question at the bottom and click "next" to move on.
        </p>
      </InstructionScreen>

      <template v-for="(trial, i) of trials">
        <Screen :key="i" class="main_screen" :progress="i / trials.length">
          <Slide>
            <form>
              <input type="hidden" class="item_id" :value="trial.item_id">
              <input type="hidden" class="experiment_id" :value="trial.experiment_id">
              <input type="hidden" class="condition_id" :value="trial.condition_id">
              <input type="hidden" class="trial_index" :value="i + 1">
            </form>
            <div class="oval-cursor"></div>
            <template v-if="showFirstDiv">
              <div class="readingText" @mousemove="onRevealHover" @mouseleave="changeBack">
                <template v-for="(word, index) of trial.text.split(' ')">
                  <span :key="index" :data-index="index + 1">
                    {{ word }}
                  </span>
                </template>
              </div>
              <div class="blurry-layer" style="opacity: 0.3; filter: blur(3.5px); transition: all 0.3s linear 0s;">
                {{ trial.text }}
              </div>
              <div class="reading-text-spacer" aria-hidden="true">{{ trial.text }}</div>
            </template>

            <div v-if="!showFirstDiv" class="trial-comprehension-panel">
              <form>
                <div>{{ (trial.question || '').replace(/ ?["]+/g, '') }}</div>
                <template v-for="(word, index) of trial.response_options">
                  <input :id="'opt_'+index" type="radio" :value="word" name="opt" v-model="$magpie.measurements.response"/>{{ word }}<br/>
                </template>
              </form>
            </div>

            <div class="trial-actions">
              <button v-if="showFirstDiv" type="button" class="trial-done-btn" @click="toggleDivs" :disabled="!isCursorMoving">
                Done
              </button>
              <button v-if="!showFirstDiv && $magpie.measurements.response" type="button" class="trial-next-btn" @click="submitTrialResponse(trial, i)">
                Next
              </button>
            </div>
          </Slide>
        </Screen>
      </template>

      <Screen title="Preview complete" class="instructions" key="reading-preview-done">
        <div style="width: 40em; margin: auto; text-align: center;">
          <p>Reading preview complete.</p>
          <p style="color: #666; font-size: 0.9em;">No results were uploaded or saved.</p>
          <p style="margin-top: 1.5em;">
            <a :href="fullStudyUrl">Open full study</a>
          </p>
        </div>
      </Screen>
    </Experiment>
  </div>
</template>

<script>
import spotlight_practice from '../../trials/spotlight_items_practice.tsv';
import { preparePreviewReadingTrials } from '@motr-shared/readingPreviewTrials';
import spotlightReadingMixin from '@motr-shared/spotlightReadingMixin';

export default {
  name: 'ReadingPreviewApp',
  mixins: [spotlightReadingMixin],
  data() {
    return {
      stimuliReady: false,
      trials: [],
    };
  },
  computed: {
    fullStudyUrl() {
      const url = new URL(window.location.href);
      url.searchParams.delete('preview');
      url.searchParams.delete('noUpload');
      const hash = url.hash.replace(/^#/, '');
      if (hash === 'reading-preview' || hash === 'preview=reading') {
        url.hash = '';
      }
      return url.toString();
    },
  },
  created() {
    this.trials = preparePreviewReadingTrials(spotlight_practice);
    this.stimuliReady = true;
  },
};
</script>

<style>
  .experiment {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .main_screen {
    isolation: isolate;
    position: relative;
    width: 100%;
    height: auto;
    font-size: 18px;
    line-height: 40px;
  }
  .reading-text-spacer {
    visibility: hidden;
    pointer-events: none;
    color: black;
    text-align: left;
    font-weight: 450;
    padding-top: 2%;
    padding-bottom: 2%;
    padding-left: 11%;
    padding-right: 11%;
  }
  .trial-actions {
    padding: 1.25rem 0 0.5rem;
    text-align: center;
  }
  .readingText {
    position: absolute;
    color: white;
    text-align: left;
    font-weight: 450;
    cursor: pointer;
    padding-top: 2%;
    padding-bottom: 2%;
    padding-left: 11%;
    padding-right: 11%;
    pointer-events: auto;
  }
  button {
    position: absolute;
    bottom: 0;
    left: 50%;
  }
  .trial-actions .trial-done-btn,
  .trial-actions .trial-next-btn {
    position: relative;
    bottom: auto;
    left: auto;
    transform: none;
    z-index: 3;
    display: inline-block;
    margin: 0 auto;
  }
  .trial-comprehension-panel {
    margin-top: 1.25rem;
    padding: 0.75rem 11% 0.25rem;
    text-align: center;
    width: 100%;
    box-sizing: border-box;
  }
  .oval-cursor {
    position: fixed;
    z-index: 2;
    width: 0;
    height: 0;
    transform: translate(-50%, -50%);
    background-color: white;
    mix-blend-mode: difference;
    border-radius: 50%;
    pointer-events: none;
    transition: none;
  }
  .oval-cursor.grow {
    border-radius: 50%;
    box-shadow: 30px 0 8px -4px rgba(255, 255, 255, 0.1), -30px 0 8px -4px rgba(255, 255, 255, 0.1);
    background-color: rgba(255, 255, 255, 0.3);
    background-blend-mode: screen;
    pointer-events: none;
    filter: blur(3px);
  }
  .oval-cursor.grow::before {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 70%;
    height: 70%;
    background-color: white;
    mix-blend-mode: normal;
    border-radius: 50%;
  }
  .blurry-layer {
    position: absolute;
    pointer-events: none;
    color: black;
    text-align: left;
    font-weight: 450;
    padding-top: 2%;
    padding-bottom: 2%;
    padding-left: 11%;
    padding-right: 11%;
  }
  * {
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
  }
</style>
