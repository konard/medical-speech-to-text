/** Deterministic research normalization; decimals and negations remain meaningful. */
export function normalize(text) {
  if (typeof text !== 'string' || text.length > 10000) {
    throw new Error('Transcript must be a string of at most 10000 characters');
  }
  return text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}'.\s]/gu, ' ')
    .replace(/(?<!\d)\.|\.(?!\d)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Levenshtein with S/D/I counts, linear memory; ties prefer substitution. */
function distance(reference, hypothesis) {
  let previous = Array.from({ length: hypothesis.length + 1 }, (_, i) => [
    i,
    0,
    0,
    i,
  ]);
  for (let i = 1; i <= reference.length; i++) {
    const current = [[i, 0, i, 0]];
    for (let j = 1; j <= hypothesis.length; j++) {
      if (reference[i - 1] === hypothesis[j - 1]) {
        current[j] = previous[j - 1];
      } else {
        const [cost, s, d, ins] = previous[j - 1];
        const candidates = [
          [cost + 1, s + 1, d, ins],
          [
            previous[j][0] + 1,
            previous[j][1],
            previous[j][2] + 1,
            previous[j][3],
          ],
          [
            current[j - 1][0] + 1,
            current[j - 1][1],
            current[j - 1][2],
            current[j - 1][3] + 1,
          ],
        ];
        current[j] = candidates.reduce((a, b) => (b[0] < a[0] ? b : a));
      }
    }
    previous = current;
  }
  const [errors, substitutions, deletions, insertions] =
    previous[hypothesis.length];
  return {
    errors,
    substitutions,
    deletions,
    insertions,
    referenceLength: reference.length,
    rate: reference.length ? errors / reference.length : errors ? null : 0,
  };
}

export function scoreTranscript(reference, hypothesis) {
  if (reference === undefined || reference === null) {
    return null;
  }
  const ref = normalize(reference);
  const hyp = normalize(hypothesis);
  return {
    word: distance(ref ? ref.split(' ') : [], hyp ? hyp.split(' ') : []),
    character: distance(
      Array.from(ref.replace(/ /g, '')),
      Array.from(hyp.replace(/ /g, ''))
    ),
  };
}

export function aggregateScores(scores) {
  const known = scores.filter(Boolean);
  const result = { scored: known.length };
  for (const unit of ['word', 'character']) {
    const errors = known.reduce((sum, s) => sum + s[unit].errors, 0);
    const referenceLength = known.reduce(
      (sum, s) => sum + s[unit].referenceLength,
      0
    );
    result[unit] = {
      errors,
      referenceLength,
      rate: referenceLength
        ? errors / referenceLength
        : known.length && !errors
          ? 0
          : null,
    };
  }
  return result;
}
