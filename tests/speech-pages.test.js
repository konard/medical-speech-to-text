import { describe, expect, it } from 'test-anywhere';
import { readFileSync } from 'node:fs';

const workflow = readFileSync(
  '.github/workflows/example-app.yml',
  'utf8'
).replaceAll('\r\n', '\n');
const web = workflow.split('\n  web-build:')[1].split('\n  pages-deploy:')[0];

describe('medical research Pages entrypoint', () => {
  it('publishes the speech lab and keeps the universal app artifact', () => {
    expect(web).toMatch(/pages: 'true'\s+path: examples\/speech-lab\/dist/);
    expect(web).toMatch(
      /name: universal-example-web\s+path: examples\/universal-app\/dist/
    );
    expect(web).toContain('npm --prefix examples/speech-lab run build');
    expect(web).toContain('npm ci --prefix examples/speech-lab');
  });
  it('tests the built site at the Pages subpath with real models before uploading', () => {
    expect(web).toContain('node experiments/issue-7-serve-pages.mjs');
    expect(web).toContain('npm --prefix examples/speech-lab run test:pages');
    expect(web).toContain('npm --prefix examples/speech-lab run test:model');
    expect(web.indexOf('run test:model')).toBeLessThan(
      web.indexOf('name: Upload GitHub Pages artifact')
    );
    expect(web).toContain('http://127.0.0.1:4175/medical-speech-to-text/');
  });
  it('rebuilds when speech lab or deployment contract tests change', () => {
    const triggers = workflow.split('\npermissions:')[0];
    expect((triggers.match(/'examples\/speech-lab\/\*\*'/g) || []).length).toBe(
      2
    );
    expect((triggers.match(/'experiments\/issue-7-\*\*'/g) || []).length).toBe(
      2
    );
    expect(
      (triggers.match(/'tests\/speech-pages.test.js'/g) || []).length
    ).toBe(2);
  });
});
