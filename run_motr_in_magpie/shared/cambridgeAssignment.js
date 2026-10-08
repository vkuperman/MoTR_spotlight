/**
 * Reading level pair is chosen at random. The Cambridge score is recorded
 * separately and does not choose the pair.
 *
 * Three pairs, then the existing block shuffle, give six presentation orders:
 * elementary|intermediate, intermediate|elementary,
 * intermediate|advanced, advanced|intermediate,
 * elementary|advanced, advanced|elementary.
 */
const LEVEL_PAIRS = [
  ['elementary', 'intermediate'],
  ['intermediate', 'advanced'],
  ['elementary', 'advanced'],
];

export function levelPairForCambridgeScore(score) {
  void score;
  const levelPair = LEVEL_PAIRS[Math.floor(Math.random() * LEVEL_PAIRS.length)].slice();
  return {
    levelPair,
    assignmentRule: 'random_level_pair',
  };
}
