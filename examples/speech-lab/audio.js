import { LIMITS } from '../../src/speech/index.js';

function metadata(url) {
  return new Promise((resolve, reject) => {
    const audio = new globalThis.Audio();
    const finish = (error) => {
      clearTimeout(timer);
      audio.removeAttribute('src');
      audio.load();
      if (error) {
        reject(error);
      }
    };
    const timer = setTimeout(
      () => finish(new Error('Audio metadata timed out')),
      20000
    );
    audio.onloadedmetadata = () => {
      const { duration } = audio;
      finish();
      resolve(duration);
    };
    audio.onerror = () =>
      finish(new Error('Browser cannot read this audio format'));
    audio.preload = 'metadata';
    audio.src = url;
  });
}

export async function decodeAudio(file, url) {
  const duration = await metadata(url);
  if (
    !Number.isFinite(duration) ||
    duration <= 0 ||
    duration > LIMITS.seconds
  ) {
    throw new Error(
      'Each recording must be at most 120 seconds with readable duration'
    );
  }
  const context = new globalThis.AudioContext();
  let decoded;
  try {
    decoded = await context.decodeAudioData(await file.arrayBuffer());
  } finally {
    await context.close();
  }
  if (
    decoded.duration > LIMITS.seconds ||
    decoded.numberOfChannels > 2 ||
    decoded.sampleRate > 96000
  ) {
    throw new Error(
      'Use at most 120 seconds, two channels and 96 kHz per file'
    );
  }
  const offline = new globalThis.OfflineAudioContext(
    1,
    Math.ceil(decoded.duration * 16000),
    16000
  );
  const source = offline.createBufferSource();
  source.buffer = decoded;
  source.connect(offline.destination);
  source.start();
  const rendered = await offline.startRendering();
  return {
    samples: rendered.getChannelData(0),
    duration: decoded.duration,
    channels: decoded.numberOfChannels,
    sampleRate: decoded.sampleRate,
  };
}
