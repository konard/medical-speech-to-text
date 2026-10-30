#!/usr/bin/env node

import { execFileSync, spawnSync } from 'node:child_process';

// Git discovery excludes dependencies and generated build output. Historical
// investigations are data, while shipped examples and action adapters are code.
const files = execFileSync(
  'git',
  ['ls-files', '-z', '--', '*.js', '*.mjs', '*.cjs'],
  { encoding: 'utf8' }
)
  .split('\0')
  .filter(
    (file) =>
      file && !/^(?:docs\/case-studies|dev\/log|experiments)\//.test(file)
  );

if (!files.length) {
  console.error('::error::Syntax gate found no tracked JavaScript files');
  process.exit(1);
}

let failures = 0;
for (const file of files) {
  console.log(`Checking ${file}...`);
  const result = spawnSync(process.execPath, ['--check', file], {
    stdio: 'inherit',
    timeout: 10000,
  });
  if (result.error || result.status !== 0) {
    console.error(
      `::error file=${file}::JavaScript syntax check failed${result.error ? `: ${result.error.message}` : ''}`
    );
    failures++;
  }
}
console.log(`Syntax check: ${files.length} file(s), ${failures} failure(s)`);
process.exitCode = failures ? 1 : 0;
