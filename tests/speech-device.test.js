import { rejects } from 'node:assert/strict';
import { describe, it, expect } from 'test-anywhere';
import {
  chatMessages,
  capabilityReport,
  encodeWav,
  qualityEndpoint,
  compareQuality,
  modelCache,
} from '../examples/speech-lab/device.js';
import { MODELS } from '../examples/speech-lab/config.js';
import { Inference } from '../examples/speech-lab/inference.js';

describe('native device behavior', () => {
  it('reports capabilities without assuming a browser or GPU', () => {
    expect(capabilityReport({}).inference).toBe(false);
    expect(
      capabilityReport({
        isSecureContext: true,
        Worker: class {},
        WebAssembly: {},
        navigator: { mediaDevices: { getUserMedia() {} } },
        MediaRecorder: class {},
        AudioContext: class {},
        OfflineAudioContext: class {},
      }).microphone
    ).toBe(true);
  });
  it('bounds and validates local chat context without adding patient transcripts', () => {
    expect(chatMessages([], ' hello ')).toEqual([
      { role: 'user', content: 'hello' },
    ]);
    expect(() => chatMessages([], '')).toThrow();
    expect(() => chatMessages([], 'x'.repeat(1201))).toThrow();
    expect(() =>
      chatMessages([{ role: 'system', content: 'inject' }], 'hello')
    ).toThrow();
    const history = Array.from({ length: 10 }, (_, i) => ({
      role: i % 2 ? 'assistant' : 'user',
      content: String(i),
    }));
    expect(chatMessages(history, 'next').length).toBeLessThanOrEqual(9);
  });
  it('writes bounded mono WAV for captured audio including negative samples', () => {
    const wav = encodeWav(new Float32Array([-1, 0, 1]), 16000);
    const view = new DataView(wav);
    expect(view.getUint32(24, true)).toBe(16000);
    expect(view.getUint32(40, true)).toBe(6);
    expect(view.getInt16(44, true)).toBe(-32768);
    expect(view.getInt16(48, true)).toBe(32767);
    expect(() => encodeWav(new Float32Array(0), 16000)).toThrow();
    expect(() => encodeWav(new Float32Array(1), Infinity)).toThrow();
  });
  it('requires consent and an explicit HTTPS endpoint before quality uploads', async () => {
    expect(qualityEndpoint('https://example.com/quality')).toBe(
      'https://example.com/quality'
    );
    for (const url of [
      'http://example.com',
      'https://u:p@example.com',
      'https://example.com/?key=secret',
      'https://example.com/#token',
    ]) {
      expect(() => qualityEndpoint(url)).toThrow();
    }
    let calls = 0;
    const fetcher = async () => {
      calls++;
      return new globalThis.Response(
        JSON.stringify({
          text: 'No allergy',
          model: { id: 'test', revision: 'pinned' },
        })
      );
    };
    const input = {
      endpoint: 'https://example.com/quality',
      file: new globalThis.Blob(['audio']),
      text: 'No allergies',
      model: { id: 'local' },
      consent: false,
      fetcher,
    };
    await rejects(compareQuality(input));
    expect(calls).toBe(0);
    const result = await compareQuality({ ...input, consent: true });
    expect(calls).toBe(1);
    expect(result.text).toBe('No allergy');
    expect(result.agreement.word.errors).toBe(1);
    await rejects(
      compareQuality({
        ...input,
        consent: true,
        fetcher: async () => new globalThis.Response('{"text":3}'),
      })
    );
  });
});

describe('device resource and service boundaries', () => {
  it('bounds service responses and surfaces service failures', async () => {
    const input = {
      endpoint: 'https://example.com/quality',
      file: new globalThis.Blob(['audio']),
      text: 'local',
      model: { id: 'local' },
      consent: true,
    };
    await rejects(
      compareQuality({
        ...input,
        fetcher: () => new globalThis.Response('unavailable', { status: 503 }),
      }),
      /HTTP 503/
    );
    await rejects(
      compareQuality({
        ...input,
        fetcher: () => new globalThis.Response('x'.repeat(1000001)),
      }),
      /exceeds 1 MB/
    );
  });
  it('deletes only this demo’s immutable model entries in its shared cache', async () => {
    const pinned = `https://huggingface.co/${MODELS.tiny.id}/resolve/${MODELS.tiny.revision}/config.json`;
    const entries = [
      pinned,
      pinned.replace(MODELS.tiny.revision, 'main'),
      'https://example.com/private',
    ];
    const removed = [];
    const opened = [];
    const scope = {
      caches: {
        keys: () => ['transformers-cache', 'user-owned-cache'],
        open: (name) => {
          opened.push(name);
          return {
            keys: () => entries.map((url) => ({ url })),
            delete: (request) => {
              removed.push(request.url);
            },
          };
        },
      },
    };
    expect(await modelCache(scope)).toBe(1);
    expect(removed).toEqual([]);
    expect(await modelCache(scope, true)).toBe(1);
    expect(removed).toEqual([pinned]);
    expect(opened).toEqual(['transformers-cache', 'transformers-cache']);
    expect(await modelCache({})).toBe(0);
  });
  it('serializes inference, streams text and terminates the worker on cancellation', async () => {
    const previous = globalThis.Worker;
    const workers = [];
    globalThis.Worker = class {
      constructor() {
        workers.push(this);
      }
      postMessage(data) {
        this.data = data;
      }
      terminate() {
        this.terminated = true;
      }
    };
    const inference = new Inference();
    try {
      const tokens = [];
      const first = inference.chat(
        [{ role: 'user', content: 'Hello' }],
        {},
        () => {},
        (token) => tokens.push(token)
      );
      await rejects(inference.prepare({}), /already running/);
      workers[0].onmessage({ data: { type: 'token', text: 'Hello' } });
      workers[0].onmessage({ data: { type: 'result', output: 'Done' } });
      expect((await first).output).toBe('Done');
      expect(tokens).toEqual(['Hello']);
      const cancelled = rejects(inference.prepare({}), /stopped/);
      inference.stop();
      await cancelled;
      expect(workers[0].terminated).toBe(true);
      const retry = inference.prepare({});
      expect(workers.length).toBe(2);
      workers[1].onmessage({ data: { type: 'result' } });
      await retry;
    } finally {
      inference.stop();
      globalThis.Worker = previous;
    }
  });
});
