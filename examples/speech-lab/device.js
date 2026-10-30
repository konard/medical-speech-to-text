import { scoreTranscript } from '../../src/speech/index.js';

export function capabilityReport(scope = globalThis) {
  return {
    inference: Boolean(
      scope.isSecureContext &&
      scope.Worker &&
      scope.WebAssembly &&
      scope.AudioContext &&
      scope.OfflineAudioContext
    ),
    microphone: Boolean(
      scope.isSecureContext &&
      scope.navigator?.mediaDevices?.getUserMedia &&
      scope.MediaRecorder &&
      scope.AudioContext
    ),
    webgpu: Boolean(scope.navigator?.gpu),
    cache: Boolean(scope.caches),
  };
}

export function chatMessages(history, prompt) {
  if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 1200) {
    throw new Error('Enter 1–1200 characters');
  }
  if (
    !Array.isArray(history) ||
    history.some(
      (item) =>
        !['user', 'assistant'].includes(item.role) ||
        typeof item.content !== 'string'
    )
  ) {
    throw new Error('Invalid chat history');
  }
  const messages = [
    ...history.slice(-8),
    { role: 'user', content: prompt.trim() },
  ];
  while (
    messages.reduce((size, item) => size + item.content.length, 0) > 6000
  ) {
    messages.splice(0, 2);
  }
  return messages;
}

export function encodeWav(samples, sampleRate) {
  if (
    !(samples instanceof Float32Array) ||
    !samples.length ||
    !Number.isInteger(sampleRate) ||
    sampleRate < 8000 ||
    sampleRate > 96000 ||
    samples.length > sampleRate * 120
  ) {
    throw new Error('Invalid or excessive captured audio');
  }
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const string = (offset, text) =>
    Array.from(text).forEach((char, i) =>
      view.setUint8(offset + i, char.charCodeAt(0))
    );
  string(0, 'RIFF');
  view.setUint32(4, buffer.byteLength - 8, true);
  string(8, 'WAVEfmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  string(36, 'data');
  view.setUint32(40, samples.length * 2, true);
  samples.forEach((value, i) => {
    const clipped = Math.max(
      -1,
      Math.min(1, Number.isFinite(value) ? value : 0)
    );
    view.setInt16(44 + i * 2, clipped * (clipped < 0 ? 32768 : 32767), true);
  });
  return buffer;
}

export function qualityEndpoint(value) {
  const url = new URL(value);
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      'Use an approved HTTPS endpoint without credentials, query or fragment'
    );
  }
  return url.href;
}

async function boundedJson(response) {
  // Bound the body while reading, including servers without Content-Length.
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      size += value.byteLength;
      if (size > 1000000) {
        throw new Error('Quality response exceeds 1 MB');
      }
      chunks.push(value);
    }
  } finally {
    await reader.cancel();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  chunks.forEach((chunk) => {
    bytes.set(chunk, offset);
    offset += chunk.length;
  });
  return JSON.parse(new globalThis.TextDecoder().decode(bytes));
}

function comparisonBody(file, text, model) {
  if (
    !file ||
    file.size > 25 * 1024 * 1024 ||
    typeof text !== 'string' ||
    text.length > 10000
  ) {
    throw new Error('Invalid comparison input');
  }
  const body = new globalThis.FormData();
  body.append('audio', file, file.name || 'recording.wav');
  body.append('localTranscript', text);
  body.append('localModel', JSON.stringify(model));
  return body;
}

export async function compareQuality({
  endpoint,
  file,
  text,
  model,
  consent,
  fetcher = fetch,
  signal,
}) {
  if (!consent) {
    throw new Error(
      'Consent is required to send this recording and transcript'
    );
  }
  const url = qualityEndpoint(endpoint);
  const body = comparisonBody(file, text, model);
  const response = await fetcher(url, {
    method: 'POST',
    body,
    credentials: 'omit',
    redirect: 'error',
    referrerPolicy: 'no-referrer',
    signal: signal || AbortSignal.timeout(60000),
  });
  if (!response.ok) {
    throw new Error(`Quality service returned HTTP ${response.status}`);
  }
  const result = await boundedJson(response);
  if (
    typeof result.text !== 'string' ||
    result.text.length > 10000 ||
    typeof result.model?.id !== 'string' ||
    typeof result.model?.revision !== 'string'
  ) {
    throw new Error('Quality service must return text and model id/revision');
  }
  return {
    text: result.text,
    model: result.model,
    agreement: scoreTranscript(text, result.text),
  };
}

export async function modelCache(scope = globalThis, remove = false) {
  if (!scope.caches) {
    return 0;
  }
  // Transformers.js shares a named cache. Only touch this demo's pinned models.
  const { MODELS, CHAT_MODEL } = await import('./config.js');
  const models = [...Object.values(MODELS), CHAT_MODEL];
  let count = 0;
  for (const name of await scope.caches.keys()) {
    if (name !== 'transformers-cache') {
      continue;
    }
    const cache = await scope.caches.open(name);
    for (const request of await cache.keys()) {
      const url = new URL(request.url);
      if (
        url.origin === 'https://huggingface.co' &&
        models.some((model) =>
          url.pathname.startsWith(`/${model.id}/resolve/${model.revision}/`)
        )
      ) {
        count++;
        if (remove) {
          await cache.delete(request);
        }
      }
    }
  }
  return count;
}
