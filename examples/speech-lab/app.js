import { loadSamples } from './samples.js';
import {
  validateFiles,
  parseReferences,
  validateWords,
  scoreTranscript,
  commandProposal,
  runBatch,
} from '../../src/speech/index.js';
import { MODELS } from './config.js';
import { decodeAudio } from './audio.js';
import { Inference } from './inference.js';
import { renderResult, renderSummary } from './render.js';

const get = (id) => globalThis.document.getElementById(id);
const inference = new Inference();
let cancelled = false;
let running = false;
let results = [];
let urls = [];
let cleanups = [];
let startedAt;
const status = (message) => {
  get('status').textContent = message;
};

function clearResults() {
  cleanups.forEach((cleanup) => cleanup());
  cleanups = [];
  urls.forEach((url) => URL.revokeObjectURL(url));
  urls = [];
  results = [];
  get('results').replaceChildren();
  get('summary').hidden = true;
  get('export').disabled = true;
}

function setRunning(value) {
  running = value;
  for (const id of [
    'run',
    'model',
    'files',
    'references',
    'reference-file',
    'command-mode',
    'clear',
    'samples',
  ]) {
    get(id).disabled = value;
  }
  get('cancel').disabled = !value;
}

async function processRecording(file, model, refs, commandMode) {
  status(`Reading ${file.name}…`);
  const url = URL.createObjectURL(file);
  urls.push(url);
  const decoded = await decodeAudio(file, url);
  if (cancelled) {
    throw new Error('Stopped');
  }
  const hash = await globalThis.crypto.subtle.digest(
    'SHA-256',
    await file.arrayBuffer()
  );
  const sha256 = Array.from(new Uint8Array(hash), (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('');
  if (cancelled) {
    throw new Error('Stopped');
  }
  status(`Transcribing ${file.name}…`);
  const prediction = await inference.run(decoded.samples, model, status);
  const { text, chunks } = prediction.output;
  if (typeof text !== 'string') {
    throw new Error('Model returned no transcript');
  }
  return {
    name: file.name,
    url,
    text,
    chunks,
    words: validateWords(chunks, decoded.duration),
    duration: decoded.duration,
    reference: refs[file.name],
    score: scoreTranscript(refs[file.name], text),
    model: {
      ...model,
      runtime: 'Transformers.js 3.8.1',
      device: 'wasm',
      dtype: 'q8',
      threads: 1,
    },
    audio: {
      sha256,
      bytes: file.size,
      channels: decoded.channels,
      decodedSampleRate: decoded.sampleRate,
      inferenceSampleRate: 16000,
    },
    timing: {
      loadMs: prediction.loadMs,
      inferenceMs: prediction.inferenceMs,
      cold: prediction.cold,
    },
    ...(commandMode ? { command: commandProposal(text, true) } : {}),
  };
}

get('samples').addEventListener('click', async () => {
  setRunning(true);
  get('cancel').disabled = true;
  status('Loading ten public mock-consultation clips…');
  try {
    const { files, references } = await loadSamples();
    get('files').files = files;
    get('references').value = JSON.stringify(references, null, 2);
    get('selection').textContent =
      '10 PriMock57 clips · one mock consultation · CC BY 4.0';
    status(
      'Ten public samples ready. Select Transcribe recordings to run the model.'
    );
  } catch (error) {
    status(error.message);
  } finally {
    setRunning(false);
  }
});

get('files').addEventListener('change', () => {
  get('selection').textContent =
    Array.from(get('files').files, (file) => file.name).join(' · ') ||
    'No recordings selected';
});
get('reference-file').addEventListener('change', async () => {
  const file = get('reference-file').files[0];
  if (!file) {
    return;
  }
  try {
    if (file.size > 250000) {
      throw new Error('Reference file must be at most 250000 bytes');
    }
    const text = await file.text();
    parseReferences(text);
    get('references').value = text;
    status('Reference JSON loaded');
  } catch (error) {
    status(error.message);
  }
});

get('run').addEventListener('click', async () => {
  if (running) {
    return;
  }
  let files;
  let refs;
  try {
    files = validateFiles(get('files').files);
    refs = parseReferences(get('references').value.trim() || '{}');
    const names = new Set(files.map((file) => file.name));
    if (Object.keys(refs).some((name) => !names.has(name))) {
      throw new Error(
        'A reference filename does not match any selected recording'
      );
    }
  } catch (error) {
    status(error.message);
    return;
  }
  clearResults();
  cancelled = false;
  startedAt = new Date().toISOString();
  setRunning(true);
  const model = MODELS[get('model').value];
  const commandMode = get('command-mode').checked;
  try {
    results = await runBatch(
      files,
      (file) => processRecording(file, model, refs, commandMode),
      () => cancelled,
      (result) => {
        const named = { ...result, name: files[result.index].name };
        results.push(named);
        cleanups.push(renderResult(named, get('results')));
        renderSummary(results, get('summary'));
      }
    );
    // runBatch returns all statuses; retain names also for failed/cancelled files.
    results = results.map((result) => ({
      ...result,
      name: files[result.index].name,
    }));
    get('export').disabled = false;
    status(
      cancelled
        ? 'Stopped. Completed results are available.'
        : `Finished · ${results.filter((result) => result.status === 'complete').length} of ${files.length} recordings transcribed`
    );
  } catch (error) {
    status(error.message);
  } finally {
    setRunning(false);
  }
});
get('cancel').addEventListener('click', () => {
  cancelled = true;
  inference.stop();
  status('Stopping…');
});
get('clear').addEventListener('click', () => {
  inference.stop();
  clearResults();
  get('files').value = '';
  get('reference-file').value = '';
  get('references').value = '';
  get('selection').textContent = 'No recordings selected';
  status(
    'Recordings and results cleared. Cached model weights remain in browser storage.'
  );
});
get('export').addEventListener('click', () => {
  const payload = {
    schema: 'speech-lab/v1',
    startedAt,
    exportedAt: new Date().toISOString(),
    userAgent: globalThis.navigator.userAgent,
    notes:
      'Research only. Word timestamps are estimates. No missing reference is scored.',
    results: results.map((result) =>
      Object.fromEntries(
        Object.entries(result).filter(([key]) => key !== 'url')
      )
    ),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const anchor = globalThis.document.createElement('a');
  anchor.href = url;
  anchor.download = 'speech-lab-results.json';
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
globalThis.addEventListener('pagehide', () => {
  inference.stop();
  clearResults();
});
