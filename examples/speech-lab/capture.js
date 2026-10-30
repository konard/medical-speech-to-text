import { encodeWav } from './device.js';

/** MediaRecorder is a browser adapter; never starts without a user gesture. */
export class Capture {
  stream;
  recorder;
  async requestStream() {
    // getUserMedia itself cannot be aborted. End the UI task immediately, and
    // keep a per-request guard to release any stream granted after cancellation.
    const permission = { cancelled: false };
    this.permission = permission;
    const stopped = new Promise((_, reject) => {
      permission.reject = reject;
    });
    const requested = globalThis.navigator.mediaDevices
      .getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      .then((stream) => {
        if (permission.cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          throw new Error('Microphone request cancelled');
        }
        return stream;
      });
    try {
      return await Promise.race([requested, stopped]);
    } finally {
      if (this.permission === permission) {
        this.permission = undefined;
      }
    }
  }
  async start(onStarted = () => {}) {
    const stream = await this.requestStream();
    this.stream = stream;
    try {
      const mimeType = ['audio/webm;codecs=opus', 'audio/mp4'].find((type) =>
        globalThis.MediaRecorder.isTypeSupported(type)
      );
      this.recorder = new globalThis.MediaRecorder(
        stream,
        mimeType ? { mimeType } : {}
      );
      const chunks = [];
      let size = 0;
      this.finished = new Promise((resolve, reject) => {
        this.recorder.ondataavailable = ({ data }) => {
          size += data.size;
          if (size > 25 * 1024 * 1024) {
            reject(new Error('Microphone recording exceeded 25 MiB'));
            this.stop();
          } else {
            chunks.push(data);
          }
        };
        this.recorder.onerror = () => {
          reject(new Error('Microphone recording failed'));
          this.stop();
        };
        this.recorder.onstop = () => {
          this.release();
          resolve(new Blob(chunks, { type: this.recorder.mimeType }));
        };
      });
      // Attach a rejection handler even before the user selects Stop.
      this.finished.catch(() => {});
      this.recorder.start(1000);
      onStarted();
      return this.finished;
    } catch (error) {
      this.release();
      throw error;
    }
  }
  stop() {
    if (this.recorder?.state === 'recording') {
      this.recorder.stop();
    }
    this.release();
  }
  release() {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = undefined;
  }
  cancel() {
    if (this.permission) {
      this.permission.cancelled = true;
      this.permission.reject(new Error('Microphone request cancelled'));
    }
    this.stop();
  }
}

export async function capturedFile(blob) {
  const context = new globalThis.AudioContext();
  try {
    const audio = await context.decodeAudioData(await blob.arrayBuffer());
    const mono = new Float32Array(audio.length);
    for (let channel = 0; channel < audio.numberOfChannels; channel++) {
      const values = audio.getChannelData(channel);
      mono.forEach((_, i) => {
        mono[i] += values[i] / audio.numberOfChannels;
      });
    }
    return new globalThis.File(
      [encodeWav(mono, audio.sampleRate)],
      'microphone.wav',
      { type: 'audio/wav' }
    );
  } finally {
    await context.close();
  }
}
