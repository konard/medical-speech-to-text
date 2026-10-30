import { ASSETS } from './config.js';

let transcriber;
let loadedKey;

globalThis.onmessage = async ({ data }) => {
  try {
    const { model, samples } = data;
    const key = `${model.id}@${model.revision}`;
    const cold = loadedKey !== key;
    const loadStart = performance.now();
    if (cold) {
      if (transcriber) {
        await transcriber.dispose();
      }
      const { pipeline, env } = await import(/* @vite-ignore */ ASSETS.runtime);
      env.allowLocalModels = false;
      env.remoteHost = ASSETS.modelHost;
      env.backends.onnx.wasm.wasmPaths = ASSETS.wasm;
      env.backends.onnx.wasm.numThreads = 1;
      env.backends.onnx.wasm.proxy = false;
      transcriber = await pipeline('automatic-speech-recognition', model.id, {
        revision: model.revision,
        dtype: 'q8',
        device: 'wasm',
        progress_callback: ({ status, file, progress }) => {
          globalThis.postMessage({
            type: 'progress',
            message: `${status}: ${file || model.id}${Number.isFinite(progress) ? ` (${Math.round(progress)}%)` : ''}`,
          });
        },
      });
      loadedKey = key;
    }
    const loadMs = performance.now() - loadStart;
    const start = performance.now();
    const output = await transcriber(samples, {
      return_timestamps: 'word',
      chunk_length_s: 30,
      stride_length_s: 5,
    });
    globalThis.postMessage({
      type: 'result',
      output,
      cold,
      loadMs,
      inferenceMs: performance.now() - start,
    });
  } catch (error) {
    globalThis.postMessage({
      type: 'error',
      message: String(error.message || error),
    });
  }
};
