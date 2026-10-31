// Serve only the production artifact under the same subpath as GitHub Pages.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { URL } from 'node:url';

const root = resolve('examples/speech-lab/dist');
const prefix = '/medical-speech-to-text/';
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.wav': 'audio/wav',
};
const server = createServer(async (request, response) => {
  try {
    const path = decodeURIComponent(
      new URL(request.url, 'http://localhost').pathname
    );
    if (!['GET', 'HEAD'].includes(request.method) || !path.startsWith(prefix)) {
      response.writeHead(404).end();
      return;
    }
    const file = resolve(root, path.slice(prefix.length) || 'index.html');
    if (!file.startsWith(root + sep)) {
      response.writeHead(403).end();
      return;
    }
    const bytes = await readFile(file);
    response.writeHead(200, {
      'Content-Type': types[extname(file)] || 'application/octet-stream',
    });
    response.end(request.method === 'HEAD' ? undefined : bytes);
    if (process.env.PAGES_DEBUG === '1') {
      console.log(request.method, path, bytes.length);
    }
  } catch (error) {
    if (process.env.PAGES_DEBUG === '1') {
      console.error(error.message);
    }
    response.writeHead(404).end();
  }
});
server.listen(4175, '127.0.0.1', () =>
  console.log(`Built Pages site: http://127.0.0.1:4175${prefix}`)
);
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => server.close());
}
