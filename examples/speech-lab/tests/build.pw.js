import { test, expect } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

test('production builds reject warnings and preserve Vite CLI options', () => {
  const root = mkdtempSync(join(tmpdir(), 'speech-build-'));
  try {
    writeFileSync(
      join(root, 'index.html'),
      '<script type="module" src="/main.js"></script>'
    );
    writeFileSync(join(root, 'config.js'), 'export const value = 42;');
    const build = () =>
      spawnSync(
        process.execPath,
        [
          fileURLToPath(
            new URL('../node_modules/vite/bin/vite.js', import.meta.url)
          ),
          'build',
          root,
          '--config',
          fileURLToPath(new URL('../vite.config.js', import.meta.url)),
          '--base',
          './',
          '--mode',
          'production',
        ],
        { encoding: 'utf8', timeout: 30000 }
      );
    writeFileSync(
      join(root, 'main.js'),
      "import {value} from './config.js'; import('./config.js').then(m => console.log(value, m.value));"
    );
    const warning = build();
    expect(warning.status).not.toBe(0);
    expect(warning.stdout + warning.stderr).toContain(
      'Vite emitted build warnings'
    );
    writeFileSync(
      join(root, 'main.js'),
      "import {value} from './config.js'; console.log(value);"
    );
    const clean = build();
    expect(clean.error, clean.stdout + clean.stderr).toBeUndefined();
    expect(clean.status, clean.stdout + clean.stderr).toBe(0);
    expect(readFileSync(join(root, 'dist/index.html'), 'utf8')).toContain(
      'src="./assets/'
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
