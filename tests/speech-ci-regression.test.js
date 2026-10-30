import { readFileSync } from 'node:fs';
import { it, expect } from 'test-anywhere';
it('installs GitHub CLI in the preview container before its first use', () => {
  const workflow = readFileSync('.github/workflows/example-app.yml', 'utf8');
  const preview = workflow.split('  preview-regen:')[1];
  const install = preview.indexOf('name: Install GitHub CLI');
  expect(install).toBeGreaterThan(0);
  expect(install).toBeLessThan(preview.indexOf('gh auth setup-git'));
});
