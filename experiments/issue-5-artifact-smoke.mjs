// Exercise the actual SDK archive dependencies; mocks cannot prove overrides
// preserve ZIP contents. Run with node --throw-deprecation after SDK npm ci.
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { URL } from 'node:url';

const require = createRequire(
  new URL('../.github/actions/artifact-transport/package.json', import.meta.url)
);
const sdkRequire = createRequire(
  new URL(
    '../.github/actions/artifact-transport/node_modules/@actions/artifact/package.json',
    import.meta.url
  )
);
const archiver = sdkRequire('archiver');
const unzip = sdkRequire('unzip-stream');
const { file } = require('archiver-utils');
const root = await mkdtemp(join(tmpdir(), 'artifact-sdk-smoke-'));
try {
  const source = join(root, 'source');
  const destination = join(root, 'destination');
  await mkdir(join(source, 'nested'), { recursive: true });
  const fixtures = new Map([
    ['nested/bytes.bin', Buffer.from([0, 255, 13, 10, 128])],
    ['empty.txt', Buffer.alloc(0)],
    ['report.txt', Buffer.from('complete evidence\n')],
  ]);
  for (const [name, bytes] of fixtures) {
    await writeFile(join(source, name), bytes);
  }
  assert.deepEqual(
    file.expand({ cwd: source, nodir: true }, ['**/*', '!report.txt']).sort(),
    ['empty.txt', 'nested/bytes.bin']
  );
  const archivePath = join(root, 'evidence.zip');
  const output = createWriteStream(archivePath);
  const closed = once(output, 'close');
  const archive = archiver('zip');
  archive.on('error', (error) => output.destroy(error));
  archive.pipe(output);
  archive.directory(source, false);
  // ZIP names are outside the content CRC. Replace equal-length names after
  // writing so archiver's own sanitization cannot mask reader defects.
  const escapeNames = [
    '../destination2/escape.txt',
    '..\\destination2\\escape.txt',
  ];
  for (const [index, name] of escapeNames.entries()) {
    archive.append('must remain inside the archive', {
      name: String(index).repeat(name.length),
    });
  }
  await archive.finalize();
  await closed;
  const bytes = await readFile(archivePath);
  for (const [index, name] of escapeNames.entries()) {
    const placeholder = Buffer.from(String(index).repeat(name.length));
    let replacements = 0;
    for (
      let offset = bytes.indexOf(placeholder);
      offset !== -1;
      offset = bytes.indexOf(placeholder, offset + placeholder.length)
    ) {
      bytes.write(name, offset, 'utf8');
      replacements++;
    }
    assert.equal(replacements, 2, 'replace both local and central ZIP headers');
  }
  await writeFile(archivePath, bytes);
  const extracted = unzip.Extract({ path: destination });
  const extraction = once(extracted, 'close');
  createReadStream(archivePath)
    .on('error', (error) => extracted.destroy(error))
    .pipe(extracted);
  await extraction;
  for (const [name, bytes] of fixtures) {
    assert.deepEqual(await readFile(join(destination, name)), bytes);
  }
  await assert.rejects(readFile(join(root, 'destination2/escape.txt')), {
    code: 'ENOENT',
  });
  console.log(
    'Artifact SDK archive roundtrip: binary, empty and nested files preserved.'
  );
} finally {
  await rm(root, { recursive: true, force: true });
}
