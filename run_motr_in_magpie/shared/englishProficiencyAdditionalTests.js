/** Accepted tests and scores for optional additional English proficiency question. */
export const ENGLISH_PROFICIENCY_ADDITIONAL_TESTS = [
  {
    id: 'CEFR',
    label: 'CEFR',
    type: 'discrete',
    values: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
  },
  {
    id: 'TOEFL_2026',
    label: 'TOEFL (2026)',
    type: 'discrete',
    values: [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6],
  },
  {
    id: 'TOEFL',
    label: 'TOEFL',
    type: 'range',
    min: 0,
    max: 120,
  },
  {
    id: 'IELTS',
    label: 'IELTS',
    type: 'discrete',
    values: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9],
  },
  {
    id: 'Duolingo',
    label: 'Duolingo',
    type: 'range',
    min: 10,
    max: 160,
  },
  {
    id: 'OTHER',
    label: 'Other',
    type: 'free',
  },
];

export function findEnglishProficiencyTest(testId) {
  return ENGLISH_PROFICIENCY_ADDITIONAL_TESTS.find((t) => t.id === testId) || null;
}

export function englishProficiencyScoreHint(test) {
  if (!test) return '';
  if (test.type === 'free') {
    return 'Enter your test result.';
  }
  if (test.type === 'range') {
    return `Enter a whole number from ${test.min} to ${test.max}.`;
  }
  if (test.id === 'CEFR') {
    return `Enter one of: ${test.values.join(', ')}.`;
  }
  return `Enter one of: ${test.values.join(', ')}.`;
}

export function isValidEnglishProficiencyScore(test, rawScore) {
  if (!test) return false;
  const score = String(rawScore ?? '').trim();
  if (!score) return false;

  if (test.type === 'free') return true;

  if (test.type === 'range') {
    const n = Number(score);
    if (!Number.isFinite(n) || !Number.isInteger(n)) return false;
    return n >= test.min && n <= test.max;
  }

  if (test.id === 'CEFR') {
    const normalized = score.toUpperCase();
    return test.values.some((v) => v.toUpperCase() === normalized);
  }

  const n = Number(score);
  if (!Number.isFinite(n)) return false;
  return test.values.some((v) => Math.abs(Number(v) - n) < 1e-9);
}
