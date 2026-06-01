/**
 * Cambridge score → reading level pair (adjacent levels only).
 */
export function levelPairForCambridgeScore(score) {
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
