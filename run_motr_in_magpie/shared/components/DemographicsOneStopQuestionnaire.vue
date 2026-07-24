<template>
  <div style="width: 40em; margin: auto; text-align: left;">
    <h3 style="margin-top: 0;">Demographics for OneStop</h3>

    <!-- Step 1: Basic information -->
    <div v-if="step === 0">
      <p>
        <label><strong>1. What is your age? (numeric answers only)</strong> <span style="color: #c00;">*</span><br>
          <input v-model="form.age" type="number" min="1" max="120" class="obligatory" style="width: 6em;" />
        </label>
      </p>
      <p>
        <label><strong>2. What country do you currently reside in?</strong> <span style="color: #c00;">*</span><br>
          <input v-model="form.country" type="text" class="obligatory" style="width: 100%;" />
        </label>
      </p>
      <p>
        <label><strong>3. What is your native language?</strong> <span style="color: #c00;">*</span><br>
          <input v-model="form.nativeLanguage" type="text" class="obligatory" style="width: 100%;" />
        </label>
      </p>
      <p>
        <label><strong>4. List all other languages you speak</strong> (separated by comma in order of most use). If you speak only one language, answer N/A. <span style="color: #c00;">*</span><br>
          <input v-model="form.otherLanguages" type="text" class="obligatory" style="width: 100%;" />
        </label>
      </p>
    </div>

    <!-- Step 2: Language exposure -->
    <div v-else-if="step === 1">
      <p><strong>Language exposure</strong></p>
      <p>What percentage of the time are you currently (on average) exposed to your languages? (All percentages in this section should add to 100%.)</p>
      <p v-if="stepError" style="color: #c00;">{{ stepError }}</p>
      <p v-for="(row, idx) in pctLanguageRows" :key="'exp-' + row.key">
        <label>
          <strong>{{ pctQuestionNumber(5, idx) }}. {{ row.label }}</strong>
          <span style="color: #c00;">*</span><br>
          <input
            v-model="form.pctExposure[row.key]"
            type="number"
            min="0"
            max="100"
            style="width: 6em;"
          /> %
        </label>
      </p>
      <p style="font-size: 0.9em; color: #555;">Current total: {{ exposureSum }}%</p>
    </div>

    <!-- Step 3: Reading language choice -->
    <div v-else-if="step === 2">
      <p><strong>Reading language choice</strong></p>
      <p>When choosing to read a text available in your languages, in what percentage of cases would you choose to read it in each language? Assume the original was written in another language unknown to you. (All percentages should add to 100%.)</p>
      <p v-if="stepError" style="color: #c00;">{{ stepError }}</p>
      <p v-for="(row, idx) in pctLanguageRows" :key="'read-' + row.key">
        <label>
          <strong>{{ pctQuestionNumber(10, idx) }}. {{ row.label }}</strong>
          <span style="color: #c00;">*</span><br>
          <input
            v-model="form.pctRead[row.key]"
            type="number"
            min="0"
            max="100"
            style="width: 6em;"
          /> %
        </label>
      </p>
      <p style="font-size: 0.9em; color: #555;">Current total: {{ readSum }}%</p>
    </div>

    <!-- Step 4: Speaking language choice -->
    <div v-else-if="step === 3">
      <p><strong>Speaking language choice</strong></p>
      <p>When choosing a language to speak with a person who is equally fluent in all your languages, what percentage of the time would you choose each language? (All percentages should add to 100%.)</p>
      <p v-if="stepError" style="color: #c00;">{{ stepError }}</p>
      <p v-for="(row, idx) in pctLanguageRows" :key="'speak-' + row.key">
        <label>
          <strong>{{ pctQuestionNumber(15, idx) }}. {{ row.label }}</strong>
          <span style="color: #c00;">*</span><br>
          <input
            v-model="form.pctSpeak[row.key]"
            type="number"
            min="0"
            max="100"
            style="width: 6em;"
          /> %
        </label>
      </p>
      <p style="font-size: 0.9em; color: #555;">Current total: {{ speakSum }}%</p>
    </div>

    <!-- Step 5: Education -->
    <div v-else-if="step === 4">
      <p><strong>Education</strong></p>
      <p v-if="stepError" style="color: #c00;">{{ stepError }}</p>
      <p>
        <label><strong>20. How many years of formal education do you have? (numeric answers only)</strong> <span style="color: #c00;">*</span><br>
          <input v-model="form.formalEducationYears" type="number" min="0" max="50" style="width: 6em;" />
        </label>
      </p>
      <p>
        <label><strong>21. How many full years have you spent in your current educational institution (0, 1, 2…)? (numeric answers only)</strong> <span style="color: #c00;">*</span><br>
          <input v-model="form.yearsCurrentInstitution" type="number" min="0" max="50" style="width: 6em;" />
        </label>
      </p>
      <p>
        <strong>22. Please select your highest education level</strong> (or approximate Canadian equivalent) <span style="color: #c00;">*</span>
      </p>
      <template v-for="level in educationLevels">
        <label :key="level" style="display: block; margin: 0.35em 0;">
          <input type="radio" :value="level" v-model="form.highestEducation" />
          {{ level }}
        </label>
      </template>
    </div>

    <!-- Step 6: Native language proficiency -->
    <div v-else-if="step === 5">
      <p><strong>{{ nativeLanguageLabel }} proficiency</strong></p>
      <p>On a scale from 1–10, please enter your proficiency in {{ nativeLanguageLabel }} in the following areas (1 = lowest, 10 = highest).</p>
      <p v-if="stepError" style="color: #c00;">{{ stepError }}</p>
      <p>
        <label><strong>23. Speaking</strong> <span style="color: #c00;">*</span><br>
          <input v-model="form.nativeSpeaking" type="number" min="1" max="10" step="1" style="width: 6em;" />
        </label>
      </p>
      <p>
        <label><strong>24. Understanding</strong> <span style="color: #c00;">*</span><br>
          <input v-model="form.nativeUnderstanding" type="number" min="1" max="10" step="1" style="width: 6em;" />
        </label>
      </p>
      <p>
        <label><strong>25. Reading</strong> <span style="color: #c00;">*</span><br>
          <input v-model="form.nativeReading" type="number" min="1" max="10" step="1" style="width: 6em;" />
        </label>
      </p>
    </div>

    <!-- Step 7: English proficiency and acquisition (skipped if native language is English) -->
    <div v-else-if="step === 6 && !nativeIsEnglish">
      <p><strong>English</strong></p>
      <p>On a scale from 1–10, please enter your proficiency in English in the following areas (1 = lowest, 10 = highest).</p>
      <p v-if="stepError" style="color: #c00;">{{ stepError }}</p>
      <p>
        <label><strong>26. Speaking</strong> <span style="color: #c00;">*</span><br>
          <input v-model="form.englishSpeaking" type="number" min="1" max="10" step="1" style="width: 6em;" />
        </label>
      </p>
      <p>
        <label><strong>27. Understanding</strong> <span style="color: #c00;">*</span><br>
          <input v-model="form.englishUnderstanding" type="number" min="1" max="10" step="1" style="width: 6em;" />
        </label>
      </p>
      <p>
        <label><strong>28. Reading</strong> <span style="color: #c00;">*</span><br>
          <input v-model="form.englishReading" type="number" min="1" max="10" step="1" style="width: 6em;" />
        </label>
      </p>
      <p>
        <label><strong>29. At what age did you begin acquiring English? (numeric answers only)</strong> <span style="color: #c00;">*</span><br>
          <input v-model="form.englishAcquireStartAge" type="number" min="0" max="120" style="width: 6em;" />
        </label>
      </p>
      <p>
        <label><strong>30. At what age did you become fluent in English? (numeric answers only)</strong> <span style="color: #c00;">*</span><br>
          <input v-model="form.englishFluentAge" type="number" min="0" max="120" style="width: 6em;" />
        </label>
      </p>
      <p>
        <label><strong>31. At what age did you begin reading in English? (numeric answers only)</strong> <span style="color: #c00;">*</span><br>
          <input v-model="form.englishReadStartAge" type="number" min="0" max="120" style="width: 6em;" />
        </label>
      </p>
      <p>
        <label><strong>32. At what age did you begin reading fluently in English? (numeric answers only)</strong> <span style="color: #c00;">*</span><br>
          <input v-model="form.englishReadFluentAge" type="number" min="0" max="120" style="width: 6em;" />
        </label>
      </p>
    </div>

    <!-- Step 8: Optional additional English proficiency test -->
    <div v-else-if="step === otherEnglishTestStepIndex">
      <p v-if="stepError" style="color: #c00;">{{ stepError }}</p>
      <p>
        <strong>33. If you know your level of English proficiency as measured by another test, please enter it here.</strong>
      </p>
      <p style="display: flex; flex-wrap: wrap; gap: 1em; align-items: flex-end;">
        <label style="flex: 1 1 12em;">
          Test<br>
          <select v-model="form.otherEnglishTest" style="width: 100%; max-width: 16em;" @change="onOtherEnglishTestChange">
            <option value="">— Select a test —</option>
            <option v-for="test in englishProficiencyTests" :key="test.id" :value="test.id">
              {{ test.label }}
            </option>
          </select>
        </label>
        <label v-if="otherEnglishTestIsOther" style="flex: 1 1 12em;">
          Test name<br>
          <input
            v-model="form.otherEnglishTestName"
            type="text"
            placeholder="Name of test"
            style="width: 100%; max-width: 16em;"
          />
        </label>
        <label style="flex: 1 1 12em;">
          Score<br>
          <input
            v-model="form.otherEnglishTestScore"
            :type="otherEnglishTestScoreInputType"
            :min="otherEnglishTestScoreMin"
            :max="otherEnglishTestScoreMax"
            :step="otherEnglishTestScoreStep"
            :disabled="!selectedOtherEnglishTest"
            style="width: 100%; max-width: 16em;"
          />
        </label>
      </p>
      <p v-if="selectedOtherEnglishTest" style="font-size: 0.9em; color: #555;">
        {{ otherEnglishTestScoreHint }}
      </p>
    </div>

    <p style="text-align: center; margin-top: 2rem;">
      <button v-if="step > 0" type="button" style="margin-right: 1em;" @click="prevStep">Back</button>
      <button type="button" :disabled="!canAdvance" @click="nextStep">
        {{ step === totalSteps - 1 ? 'Continue' : 'Next' }}
      </button>
    </p>
  </div>
</template>

<script>
import {
  ENGLISH_PROFICIENCY_ADDITIONAL_TESTS,
  findEnglishProficiencyTest,
  englishProficiencyScoreHint,
  isValidEnglishProficiencyScore,
} from '../englishProficiencyAdditionalTests.js';

const EDUCATION_LEVELS = [
  'Less than high school',
  'High school',
  'Some post-secondary',
  'Post-secondary',
  "Bachelor's",
  "Master's",
  'PhD',
];

const NATIVE_KEY = '__native__';
const ENGLISH_KEY = '__english__';

function emptyForm() {
  return {
    age: '',
    country: '',
    nativeLanguage: '',
    otherLanguages: '',
    pctExposure: {},
    pctRead: {},
    pctSpeak: {},
    formalEducationYears: '',
    yearsCurrentInstitution: '',
    highestEducation: '',
    nativeSpeaking: '',
    nativeUnderstanding: '',
    nativeReading: '',
    englishSpeaking: '',
    englishUnderstanding: '',
    englishReading: '',
    englishAcquireStartAge: '',
    englishFluentAge: '',
    englishReadStartAge: '',
    englishReadFluentAge: '',
    otherEnglishTest: '',
    otherEnglishTestName: '',
    otherEnglishTestScore: '',
  };
}

function normalizeLangName(name) {
  return String(name || '').trim().toLowerCase();
}

function isEnglishName(name) {
  const n = normalizeLangName(name);
  return n === 'english' || n === 'en';
}

function parseOtherLanguages(raw, nativeLanguage) {
  const text = String(raw || '').trim();
  if (!text || /^n\/?a$/i.test(text)) return [];

  const nativeNorm = normalizeLangName(nativeLanguage);
  const seen = new Set();
  const out = [];

  for (const part of text.split(',')) {
    const lang = part.trim();
    if (!lang) continue;
    if (isEnglishName(lang)) continue;
    if (nativeNorm && normalizeLangName(lang) === nativeNorm) continue;
    const key = normalizeLangName(lang);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(lang);
  }
  return out;
}

function pctSumFromObject(obj, keys) {
  return keys.reduce((sum, key) => {
    const v = obj && obj[key];
    return sum + (v === '' || v == null ? 0 : Number(v));
  }, 0);
}

function isFilledNumber(v) {
  return v !== '' && v != null && !Number.isNaN(Number(v));
}

function isFilledText(v) {
  return v != null && String(v).trim() !== '';
}

function isScale(v) {
  const n = Number(v);
  return Number.isInteger(n) && n >= 1 && n <= 10;
}

function pctMapToExportString(obj, rows) {
  return rows.map((row) => `${row.label}:${obj[row.key] != null ? obj[row.key] : ''}`).join('|');
}

export default {
  name: 'DemographicsOneStopQuestionnaire',
  data() {
    return {
      step: 0,
      stepError: '',
      educationLevels: EDUCATION_LEVELS,
      englishProficiencyTests: ENGLISH_PROFICIENCY_ADDITIONAL_TESTS,
      form: emptyForm(),
      syncedLanguageKeys: '',
    };
  },
  computed: {
    nativeLanguageLabel() {
      const label = String(this.form.nativeLanguage || '').trim();
      return label || 'Native language';
    },
    nativeIsEnglish() {
      return isEnglishName(this.form.nativeLanguage);
    },
    otherLanguageList() {
      return parseOtherLanguages(this.form.otherLanguages, this.form.nativeLanguage);
    },
    showEnglishInPctSections() {
      return !this.nativeIsEnglish;
    },
    pctLanguageRows() {
      const rows = [
        { key: NATIVE_KEY, label: this.nativeLanguageLabel },
      ];
      if (this.showEnglishInPctSections) {
        rows.push({ key: ENGLISH_KEY, label: 'English' });
      }
      for (const lang of this.otherLanguageList) {
        rows.push({ key: lang, label: lang });
      }
      return rows;
    },
    pctRowKeys() {
      return this.pctLanguageRows.map((r) => r.key);
    },
    totalSteps() {
      return this.nativeIsEnglish ? 7 : 8;
    },
    otherEnglishTestStepIndex() {
      return this.totalSteps - 1;
    },
    selectedOtherEnglishTest() {
      return findEnglishProficiencyTest(this.form.otherEnglishTest);
    },
    otherEnglishTestIsOther() {
      return this.form.otherEnglishTest === 'OTHER';
    },
    otherEnglishTestScoreHint() {
      return englishProficiencyScoreHint(this.selectedOtherEnglishTest);
    },
    otherEnglishTestScoreInputType() {
      const test = this.selectedOtherEnglishTest;
      if (!test) return 'text';
      if (test.type === 'free' || test.id === 'CEFR') return 'text';
      return 'number';
    },
    otherEnglishTestScoreMin() {
      const test = this.selectedOtherEnglishTest;
      return test && test.type === 'range' ? test.min : undefined;
    },
    otherEnglishTestScoreMax() {
      const test = this.selectedOtherEnglishTest;
      return test && test.type === 'range' ? test.max : undefined;
    },
    otherEnglishTestScoreStep() {
      const test = this.selectedOtherEnglishTest;
      if (!test || test.type === 'range' || test.type === 'free') return undefined;
      if (test.id === 'CEFR') return undefined;
      return 0.5;
    },
    exposureSum() {
      return pctSumFromObject(this.form.pctExposure, this.pctRowKeys);
    },
    readSum() {
      return pctSumFromObject(this.form.pctRead, this.pctRowKeys);
    },
    speakSum() {
      return pctSumFromObject(this.form.pctSpeak, this.pctRowKeys);
    },
    canAdvance() {
      return this.validateStep(this.step, false);
    },
  },
  methods: {
    pctQuestionNumber(base, index) {
      return base + index;
    },
    onOtherEnglishTestChange() {
      this.form.otherEnglishTestName = '';
      this.form.otherEnglishTestScore = '';
    },
    syncPctFields() {
      const keys = this.pctRowKeys;
      const keySig = keys.join('|');
      if (keySig === this.syncedLanguageKeys) return;

      const preserve = (prev, nextKeys) => {
        const next = {};
        for (const key of nextKeys) {
          next[key] = prev && prev[key] != null ? prev[key] : '';
        }
        return next;
      };

      this.form.pctExposure = preserve(this.form.pctExposure, keys);
      this.form.pctRead = preserve(this.form.pctRead, keys);
      this.form.pctSpeak = preserve(this.form.pctSpeak, keys);
      this.syncedLanguageKeys = keySig;
    },
    validatePctSection(pctObj, sum, setError, label) {
      for (const key of this.pctRowKeys) {
        if (!isFilledNumber(pctObj[key])) {
          if (setError) this.stepError = `Please enter a percentage for every language in the ${label} section.`;
          return false;
        }
      }
      if (sum !== 100) {
        if (setError) this.stepError = 'Percentages in this section should add to 100%.';
        return false;
      }
      return true;
    },
    validateStep(stepIndex, setError = true) {
      if (setError) this.stepError = '';
      const f = this.form;

      if (stepIndex === 0) {
        if (!isFilledNumber(f.age) || !isFilledText(f.country) || !isFilledText(f.nativeLanguage) || !isFilledText(f.otherLanguages)) {
          if (setError) this.stepError = 'Please complete all required fields.';
          return false;
        }
        return true;
      }

      if (stepIndex === 1) {
        return this.validatePctSection(f.pctExposure, this.exposureSum, setError, 'language exposure');
      }

      if (stepIndex === 2) {
        return this.validatePctSection(f.pctRead, this.readSum, setError, 'reading language choice');
      }

      if (stepIndex === 3) {
        return this.validatePctSection(f.pctSpeak, this.speakSum, setError, 'speaking language choice');
      }

      if (stepIndex === 4) {
        if (!isFilledNumber(f.formalEducationYears) || !isFilledNumber(f.yearsCurrentInstitution) || !isFilledText(f.highestEducation)) {
          if (setError) this.stepError = 'Please complete all education fields.';
          return false;
        }
        return true;
      }

      if (stepIndex === 5) {
        if (!isScale(f.nativeSpeaking) || !isScale(f.nativeUnderstanding) || !isScale(f.nativeReading)) {
          if (setError) this.stepError = 'Please enter a whole number from 1 to 10 for each skill.';
          return false;
        }
        return true;
      }

      if (stepIndex === 6 && !this.nativeIsEnglish) {
        if (
          !isScale(f.englishSpeaking)
          || !isScale(f.englishUnderstanding)
          || !isScale(f.englishReading)
          || !isFilledNumber(f.englishAcquireStartAge)
          || !isFilledNumber(f.englishFluentAge)
          || !isFilledNumber(f.englishReadStartAge)
          || !isFilledNumber(f.englishReadFluentAge)
        ) {
          if (setError) this.stepError = 'Please complete all English proficiency and age fields.';
          return false;
        }
        return true;
      }

      if (stepIndex === this.otherEnglishTestStepIndex) {
        const hasTest = isFilledText(f.otherEnglishTest);
        const hasScore = isFilledText(f.otherEnglishTestScore);
        const hasOtherName = isFilledText(f.otherEnglishTestName);
        if (!hasTest && !hasScore && !hasOtherName) return true;
        if (!hasTest && (hasScore || hasOtherName)) {
          if (setError) this.stepError = 'Please select a test for the information you entered.';
          return false;
        }
        if (f.otherEnglishTest === 'OTHER') {
          if (!hasOtherName) {
            if (setError) this.stepError = 'Please enter the name of your test, or clear the test selection.';
            return false;
          }
          if (!hasScore) {
            if (setError) this.stepError = 'Please enter your score, or clear the test selection.';
            return false;
          }
          if (!isValidEnglishProficiencyScore(this.selectedOtherEnglishTest, f.otherEnglishTestScore)) {
            if (setError) this.stepError = this.otherEnglishTestScoreHint || 'Please enter a valid score for the selected test.';
            return false;
          }
          return true;
        }
        if (hasTest && !hasScore) {
          if (setError) this.stepError = 'Please enter a score for the selected test, or clear the test selection.';
          return false;
        }
        if (!isValidEnglishProficiencyScore(this.selectedOtherEnglishTest, f.otherEnglishTestScore)) {
          if (setError) this.stepError = this.otherEnglishTestScoreHint || 'Please enter a valid score for the selected test.';
          return false;
        }
        return true;
      }

      return true;
    },
    prevStep() {
      this.stepError = '';
      if (this.step > 0) this.step -= 1;
    },
    nextStep() {
      if (!this.validateStep(this.step, true)) return;
      this.stepError = '';

      if (this.step === 0) {
        this.syncPctFields();
      }

      if (this.step < this.totalSteps - 1) {
        this.step += 1;
        return;
      }
      this.submitAndComplete();
    },
    submitAndComplete() {
      const f = this.form;
      const rows = this.pctLanguageRows;
      const payload = {
        source: 'demographics_onestop',
        demo_age: f.age,
        demo_country: f.country,
        demo_native_language: f.nativeLanguage,
        demo_other_languages: f.otherLanguages,
        demo_other_languages_parsed: this.otherLanguageList.join('|'),
        demo_exposure_pcts: pctMapToExportString(f.pctExposure, rows),
        demo_exposure_total_pct: this.exposureSum,
        demo_read_pcts: pctMapToExportString(f.pctRead, rows),
        demo_read_total_pct: this.readSum,
        demo_speak_pcts: pctMapToExportString(f.pctSpeak, rows),
        demo_speak_total_pct: this.speakSum,
        demo_formal_education_years: f.formalEducationYears,
        demo_years_current_institution: f.yearsCurrentInstitution,
        demo_highest_education: f.highestEducation,
        demo_native_speaking: f.nativeSpeaking,
        demo_native_understanding: f.nativeUnderstanding,
        demo_native_reading: f.nativeReading,
      };

      if (!this.nativeIsEnglish) {
        Object.assign(payload, {
          demo_english_speaking: f.englishSpeaking,
          demo_english_understanding: f.englishUnderstanding,
          demo_english_reading: f.englishReading,
          demo_english_acquire_start_age: f.englishAcquireStartAge,
          demo_english_fluent_age: f.englishFluentAge,
          demo_english_read_start_age: f.englishReadStartAge,
          demo_english_read_fluent_age: f.englishReadFluentAge,
        });
      }

      if (isFilledText(f.otherEnglishTest) && isFilledText(f.otherEnglishTestScore)) {
        const test = findEnglishProficiencyTest(f.otherEnglishTest);
        if (f.otherEnglishTest === 'OTHER') {
          payload.demo_other_english_test = String(f.otherEnglishTestName).trim();
        } else {
          payload.demo_other_english_test = test ? test.label : f.otherEnglishTest;
        }
        payload.demo_other_english_test_score = String(f.otherEnglishTestScore).trim();
      }

      this.$magpie.addTrialData(payload);
      this.$emit('complete');
    },
  },
};
</script>
