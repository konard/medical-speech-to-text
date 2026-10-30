import { it, expect } from 'test-anywhere';
import { Parser } from 'links-notation';
import { provenanceLinks } from '../examples/speech-provenance.js';

it('preserves source identity and quoted Unicode text in actual Links Notation', () => {
  const run = {
    schema: 'speech-lab/v1',
    results: [
      {
        index: 0,
        status: 'complete',
        name: 'a.wav',
        audio: { sha256: 'a'.repeat(64) },
        model: { id: 'test/model', revision: 'b'.repeat(40) },
        text: 'No "allergy". (否)',
        words: [{ text: 'No', start: 0, end: 0.2 }],
      },
    ],
  };
  const parsed = new Parser().parse(provenanceLinks(run));
  expect(parsed[0].id).toBe('run-0');
  const fields = Object.fromEntries(
    parsed[0].values.map((link) => [link.id, link.values])
  );
  expect(fields.audio[0].id).toBe(`sha256:${'a'.repeat(64)}`);
  expect(fields.rawText[0].id).toBe(run.results[0].text);
  expect(fields.model[0].id).toBe('test/model');
  expect(fields.revision[0].id).toBe(run.results[0].model.revision);
  expect(fields.word[0].values[0].values[0].id).toBe('No');
  let refused = false;
  try {
    provenanceLinks({ schema: 'unknown', results: [] });
  } catch {
    refused = true;
  }
  expect(refused).toBe(true);
});
