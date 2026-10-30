export { scoreTranscript, aggregateScores } from './metrics.js';

export const LIMITS = Object.freeze({
  files: 20,
  fileBytes: 25 * 1024 * 1024,
  totalBytes: 100 * 1024 * 1024,
  seconds: 120,
});

function safeName(name) {
  return (
    typeof name === 'string' &&
    name.length > 0 &&
    name.length <= 240 &&
    !/[\\/]/.test(name) &&
    !Array.from(name).some((char) => char.codePointAt(0) < 32) &&
    !['__proto__', 'constructor', 'prototype'].includes(name)
  );
}

/** References are a flat JSON object keyed by exact, unique audio filename. */
export function parseReferences(text) {
  if (typeof text !== 'string' || text.length > 250000) {
    throw new Error('Reference JSON exceeds 250000 characters');
  }
  const data = JSON.parse(text);
  if (!data || Array.isArray(data) || typeof data !== 'object') {
    throw new Error('Expected a filename-to-text object');
  }
  const refs = Object.create(null);
  for (const [name, value] of Object.entries(data)) {
    if (!safeName(name)) {
      throw new Error('Invalid reference filename');
    }
    if (typeof value !== 'string' || value.length > 10000) {
      throw new Error('Reference must be a string of at most 10000 characters');
    }
    refs[name] = value;
  }
  // A flat string map contains alternating key/value JSON string tokens.
  // JSON.parse alone would silently overwrite duplicate keys.
  const tokens = text.match(/"(?:\\.|[^"\\])*"/g) || [];
  const seen = new Set();
  for (let i = 0; i < tokens.length; i += 2) {
    const key = JSON.parse(tokens[i]);
    if (seen.has(key)) {
      throw new Error(`duplicate reference filename: ${key}`);
    }
    seen.add(key);
  }
  return refs;
}

export function validateFiles(files) {
  const items = Array.from(files);
  if (items.length < 1 || items.length > LIMITS.files) {
    throw new Error('Select 1 to 20 audio files');
  }
  const seen = new Set();
  let total = 0;
  for (const file of items) {
    if (!safeName(file.name) || seen.has(file.name)) {
      throw new Error('Invalid or duplicate audio filename');
    }
    seen.add(file.name);
    if (!/\.(wav|mp3|ogg|flac|m4a|webm|mp4)$/i.test(file.name)) {
      throw new Error('Select supported audio files');
    }
    if (
      !Number.isFinite(file.size) ||
      file.size <= 0 ||
      file.size > LIMITS.fileBytes
    ) {
      throw new Error('Each audio file must be nonempty and at most 25 MiB');
    }
    total += file.size;
  }
  if (total > LIMITS.totalBytes) {
    throw new Error('Batch must be at most 100 MiB');
  }
  return items;
}

/** Invalid/missing timestamps are omitted, never replaced with invented intervals. */
export function validateWords(chunks, duration) {
  let lastEnd = 0;
  return (Array.isArray(chunks) ? chunks : []).flatMap((chunk) => {
    if (!chunk || !Array.isArray(chunk.timestamp)) {
      return [];
    }
    const [start, end] = chunk.timestamp;
    if (
      typeof chunk.text !== 'string' ||
      !chunk.text.trim() ||
      !Number.isFinite(start) ||
      !Number.isFinite(end) ||
      start < lastEnd ||
      start < 0 ||
      end <= start ||
      end > duration
    ) {
      return [];
    }
    lastEnd = end;
    return [{ text: chunk.text.trim(), start, end }];
  });
}

export function activeWord(words, time) {
  return words.findIndex((word) => time >= word.start && time < word.end);
}

/** Small allowlist to illustrate intent separation. No executor exists here. */
export function commandProposal(text, commandMode) {
  const refused = {
    status: 'refused',
    reason: 'Use explicit command mode and an exact allowed command',
  };
  if (!commandMode || typeof text !== 'string') {
    return refused;
  }
  const match = /^open patient ([0-9]{1,12})$/i.exec(text.trim());
  if (!match) {
    return refused;
  }
  return {
    status: 'proposed',
    action: 'open_patient',
    patientId: match[1],
    requiresConfirmation: true,
    dryRun: true,
  };
}

export async function runBatch(
  items,
  processItem,
  isCancelled = () => false,
  onResult = () => {}
) {
  const results = [];
  for (const [index, item] of items.entries()) {
    let result;
    if (isCancelled()) {
      result = { index, status: 'cancelled' };
    } else {
      try {
        result = {
          index,
          status: 'complete',
          ...(await processItem(item, index)),
        };
      } catch (error) {
        result = {
          index,
          status: isCancelled() ? 'cancelled' : 'error',
          error: String(error.message || error),
        };
      }
    }
    results.push(result);
    onResult(result);
  }
  return results;
}
