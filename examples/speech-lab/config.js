// Public research demo: these hosts supply code/weights, never receive audio.
// For Australian restricted deployments, mirror every asset and disable egress.
export const ASSETS = Object.freeze({
  runtime:
    'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js',
  wasm: 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/',
  modelHost: 'https://huggingface.co/',
});
export const MODELS = Object.freeze({
  tiny: {
    id: 'Xenova/whisper-tiny.en',
    revision: '79fb389fc764e7c395bd330e9531d9d32ada7049',
    label: 'Whisper tiny · English · ~75 MB',
  },
  base: {
    id: 'Xenova/whisper-base.en',
    revision: '95bf40a508535962c6483ead40270b2e32267508',
    label: 'Whisper base · English · ~145 MB',
  },
});
export const DEADLINE_MS = 300000;
