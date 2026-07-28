<!-- Window is fixed, 102px, pointer cursor, gradual blurry effect on surrounding words. -->
<!--  Comprehension questions appear afterwards in the same slide -->
<!-- Click-to-reveal: unblur only while mouse button is held; record position, duration, and position relative to word. -->

<template>
  <Experiment title="Finger tracking for Reading" translate="no">

    <Screen :title="'Welcome'" class="instructions" :validations="{
        SubjectID: {
          minLength: $magpie.v.minLength(2)
        }
      }">
        <!-- <WelcomeScreen /> -->
        <div style="width: 40em; margin: auto;">

        <div style="background-color: lightgrey; padding: 10px;">
            <b>Letter of Information and Consent</b><br>
            Finger- and eye-tracking
        </div>
        <p>
          <b>Principal Investigator:</b><br>
          Dr. Victor Kuperman, Dept. of Linguistics and Languages<br>
          McMaster University; Email: vickup@mcmaster.ca, 905-525-9140 x20384
        <br><br>
          <b>Co-Investigator:</b><br>
          Dr. Emalie Hendel, Dept. of Linguistics and Languages<br>
          McMaster University, Email: hendele@mcmaster.ca
        <br><br>
          <b>Purpose of the Study:</b> The purpose of this study is to explore whether a new finger-tracking paradigm can accurately measure text reading behaviours. You are invited to participate in this study, which investigates a new finger-tracking paradigm during text reading. We hope to learn if finger-tracking can be used as a quick and accurate substitute for other measures of reading behaviours.
        <br><br>
          <b>What is finger-tracking?</b><br>
          Mouse-tracking uses an online platform to register the position on the screen where you click the mouse, and the duration for which you hold that position. In a mouse-tracking paradigm, all text is blurred until you click on a word. Upon clicking, a small, clear window appears, allowing you to read that portion of the text. You must continue clicking around the screen to read the entirety of the text. Mouse-click information can inform researchers about which words are being viewed and for how long. This allows researchers to investigate the cognitive processes used to read and understand written texts.
        <br><br>
          <b>What will happen during the study?</b><br>
          This experiment will take place online. You will be asked to provide some demographic information as well as information about your reading and language background. You will then read a series of texts which are presented with the blurred mouse-tracking method. Your mouse clicks will be recorded while you read the texts. After reading each text, you will be asked to answer some comprehension questions. The session will take approximately 30 minutes.
        <br><br>
          We will start by asking you to fill out a questionnaire consisting of personal information, such as age, gender, handedness, the presence of visual or reading problems, and such. Then you will proceed to a series of tests that will measure a selection of your reading habits, how you feel at the moment, and some general cognitive skills. These tests will be administered by the experimenter either orally or as questionnaires that you will need to fill in.
        <br><br>
          This experiment will take place online. Prior to beginning the experiment, you will be asked to give consent by reading this form and pressing a button. You will also be asked to fill out a demographic questionnaire asking about basic demographic information (e.g. age, gender, the presence of visual or reading problems) and language and reading background (e.g. languages spoken, age of acquisition of each language, number of hours spent reading per week in each language).
        <br><br>
          For the experiment, you will use your computer mouse to click through and read the texts on the screen. You will then answer the comprehension questions by using the keyboard.
        <br><br>
          <b>Potential Harms, Risks or Discomforts:</b><br>
          There are no known harms or risks associated with the usage of the mouse-tracking technology that we are employing. The present study does require you to sit still and remain focused for a considerable period of time. This study might require you to sit and look at a screen to read texts for up to 60 minutes, which may cause you to become fatigued. You may take a break at any time during the experiment. Also, you may feel upset or worried about your level of performance. We assure you that your best effort is always sufficient. Please note that in rare cases researchers who conduct the experiment may additionally have other academic or professional relationships with you. This may be a source of discomfort for you. It is your informed choice whether to volunteer for an experiment with a potential conflict of interest. If you choose to participate in this experiment and to sign the informed consent form below, you will have the right to withdraw without explanation or penalty, and with the full credit for the experiment (see explanation below).
        <br><br>
          <b>Potential Benefits:</b><br>
          The results of this research will not directly benefit you in any way. We hope to learn more about how words in English are processed.
        <br><br>
          <b>Incentive/Payment or Reimbursement:</b><br>
          Participants will earn a prorated hourly rate of 10 GBP for their participation in this study.
        <br><br>
          <b>Confidentiality:</b><br>
          All personal information we attain will remain highly confidential. Within this study, you will be identified as a participant number. Any personal information you provide will only be accessible to the principal investigators and co-investigators at McMaster, as well as research assistants. All information will be strictly secured in a locked cabinet or on a password-protected computer. No publication or discussion regarding this study will contain any personal and/or identifying information. As requested by the federal Tri-Council funding agencies and policies, we will retain your data for at least 5 years. Once out of active use, the electronic data will be archived on a secure server in the McMaster research lab.
        <br><br>
          <b>Participation and Withdrawal:</b><br>
          Your participation in this experiment is entirely optional and you can choose to leave at any time without penalization. If you wish to withdraw, you can let the researchers know and all of your data will be discarded. You are able to withdraw your data on or before August 31, 2027.
        <br><br>
          <b>Information about the Study Results:</b><br>
          If you have questions or need more information about the study itself, please contact Victor Kuperman at vickup@mcmaster.ca. Results of studies will also be publicized at https://readlab.humanities.mcmaster.ca/.
        <br><br>
          <b>Questions about the Study:</b><br>
          If you have questions or need more information about the study itself, please contact me at:
        <br><br>
          Dr. Victor Kuperman<br>
          vickup@mcmaster.ca
        <br><br>
          This study has been reviewed by the McMaster University Research Ethics Board#: 7316 and received ethics clearance. If you have concerns or questions about your rights as a participant or about the way the study is conducted, please contact: McMaster Research Ethics, Telephone: (905) 525-9140 ext. 23142, E-mail: mreb@mcmaster.ca.
        <br><br>
          <b>Consent:</b>
        </p>
        <div style="padding-left: 30px">• I have read and understood the information presented in the information letter about a study being conducted by Dr. Victor Kuperman and Dr. Emalie Hendel from McMaster University.</div>
        <div style="padding-left: 30px">• I have had the opportunity to ask questions about my involvement in this study and to receive additional details I requested.</div>
        <div style="padding-left: 30px">• By submitting responses for this experiment, I declare that I have read and agree to the terms presented in this information letter.</div>
        <div style="padding-left: 30px">• I understand that I may withdraw from the study before I submit my responses.</div>
        <div style="padding-left: 30px">• I understand that once responses are submitted, I can withdraw my data on or before August 31, 2027.</div>
        <div style="padding-left: 30px">• I agree to my data being published in an anonymized form, e.g., as part of a journal publication.</div>
        <div style="padding-left: 30px">• I understand that by signing below, I declare that I have read and agree to the terms presented in this information letter.</div>
        <div style="padding-left: 30px">• I have been given a copy of this form.</div>
        <div style="padding-left: 30px">• I agree to participate in the study.</div>
        <br>
        <p>Thank you for your help!</p>
        <br>

          <p>Please enter your Prolific ID</p>
          <p><input name="SonaID" type="text" class="obligatory" v-model="$magpie.measurements.SubjectID" placeholder="SONA ID"/></p>
          </div>
          <div v-if="
            $magpie.measurements.SubjectID&&
            !$magpie.validateMeasurements.SubjectID.$invalid
            ">
          <br> By clicking on the button below you consent to participating in this study: <br><br>
          <br />
          <button @click="recordSonaAndProceed">
            Proceed
          </button>

          </div>
        </Screen>


    <InstructionScreen :title="'Instruction'">
<!-- 
      <p>Please use the "Fullscreen Mode" for the duration of the experiment:
        <a href="javascript:void(0)" @click="turnOnFullScreen">Fullscreen Mode</a>
      </p>
 -->
      <p>In this study, you will read short texts and answer questions about them. However, unlike in normal reading, the texts will be blurred. <strong>Click and hold on the text to reveal it;</strong> the reveal stays fixed while you hold. Release to hide. Take as much time to read the text as you need in order to understand it. When you are done reading, answer the question at the bottom and click "next" to move on.</p>
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
          <template>
            <div v-if="showFirstDiv" class="readingText" @pointerdown="startReveal"  @pointermove="moveReveal"  @pointerup="endReveal"  @pointercancel="endReveal"  @pointerleave="endReveal" >
              <template v-for="(word, index) of trial.text.split(' ')">
                <span :key="index" :data-index="index + 1" >
                  {{ word }}
                </span>
              </template>
            </div>
            <div class="blurry-layer" style="opacity: 0.3; filter: blur(3.5px); transition: all 0.3s linear 0s;"> 
              {{trial.text}}
            </div>
          </template>
          <button v-if="showFirstDiv" style= "bottom:40%; transform: translate(-50%, -50%)" @click="toggleDivs" :disabled="!isCursorMoving">
          Done
          </button>

          <div v-else style = "position:absolute; bottom:15%; text-align: center; width: 100%; min-width: -webkit-fill-available;" >
            <template>
              <form>
                <!-- comprehension questions and the response options -->
                <div>{{ trial.question.replace(/ ?["]+/g, '') }}</div>
                <template v-for='(word, index) of trial.response_options'>
                  <input :id="'opt_'+index" type="radio" :value="word" name="opt" v-model="$magpie.measurements.response"/>{{ word }}<br/>
                    <!-- <label :for="'opt_'+index"> {{ word }}&nbsp</label> -->
                </template>
              </form>
            </template>
          </div>
          
          <button v-if="$magpie.measurements.response" style="transform: translate(-50%, -50%)" @click="recordResponse(trial); toggleDivs(); $magpie.saveAndNextScreen()">
            Next
          </button>
        </Slide>
      </Screen>
    </template>
<Screen>
  <p>1. Which input device are you using for this experiment?</p>
    <MultipleChoiceInput
        :response.sync= "$magpie.measurements.device"
        orientation="horizontal"
        :options="['Computer Mouse', 'Computer Trackpad', 'Other']" />
  <br>
  <br>
  <p>2. Which hand are you using during this experiment?</p>
    <MultipleChoiceInput
        :response.sync= "$magpie.measurements.hand"
        orientation="horizontal"
        :options="['Left', 'Right', 'Both']" />
  <button style= "bottom:30%; transform: translate(-50%, -50%)" @click="$magpie.saveAndNextScreen();">Submit</button>
</Screen>

    <ExportReportsScreen :skip-sona-input="true" />
    <CustomSubmitResultsScreen />
  </Experiment>
</template>

<script>
// Load data from csv files as javascript arrays with objects
import provo_list1 from '../trials/provo_items_list1.tsv';
import provo_list2 from '../trials/provo_items_list2.tsv';
import provo_list3 from '../trials/provo_items_list3.tsv';
import provo_practice from '../trials/provo_items_practice.tsv';
import _ from 'lodash';
import ExportReportsScreen from '../../demo/src/components/ExportReportsScreen.vue';
import CustomSubmitResultsScreen from './components/CustomSubmitResultsScreen.vue';

export default {
  name: 'App',
  components: { ExportReportsScreen, CustomSubmitResultsScreen },
  data() {
    const lists = [provo_list1, provo_list2, provo_list3];
    const chosenItems = lists[Math.floor(Math.random() * lists.length)]; // randomly choose one of the lists
    const shuffledItems = _.shuffle(chosenItems); 
    const trials = _.concat(provo_practice, shuffledItems);
    // Create a new column in localCoherences called 'response_options'
    // that concatenates the word in response_true with the two words in response_distractors
    const updatedTrials = trials.map(trial => {
      return {
        ...trial,
        response_options: _.shuffle(`${trial.response_true}|${trial.response_distractors}`.replace(/ ?["]+/g, "").split("|")),
      }
    });
    return {
      isCursorMoving: false,
      isClickHeld: false,
      trials: updatedTrials,
      currentIndex: null,
      showFirstDiv: true,
      mousePosition: {
          x: 0,
          y: 0,
        },
      // Click-start state for recording (only while click is held)
      clickStartTime: null,
      clickStartX: null,
      clickStartY: null,
      clickWordIndex: null,
      clickWord: null,
      clickWordRect: null,
      relativeXInWord: null,
      relativeYInWord: null,
      clickLineNumber: null,
      clickPositionInLine: null,
      interestAreasByIndex: {},
      lastItemId: null,
  }},
  computed: {
  },
  mounted() {
    document.addEventListener('mouseup', this.onRevealUp);
  },
  beforeDestroy() {
    document.removeEventListener('mouseup', this.onRevealUp);
  },
  methods: {
    getCharSizePx() {
      const span = this.$el.querySelector('.readingText span[data-index]');
      if (span) {
        const rect = span.getBoundingClientRect();
        const width = span.innerHTML.length > 0 ? rect.width / span.innerHTML.length : 10;
        return { width, height: rect.height };
      }
      return { width: 10, height: 20 };
    },
    getLineClosestTo(clientY) {
      const spans = this.$el.querySelectorAll('.readingText span[data-index]');
      if (!spans.length) return null;
      let best = null;
      let bestDist = Infinity;
      for (let i = 0; i < spans.length; i++) {
        const rect = spans[i].getBoundingClientRect();
        const lineCenter = (rect.top + rect.bottom) / 2;
        const dist = Math.abs(lineCenter - clientY);
        if (dist < bestDist) {
          bestDist = dist;
          best = { lineTop: rect.top, lineBottom: rect.bottom, lineHeight: rect.height };
        }
      }
      return best;
    },
    computeInterestAreas() {
      const spans = this.$el.querySelectorAll('.readingText span[data-index]');
      if (!spans.length) {
        this.interestAreasByIndex = {};
        return;
      }

      const items = [];
      let maxHeight = 0;
      spans.forEach(span => {
        const rect = span.getBoundingClientRect();
        const index = Number(span.getAttribute('data-index'));
        items.push({ index, rect });
        if (rect.height > maxHeight) maxHeight = rect.height;
      });

      // Group spans into lines using a vertical tolerance.
      const tol = 3;
      const byLine = {};
      for (const it of items) {
        const key = Math.round(it.rect.top / tol) * tol;
        if (!byLine[key]) byLine[key] = [];
        byLine[key].push(it);
      }

      const lines = Object.values(byLine)
        .map(line => line.sort((a, b) => a.rect.left - b.rect.left))
        .sort((a, b) => a[0].rect.top - b[0].rect.top);

      const areas = {};

      // Compute vertical boundaries that tile the space between lines:
      // - between lines: use midpoints
      // - before first line / after last line: use half a line-gap.
      const lineBounds = lines.map(lineItems => {
        const tops = lineItems.map(li => li.rect.top);
        const bottoms = lineItems.map(li => li.rect.bottom);
        return {
          top: Math.min(...tops),
          bottom: Math.max(...bottoms)
        };
      });

      const lineVerticals = [];
      if (lineBounds.length === 1) {
        // Single line: fall back to a small margin based on maxHeight.
        const lb = lineBounds[0];
        const top = lb.top - 0.5 * maxHeight;
        const bottom = lb.bottom + 0.5 * maxHeight;
        lineVerticals.push({ top, bottom });
      } else {
        const mids = [];
        for (let i = 0; i < lineBounds.length - 1; i++) {
          mids.push((lineBounds[i].bottom + lineBounds[i + 1].top) / 2);
        }

        for (let k = 0; k < lineBounds.length; k++) {
          let top;
          let bottom;
          if (k === 0) {
            const gap = lineBounds[1].top - lineBounds[0].bottom;
            top = lineBounds[0].top - gap / 2;
            bottom = mids[0];
          } else if (k === lineBounds.length - 1) {
            const gap = lineBounds[k].top - lineBounds[k - 1].bottom;
            top = mids[k - 1];
            bottom = lineBounds[k].bottom + gap / 2;
          } else {
            top = mids[k - 1];
            bottom = mids[k];
          }
          lineVerticals.push({ top, bottom });
        }
      }

      const { width: baseCharWidth } = this.getCharSizePx();
      const charWidth = baseCharWidth && Number.isFinite(baseCharWidth) ? baseCharWidth : 10;

      lines.forEach((lineItems, lineIdx) => {
        const n = lineItems.length;
        if (!n) return;

        const vBounds = lineVerticals[lineIdx];

        for (let i = 0; i < n; i++) {
          const curr = lineItems[i].rect;
          const idx = lineItems[i].index;

          let left;
          let right;

          const isFirstLine = (lineIdx === 0);
          const isLastLine = (lineIdx === lines.length - 1);

          if (n === 1) {
            // Single word on this line
            left = curr.left;
            right = curr.right;
            if (isFirstLine) {
              left -= charWidth / 2;
            }
            if (isLastLine) {
              right += charWidth / 2;
            }
          } else if (i === 0) {
            const next = lineItems[i + 1].rect;
            const midNext = (curr.right + next.left) / 2;
            left = curr.left;
            right = midNext;
            if (isFirstLine) {
              left -= charWidth / 2;
            }
          } else if (i === n - 1) {
            const prev = lineItems[i - 1].rect;
            const midPrev = (prev.right + curr.left) / 2;
            left = midPrev;
            right = curr.right;
            if (isLastLine) {
              right += charWidth / 2;
            }
          } else {
            const prev = lineItems[i - 1].rect;
            const next = lineItems[i + 1].rect;
            left = (prev.right + curr.left) / 2;
            right = (curr.right + next.left) / 2;
          }

          const top = vBounds.top;
          const bottom = vBounds.bottom;

          areas[idx] = {
            left,
            right,
            top,
            bottom,
            lineNumber: lineIdx + 1
          };
        }

        const firstIdx = lineItems[0].index;
        const lineStartX = areas[firstIdx].left;
        lineItems.forEach(it => {
          areas[it.index].lineStartX = lineStartX;
        });
      });

      this.interestAreasByIndex = areas;
    },
    changeBack() {
      if (this.isClickHeld) {
        this.finishClick(performance.now());
      }
      const oval = this.$el.querySelector(".oval-cursor");
      if (oval) {
        oval.classList.remove('grow');
        oval.classList.remove('blank');
        oval.style.width = '0px';
        oval.style.height = '0px';
      }
      this.currentIndex = null;
      this.isClickHeld = false;
    },
    onRevealDown(e) {
      if (this.isClickHeld) return;
      this.isCursorMoving = true;
      this.isClickHeld = true;
      const x = e.clientX;
      const y = e.clientY;
      this.clickStartTime = performance.now();
      this.clickStartX = x;
      this.clickStartY = y;

      const oval = this.$el.querySelector(".oval-cursor");
      if (oval) {
        oval.classList.add('grow');
      }
      const { width: charWidth } = this.getCharSizePx();
      const line = this.getLineClosestTo(y);
      const charsLeft = 4;
      const charsRight = 14;
      const totalChars = charsLeft + charsRight;
      const ovalWidthPx = totalChars * charWidth;
      const ovalHeightPx = line ? line.lineHeight : 20;
      const ovalCenterY = line ? (line.lineTop + line.lineBottom) / 2 : y;
      oval.style.width = `${ovalWidthPx}px`;
      oval.style.height = `${ovalHeightPx}px`;
      oval.style.left = `${x + (charsRight - charsLeft) / 2 * charWidth}px`;
      oval.style.top = `${ovalCenterY}px`;

      // Detect new text (ItemId change) and reset interest areas.
      const itemInput = this.$el.querySelector(".item_id");
      if (itemInput) {
        const itemId = itemInput.value;
        if (this.lastItemId === null || this.lastItemId !== itemId) {
          this.interestAreasByIndex = {};
          this.lastItemId = itemId;
        }
      }

      // Ensure interest areas are computed.
      if (!this.interestAreasByIndex || !Object.keys(this.interestAreasByIndex).length) {
        this.computeInterestAreas();
      }

      let ia = null;
      let iaIndex = null;
      for (const key of Object.keys(this.interestAreasByIndex)) {
        const a = this.interestAreasByIndex[key];
        if (x >= a.left && x <= a.right && y >= a.top && y <= a.bottom) {
          ia = a;
          iaIndex = Number(key);
          break;
        }
      }

      if (ia && iaIndex != null) {
        oval.classList.remove('blank');
        const index = iaIndex;
        const span = this.$el.querySelector(`.readingText span[data-index="${index}"]`);
        const wordText = span ? span.innerHTML : null;

        this.clickWordIndex = index;
        this.clickWord = wordText;
        this.clickWordRect = { top: ia.top, left: ia.left, bottom: ia.bottom, right: ia.right };

        const width = ia.right - ia.left;
        const height = ia.bottom - ia.top;
        this.relativeXInWord = width > 0 ? (x - ia.left) / width : null;
        this.relativeYInWord = height > 0 ? (y - ia.top) / height : null;

        const { lineNumber, positionInLine } = this.getWordLineAndPositionInLine(index);
        this.clickLineNumber = lineNumber;
        this.clickPositionInLine = positionInLine;
        this.currentIndex = index;
      } else {
        oval.classList.add('blank');
        this.clickWordIndex = -1;
        this.clickWord = null;
        this.clickWordRect = null;
        this.relativeXInWord = null;
        this.relativeYInWord = null;
        this.clickLineNumber = null;
        this.clickPositionInLine = null;
        this.currentIndex = -1;
      }
    },
    getWordLineAndPositionInLine(wordIndex) {
      const spans = this.$el.querySelectorAll('.readingText span[data-index]');
      if (!spans.length) return { lineNumber: null, positionInLine: null };
      const items = [];
      for (let i = 0; i < spans.length; i++) {
        const rect = spans[i].getBoundingClientRect();
        const idx = spans[i].getAttribute('data-index');
        items.push({ index: idx, top: rect.top, left: rect.left });
      }
      const tol = 3;
      const byLine = {};
      for (const it of items) {
        const key = Math.round(it.top / tol) * tol;
        if (!byLine[key]) byLine[key] = [];
        byLine[key].push(it);
      }
      const lines = Object.keys(byLine).map(k => byLine[k]).sort((a, b) => a[0].top - b[0].top);
      for (let l = 0; l < lines.length; l++) {
        lines[l].sort((a, b) => a.left - b.left);
        for (let p = 0; p < lines[l].length; p++) {
          if (String(lines[l][p].index) === String(wordIndex)) {
            return { lineNumber: l + 1, positionInLine: p + 1 };
          }
        }
      }
      return { lineNumber: null, positionInLine: null };
    },
    onRevealUp() {
      if (!this.isClickHeld) return;
      this.finishClick(performance.now());
      const oval = this.$el.querySelector(".oval-cursor");
      if (oval) {
        oval.classList.remove('grow');
        oval.classList.remove('blank');
        oval.style.width = '0px';
        oval.style.height = '0px';
      }
      this.isClickHeld = false;
      this.currentIndex = null;
    },
    finishClick(endTime) {
      const expEl = this.$el.querySelector(".experiment_id");
      if (!expEl) return;
      const durationMs = this.clickStartTime != null ? endTime - this.clickStartTime : null;
      const subjectId =
        this.$magpie && this.$magpie.measurements && this.$magpie.measurements.SubjectID
          ? this.$magpie.measurements.SubjectID
          : '';
      const trialIndexEl = this.$el.querySelector(".trial_index");
      const presentationOrder = trialIndexEl && trialIndexEl.value !== '' ? parseInt(trialIndexEl.value, 10) : null;
      const spans = this.$el.querySelectorAll('.readingText span[data-index]');
      const totalWordsInItem = spans && spans.length ? spans.length : null;
      const allWords = spans && spans.length ? Array.from(spans).map((s) => s.innerHTML).join(' ') : null;
      const payload = {
        Experiment: expEl.value,
        Condition: this.$el.querySelector(".condition_id").value,
        ItemId: this.$el.querySelector(".item_id").value,
        presentation_order: presentationOrder,
        Index: this.clickWordIndex !== null && this.clickWordIndex !== -1 ? parseInt(this.clickWordIndex, 10) : this.clickWordIndex,
        Word: this.clickWord,
        mousePositionX: this.clickStartX,
        mousePositionY: this.clickStartY,
        clickDurationMs: durationMs,
        relativeXInWord: this.relativeXInWord,
        relativeYInWord: this.relativeYInWord,
        totalWordsInItem: totalWordsInItem,
        allWords: allWords,
        SubjectId: subjectId,
        SubjectID: subjectId,
        SonaId: subjectId
      };
      if (this.clickWordRect) {
        payload.wordPositionTop = this.clickWordRect.top;
        payload.wordPositionLeft = this.clickWordRect.left;
        payload.wordPositionBottom = this.clickWordRect.bottom;
        payload.wordPositionRight = this.clickWordRect.right;
      }
      if (this.clickLineNumber != null) payload.line_number = this.clickLineNumber;
      if (this.clickPositionInLine != null) payload.position_in_line = this.clickPositionInLine;
      $magpie.addTrialData(payload);
      this.clickStartTime = null;
      this.clickStartX = null;
      this.clickStartY = null;
      this.clickWordIndex = null;
      this.clickWord = null;
      this.clickWordRect = null;
      this.relativeXInWord = null;
      this.relativeYInWord = null;
      this.clickLineNumber = null;
      this.clickPositionInLine = null;
    },
    moveCursor(e) {
      if (this.isClickHeld) return;
      let x = e.clientX;
      let y = e.clientY;
      const elementAtCursor = document.elementFromPoint(x, y) && document.elementFromPoint(x, y).closest('span');
      if (elementAtCursor) {
        this.currentIndex = elementAtCursor.getAttribute('data-index');
      } else {
        const elementAboveCursor = document.elementFromPoint(x, y - 3) && document.elementFromPoint(x, y - 3).closest('span');
        if (elementAboveCursor) {
          this.currentIndex = elementAboveCursor.getAttribute('data-index');
        } else {
          this.currentIndex = -1;
        }
      }
      this.$el.querySelector(".oval-cursor").style.left = `${x + 12}px`;
      this.$el.querySelector(".oval-cursor").style.top = `${y - 6}px`;
      this.mousePosition.x = e.clientX;
      this.mousePosition.y = e.clientY;
    },
    toggleDivs() {
    this.showFirstDiv = !this.showFirstDiv;
    this.isCursorMoving = false;
    },
    getScreenDimensions() {
      return {
        window_inner_width: window.innerWidth,
        window_inner_height: window.innerHeight
      };
    },
    recordSonaAndProceed() {
      const id = (this.$magpie && this.$magpie.measurements && this.$magpie.measurements.SubjectID) ? String(this.$magpie.measurements.SubjectID).trim() : '';
      this.$magpie.addExpData({
        SubjectId: id,
        SubjectID: id,
        SonaId: id,
        SONAId: id,
        experiment_start_time: new Date().toISOString()
      });
      this.$magpie.addTrialData({
        SONAId: id,
        SubjectId: id,
        SubjectID: id,
        SonaId: id,
        source: 'welcome'
      });
      this.$magpie.nextScreen();
    },
    recordResponse(trial) {
      const m = this.$magpie && this.$magpie.measurements ? this.$magpie.measurements : null;
      if (!m || !m.response) return;
      const itemId = trial.item_id != null ? trial.item_id : trial.ItemId;
      const selectedResponse = String(m.response).trim();
      const correctAnswer = trial && trial.response_true != null ? String(trial.response_true).replace(/ ?["]+/g, '').trim() : '';
      const responseCorrect = correctAnswer !== '' ? (selectedResponse === correctAnswer ? '1' : '0') : '';
      this.$magpie.addTrialData({
        ItemId: itemId,
        response: selectedResponse,
        response_correct: responseCorrect
      });
    },
    onTouchStart(e) {
    const touch = e.touches[0];
    const touchOffsetY = 20;
    this.onRevealDown({
      clientX: touch.clientX,
      clientY: touch.clientY - touchOffsetY
    });
  },

  onTouchMove(e) {
    const touch = e.touches[0];
    const touchOffsetY = 20;
    this.updateTouchReveal({
      clientX: touch.clientX,
      clientY: touch.clientY - touchOffsetY
    });
  },

  updateTouchReveal(e) {
    const x = e.clientX;
    const y = e.clientY;

    this.fakeCursorX = x;
    this.fakeCursorY = y;

    const oval = this.$el.querySelector(".oval-cursor");
    if (!oval) return;

    const { width: charWidth } = this.getCharSizePx();
    const line = this.getLineClosestTo(y);
    const charsLeft = 4;
    const charsRight = 14;
    const totalChars = charsLeft + charsRight;
    const ovalWidthPx = totalChars * charWidth;
    const ovalHeightPx = line ? line.lineHeight : 20;
    const ovalCenterY = line ? (line.lineTop + line.lineBottom) / 2 : y;

    oval.style.left = `${x + (charsRight - charsLeft) / 2 * charWidth}px`;
    oval.style.top = `${ovalCenterY}px`;
    oval.style.width = `${ovalWidthPx}px`;
    oval.style.height = `${ovalHeightPx}px`;
  },
    onTouchEnd() {
      this.changeBack();
    }
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
  .debugResults{
    width: 100%;
  }
  .readingText {
    /* z-index: 1; */
    position: absolute;
    color: white;
    text-align: left;
    font-weight: 450;
    cursor: pointer;
    padding-top: 2%;
    padding-bottom: 2%;
    padding-left: 11%;
    padding-right: 11%;
  }
  button {
    position: absolute;
    bottom: 0;
    left: 50%;
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
    user-select: none; /* Standard syntax */
    -webkit-user-select: none; /* Safari */
    -moz-user-select: none; /* Firefox */
    -ms-user-select: none; /* Internet Explorer/Edge */
    }
</style>

<style scoped>
/* Styles for tablets */
@media (max-width: 900px) {
  .instructions div[style*="width: 40em"] {
    width: 90% !important;
  }

  .main_screen {
    font-size: 1.1em; /* Make text a bit bigger on smaller screens */
  }
}
</style>
