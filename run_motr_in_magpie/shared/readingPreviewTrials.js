import _ from 'lodash';

/** Practice trials only — for reading preview URLs. */
export function preparePreviewReadingTrials(practiceTrials) {
  const items = Array.isArray(practiceTrials) ? practiceTrials : [];
  return items.map((trial) => ({
    ...trial,
    response_options: _.shuffle(
      `${trial.response_true}|${trial.response_distractors}`.replace(/ ?["]+/g, '').split('|')
    ),
  }));
}
