import { DEADLINE_MS } from './config.js';

/** One worker and one active request; Stop releases all model memory. */
export class Inference {
  worker;
  reject;
  timer;
  stop() {
    this.worker?.terminate();
    this.worker = undefined;
    clearTimeout(this.timer);
    this.reject?.(new Error('Inference stopped'));
    this.reject = undefined;
  }
  request(data, onProgress = () => {}, onToken = () => {}) {
    if (this.reject) {
      return Promise.reject(new Error('Inference is already running'));
    }
    this.worker ||= new Worker(new URL('./worker.js', import.meta.url), {
      type: 'module',
    });
    return new Promise((resolve, reject) => {
      this.reject = reject;
      const done = () => {
        clearTimeout(this.timer);
        this.reject = undefined;
      };
      this.timer = setTimeout(() => this.stop(), DEADLINE_MS);
      this.worker.onmessage = ({ data: result }) => {
        if (result.type === 'progress') {
          onProgress(result.message);
          return;
        }
        if (result.type === 'token') {
          onToken(result.text);
          return;
        }
        done();
        if (result.type === 'error') {
          this.stop();
          reject(new Error(result.message));
        } else {
          resolve(result);
        }
      };
      this.worker.onerror = (event) => {
        done();
        this.stop();
        reject(new Error(event.message || 'Model worker failed'));
      };
      this.worker.postMessage(data, data.samples ? [data.samples.buffer] : []);
    });
  }
  run(samples, model, onProgress) {
    return this.request({ samples, model }, onProgress);
  }
  prepare(model, onProgress) {
    return this.request({ model, prepare: true }, onProgress);
  }
  chat(messages, model, onProgress, onToken) {
    return this.request({ messages, model }, onProgress, onToken);
  }
}
