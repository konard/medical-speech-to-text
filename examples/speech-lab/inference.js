import { DEADLINE_MS } from './config.js';

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
  run(samples, model, onProgress) {
    this.worker ||= new Worker(new URL('./worker.js', import.meta.url), {
      type: 'module',
    });
    return new Promise((resolve, reject) => {
      this.reject = reject;
      const done = () => {
        clearTimeout(this.timer);
        this.reject = undefined;
      };
      this.timer = setTimeout(() => {
        this.stop();
      }, DEADLINE_MS);
      this.worker.onmessage = ({ data }) => {
        if (data.type === 'progress') {
          onProgress(data.message);
          return;
        }
        done();
        if (data.type === 'error') {
          this.stop();
          reject(new Error(data.message));
        } else {
          resolve(data);
        }
      };
      this.worker.onerror = (event) => {
        done();
        this.stop();
        reject(new Error(event.message || 'Model worker failed'));
      };
      this.worker.postMessage({ samples, model }, [samples.buffer]);
    });
  }
}
