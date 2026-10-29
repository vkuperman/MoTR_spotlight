const CONFIGURED_LEVELS = {
  elementary: 'elementary',
  intermediate: 'intermediate',
  advanced: 'advanced',
};

function normalizeLevelPair(entry) {
  const levels = entry && Array.isArray(entry.levels) ? entry.levels : entry;
  if (!Array.isArray(levels) || levels.length !== 2) return null;
  const pair = levels.map((level) => CONFIGURED_LEVELS[String(level || '').trim().toLowerCase()]);
  if (pair.some((level) => !level) || pair[0] === pair[1]) return null;
  return pair;
}

/**
 * Level pairs listed on a study config. Absent config keeps Cambridge assignment.
 * A listed pair is used only when `enabled` is not false.
 */
export function enabledLevelPairsFromConfig(levelPairs) {
  if (!Array.isArray(levelPairs)) return null;
  return levelPairs
    .filter((entry) => !entry || entry.enabled !== false)
    .map(normalizeLevelPair)
    .filter(Boolean);
}

/**
 * Cambridge score → reading level pair, unless the study config enables fixed pairs.
 * The Cambridge score is still recorded by the caller either way.
 */
export function levelPairForCambridgeScore(score, options = {}) {
  const configuredPairs = enabledLevelPairsFromConfig(options.levelPairs);
  if (configuredPairs) {
    const chosen = configuredPairs.length
      ? configuredPairs[Math.floor(Math.random() * configuredPairs.length)]
      : ['elementary', 'advanced'];
    if (!configuredPairs.length) {
      // eslint-disable-next-line no-console
      console.warn('No level pairs are enabled; using elementary-advanced.');
    }
    const levelPair = chosen.slice();
    return {
      levelPair,
      assignmentRule: `enabled_level_pair_${levelPair.join('_')}`,
    };
  }

  if (score <= 14) {
    return {
      levelPair: ['elementary', 'intermediate'],
      assignmentRule: 'cambridge_0_14_elementary_intermediate',
    };
  }
  if (score >= 22) {
    return {
      levelPair: ['intermediate', 'advanced'],
      assignmentRule: 'cambridge_22_25_intermediate_advanced',
    };
  }
  const middlePairs = [
    {
      levelPair: ['elementary', 'intermediate'],
      assignmentRule: 'cambridge_15_21_random_elementary_intermediate',
    },
    {
      levelPair: ['intermediate', 'advanced'],
      assignmentRule: 'cambridge_15_21_random_intermediate_advanced',
    },
  ];
  return middlePairs[Math.floor(Math.random() * middlePairs.length)];
}
