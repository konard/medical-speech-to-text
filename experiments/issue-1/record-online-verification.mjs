import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { URL } from 'node:url';
import { aggregateScores } from '../../src/speech/index.js';

// Run only after test:model succeeds with SPEECH_LAB_URL set to the public demo.
const revision = process.argv[2];
assert.match(revision || '', /^[a-f0-9]{40}$/);
const url = new URL(process.env.SPEECH_LAB_URL);
assert.equal(url.protocol, 'https:');
const evidence = new URL(
  '../../examples/speech-lab/test-results/model-evidence/',
  import.meta.url
);
const read = (name) =>
  JSON.parse(readFileSync(new URL(name, evidence), 'utf8'));
const tiny = read('browser-results.json');
const base = read('browser-base-result.json');
const network = read('browser-network.json');
assert.equal(tiny.results.length, 10);
assert(
  tiny.results.every(
    (result) => result.status === 'complete' && result.text.trim()
  )
);
assert.equal(base.results.length, 1);
assert.equal(base.results[0].status, 'complete');
assert(base.results[0].text.trim());
assert.equal(base.results[0].score, null);
assert.deepEqual(network.errors, []);
assert(
  network.requests.every((request) => ['GET', 'HEAD'].includes(request.method))
);
const receipt = {
  url: url.href,
  testedSourceRevision: revision,
  startedAt: tiny.startedAt,
  completedAt: base.exportedAt,
  userAgent: tiny.userAgent,
  tiny: {
    completed: tiny.results.length,
    model: tiny.results[0].model,
    scores: aggregateScores(tiny.results.map((result) => result.score)),
    audioSha256: tiny.results.map((result) => result.audio.sha256),
  },
  baseWithoutReference: {
    model: base.results[0].model,
    text: base.results[0].text,
    score: base.results[0].score,
  },
  hostingAcknowledgements: network.hostingAcknowledgements || [],
  applicationRequestMethods: [
    ...new Set(network.requests.map((request) => request.method)),
  ],
  pageErrors: network.errors,
  assertions: [
    'ten actual outputs',
    'optional reference',
    'word seek and active highlight',
    'model and audio provenance',
    'no application upload requests',
  ],
};
writeFileSync(
  new URL(
    '../../docs/case-studies/issue-1/data/online-verification.json',
    import.meta.url
  ),
  `${JSON.stringify(receipt, null, 2)}\n`
);
console.log(`Recorded public model verification for ${revision}`);
