import { ASSETS } from './config.js';

let pipelineInstance;
let loadedKey;
let runtime;

globalThis.onmessage = async ({ data }) => {
  try {
    const { model, samples, messages, prepare } = data;
    const task = model.task || 'automatic-speech-recognition';
    const key = `${model.id}@${model.revision}:${task}`;
    const cold = loadedKey !== key;
    const loadStart = performance.now();
    if (cold) {
      loadedKey = undefined;
      if (pipelineInstance) {
        await pipelineInstance.dispose();
        pipelineInstance = undefined;
      }
      runtime ||= await import(/* @vite-ignore */ ASSETS.runtime);
      const { pipeline, env } = runtime;
      env.allowLocalModels = false;
      env.remoteHost = ASSETS.modelHost;
      env.backends.onnx.wasm.wasmPaths = ASSETS.wasm;
      env.backends.onnx.wasm.numThreads = 1;
      env.backends.onnx.wasm.proxy = false;
      pipelineInstance = await pipeline(task, model.id, {
        revision: model.revision,
        dtype: model.dtype || 'q8',
        device: 'wasm',
        progress_callback: ({ status, file, progress }) =>
          globalThis.postMessage({
            type: 'progress',
            message: `${status}: ${file || model.id}${Number.isFinite(progress) ? ` (${Math.round(progress)}%)` : ''}`,
          }),
      });
      loadedKey = key;
    }
    const loadMs = performance.now() - loadStart;
    const start = performance.now();
    let output;
    let firstTokenMs = null;
    if (!prepare) {
      output =
        task === 'text-generation'
          ? await pipelineInstance(messages, {
              max_new_tokens: 128,
              do_sample: false,
              return_full_text: false,
              streamer: new runtime.TextStreamer(pipelineInstance.tokenizer, {
                skip_prompt: true,
                skip_special_tokens: true,
                callback_function: (text) => {
                  firstTokenMs ??= performance.now() - start;
                  globalThis.postMessage({ type: 'token', text });
                },
              }),
            })
          : await pipelineInstance(samples, {
              return_timestamps: 'word',
              chunk_length_s: 30,
              stride_length_s: 5,
            });
    }
    globalThis.postMessage({
      type: 'result',
      output,
      cold,
      loadMs,
      firstTokenMs,
      inferenceMs: performance.now() - start,
    });
  } catch (error) {
    globalThis.postMessage({
      type: 'error',
      message: String(error.message || error),
    });
  }
};
