import { createLogger, defineConfig } from 'vite';

export default defineConfig(({ command }) => {
  const logger = createLogger();
  if (command === 'build') {
    for (const method of ['warn', 'warnOnce']) {
      const original = logger[method].bind(logger);
      logger[method] = (...args) => {
        original(...args);
        throw new Error(
          'Vite emitted build warnings; resolve them before shipping'
        );
      };
    }
  }
  return { base: './', worker: { format: 'es' }, customLogger: logger };
});
