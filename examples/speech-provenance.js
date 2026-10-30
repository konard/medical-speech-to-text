import { Link } from 'links-notation';

const field = (key, value) => new Link(key, [new Link(String(value))]);

/** Interchange only: does not create a durable graph database or clinical record. */
export function provenanceLinks(payload) {
  if (
    payload?.schema !== 'speech-lab/v1' ||
    !Array.isArray(payload.results) ||
    payload.results.length > 20
  ) {
    throw new Error('Expected a speech-lab/v1 batch of at most 20 results');
  }
  return `${payload.results
    .filter((result) => result.status === 'complete')
    .map((result, index) => {
      if (
        !/^[a-f0-9]{64}$/.test(result.audio?.sha256) ||
        typeof result.text !== 'string' ||
        !result.model?.id
      ) {
        throw new Error(
          'Complete results require audio identity, model and raw text'
        );
      }
      return new Link(`run-${index}`, [
        field('audio', `sha256:${result.audio.sha256}`),
        field('filename', result.name),
        field('model', result.model.id),
        field('revision', result.model.revision),
        field('rawText', result.text),
        ...(result.words || []).map(
          (word, i) =>
            new Link('word', [
              new Link(`word-${i}`, [
                field('text', word.text),
                field('start', word.start),
                field('end', word.end),
              ]),
            ])
        ),
      ]).toString();
    })
    .join('\n')}\n`;
}
