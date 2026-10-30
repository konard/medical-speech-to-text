import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'test-anywhere';

/**
 * Deprecated packages that `npm ci` still warns about, each with the
 * upstream change that removes it. Anything else deprecated in a lockfile
 * fails this test, and so does an entry here that no longer appears.
 * npm records `deprecated` when it writes a lockfile, so a package that is
 * deprecated later (eslint 9 was) shows up after the next lockfile update.
 */
const KNOWN = {
  'package-lock.json': {},
  '.github/actions/artifact-transport/package-lock.json': {},
  'examples/speech-lab/package-lock.json': {},
  'examples/universal-app/package-lock.json': {},
};

function deprecatedPackages(lockfile) {
  const { packages } = JSON.parse(readFileSync(lockfile, 'utf8'));
  return Object.entries(packages)
    .filter(([, info]) => info.deprecated)
    .map(
      ([path, info]) => `${path.replace(/^node_modules\//, '')}@${info.version}`
    )
    .sort();
}

describe('deprecated packages', () => {
  for (const [lockfile, known] of Object.entries(KNOWN)) {
    it(`${lockfile} has only reviewed deprecated packages`, () => {
      expect(deprecatedPackages(lockfile)).toEqual(Object.keys(known).sort());
    });
  }
});
