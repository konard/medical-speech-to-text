// Repeat the saved validation commands sequentially on the exact current SHA.
// Keep output in ignored logs to avoid a self-referential evidence commit.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { closeSync, openSync, readFileSync, writeFileSync } from 'node:fs';

const base = 'dev/log/issues/5/pulls/6/validation';
const sha = spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' });
assert.equal(sha.status, 0);
const env = {
  ...process.env,
  NODE_OPTIONS: '--max-old-space-size=512',
  CARGO_BUILD_JOBS: '1',
};
delete env.NO_COLOR;
const records = ['verified-results.json', 'verified-additional-results.json']
  .flatMap((file) => JSON.parse(readFileSync(`${base}/${file}`, 'utf8')))
  .map(({ check, command }) => ({ check, command }));
const results = [];
for (const record of records) {
  const log = openSync(`${base}/final-${record.check}.log`, 'w');
  const started = Date.now();
  let result;
  try {
    result = spawnSync(record.command[0], record.command.slice(1), {
      env,
      stdio: ['ignore', log, log],
    });
  } finally {
    closeSync(log);
  }
  results.push({
    ...record,
    sha: sha.stdout.trim(),
    exit: result.status,
    error: result.error?.message,
    elapsedMs: Date.now() - started,
  });
  writeFileSync(
    `${base}/final-results.log`,
    `${JSON.stringify(results, null, 2)}\n`
  );
  console.log(`${record.check}: ${result.status} (${Date.now() - started} ms)`);
  assert.equal(result.status, 0, `${record.check}: inspect its final-*.log`);
}
