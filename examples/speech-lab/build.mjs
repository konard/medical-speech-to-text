import { build, createLogger } from 'vite';

// Treat warnings as failed validation so a successful bundle cannot hide them.
const logger = createLogger();
let warned = false;
for (const method of ['warn', 'warnOnce']) {
  const original = logger[method].bind(logger);
  logger[method] = (...args) => {
    warned = true;
    original(...args);
  };
}
await build({ customLogger: logger });
if (warned) {
  throw new Error('Vite emitted build warnings; resolve them before shipping');
}
