import { describe, it, expect } from 'test-anywhere';
import {
  scoreTranscript,
  aggregateScores,
  parseReferences,
  validateFiles,
  validateWords,
  activeWord,
  commandProposal,
  runBatch,
} from '../src/speech/index.js';

const rejects = (fn, pattern) => {
  let message = '';
  try {
    fn();
  } catch (error) {
    message = error.message;
  }
  expect(pattern.test(message)).toBe(true);
};

describe('speech research acceptance', () => {
  it('counts substitutions, deletions, insertions without erasing medical numbers', () => {
    const score = scoreTranscript(
      'No allergy. Take 0.5 mg daily.',
      'Allergy take 5 mg daily now'
    );
    expect(score.word.errors).toBe(3);
    expect(score.word.referenceLength).toBe(6);
    expect(score.word.rate).toBe(0.5);
    expect(scoreTranscript('Aspirin', 'aspirin.').word.rate).toBe(0);
    expect(scoreTranscript('0.5', '05').word.errors).toBe(1);
    expect(scoreTranscript('15', '50').character.errors).toBe(2);
  });
  it('distinguishes missing references, silence and inserted speech', () => {
    expect(scoreTranscript(undefined, 'hello')).toBe(null);
    expect(scoreTranscript('', '').word.rate).toBe(0);
    const insertion = scoreTranscript('', 'hallucination');
    expect(insertion.word.errors).toBe(1);
    expect(insertion.word.rate).toBe(null);
    const aggregate = aggregateScores([
      scoreTranscript('one two', 'one'),
      insertion,
      null,
    ]);
    expect(aggregate.word.rate).toBe(1);
    expect(aggregate.scored).toBe(2);
  });
  it('imports exact filenames safely, preserving empty references', () => {
    const refs = parseReferences('{"a.wav":"", "b.wav":"No allergy"}');
    expect(refs['a.wav']).toBe('');
    expect(Object.getPrototypeOf(refs)).toBe(null);
    rejects(() => parseReferences('{"x.wav":3}'), /string/);
    rejects(() => parseReferences('[]'), /object/);
    rejects(() => parseReferences('{"__proto__":"x"}'), /filename/);
    rejects(() => parseReferences('{"a.wav":"x","a.wav":"y"}'), /duplicate/);
    rejects(
      () => parseReferences('{"a.wav":"x","\\u0061.wav":"y"}'),
      /duplicate/
    );
  });
  it('rejects oversized or ambiguous batches before decoding', () => {
    const file = { name: 'one.wav', size: 100, type: 'audio/wav' };
    expect(validateFiles([file]).length).toBe(1);
    rejects(() => validateFiles([]), /1.*20/);
    rejects(
      () =>
        validateFiles(
          Array.from({ length: 21 }, (_, i) => ({ ...file, name: `${i}.wav` }))
        ),
      /20/
    );
    rejects(() => validateFiles([file, file]), /duplicate/);
    rejects(() => validateFiles([{ ...file, size: 26 * 1024 * 1024 }]), /25/);
    rejects(
      () =>
        validateFiles(
          Array.from({ length: 5 }, (_, i) => ({
            name: `${i}.wav`,
            size: 25 * 1024 * 1024,
          }))
        ),
      /100/
    );
    rejects(
      () => validateFiles([{ ...file, name: 'x.html', type: 'text/html' }]),
      /audio/
    );
  });
  it('highlights only actual timed words and leaves gaps inactive', () => {
    const words = validateWords(
      [
        null,
        { text: ' No', timestamp: [0, 0.3] },
        { text: ' overlap', timestamp: [0.2, 0.4] },
        { text: ' allergy', timestamp: [0.5, 1] },
        { text: ' today', timestamp: [1, null] },
      ],
      2
    );
    expect(words.length).toBe(2);
    expect(activeWord(words, 0)).toBe(0);
    expect(activeWord(words, 0.3)).toBe(-1);
    expect(activeWord(words, 0.5)).toBe(1);
    expect(activeWord(words, 1)).toBe(-1);
    expect(validateWords([{ text: 'x', timestamp: [-1, 2] }], 2).length).toBe(
      0
    );
    expect(validateWords([{ text: 'x', timestamp: [0, 3] }], 2).length).toBe(0);
  });
  it('produces dry-run CRM proposals only in explicit command mode', () => {
    expect(commandProposal('open patient 123', false).status).toBe('refused');
    expect(commandProposal('open patient 123', true).action).toBe(
      'open_patient'
    );
    expect(commandProposal('open patient 123', true).requiresConfirmation).toBe(
      true
    );
    for (const text of [
      'do not open patient 123',
      'patient says open patient 123',
      'delete patient 123',
      'prescribe aspirin',
      'open patient 123 then delete',
    ]) {
      expect(commandProposal(text, true).status).toBe('refused');
    }
  });
  it('runs sequentially, retains errors and respects cancellation', async () => {
    let busy = 0;
    const seen = [];
    const results = await runBatch([1, 2, 3], async (item) => {
      expect(busy).toBe(0);
      busy++;
      await Promise.resolve();
      busy--;
      seen.push(item);
      if (item === 2) {
        throw new Error('decode failed');
      }
      return { text: String(item) };
    });
    expect(seen.join(',')).toBe('1,2,3');
    expect(results.map((r) => r.status).join(',')).toBe(
      'complete,error,complete'
    );
    expect(results[1].error).toBe('decode failed');
    let stopped = false;
    const cancelled = await runBatch(
      [1, 2, 3],
      async () => {
        stopped = true;
        return { text: 'ok' };
      },
      () => stopped
    );
    expect(cancelled.map((r) => r.status).join(',')).toBe(
      'complete,cancelled,cancelled'
    );
  });
});
