// Compare the entire tracked union, including local-only files. Evidence itself
// is excluded to keep the inventory stable when this report is regenerated.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const output = 'dev/log/issues/5/pulls/6/sources';
const tracked = (root) =>
  execFileSync('git', ['-C', root, 'ls-files', '-z'], { encoding: 'utf8' })
    .split('\0')
    .filter((file) => file && !file.startsWith('dev/log/'));
const digest = (root, file) =>
  createHash('sha256')
    .update(readFileSync(join(root, file)))
    .digest('hex');
function category(file) {
  if (/^(?:\.github\/|scripts\/|\.husky\/)/.test(file)) {
    return 'pipeline: see audit.md functional comparison';
  }
  if (/^(?:docs\/case-studies\/|experiments\/)/.test(file)) {
    return 'historical research: retain, do not import as product behavior';
  }
  if (/^(?:tests\/|eslint-rules\/)/.test(file)) {
    return 'acceptance and policy tests: preserve or strengthen';
  }
  if (/^(?:src\/|bin\/|examples\/)/.test(file)) {
    return 'language/product behavior: retain local APIs and shipped examples';
  }
  if (
    /^(?:docs\/|changelog.d\/|\.changeset\/)/.test(file) ||
    /\.(?:md|png|svg)$/.test(file)
  ) {
    return 'documentation, release fragments or assets: retain local project content';
  }
  return 'tooling/configuration: see audit.md language and dependency decisions';
}
const local = new Set(tracked('.'));
for (const [label, root] of [
  ['javascript', process.argv[2]],
  ['python', process.argv[3]],
]) {
  if (!root) {
    throw new Error('Supply both immutable template checkouts');
  }
  const remote = new Set(tracked(root));
  const counts = {};
  const rows = ['status\tpath\tlocal-sha256\ttemplate-sha256\tdisposition'];
  for (const file of [...new Set([...local, ...remote])].sort()) {
    const left = local.has(file) ? digest('.', file) : '';
    const right = remote.has(file) ? digest(root, file) : '';
    const status = !left
      ? 'template-only'
      : !right
        ? 'local-only'
        : left === right
          ? 'identical'
          : 'different';
    counts[status] = (counts[status] || 0) + 1;
    rows.push([status, file, left, right, category(file)].join('\t'));
  }
  writeFileSync(
    `${output}/${label}-complete-comparison.tsv`,
    `${rows.join('\n')}\n`
  );
  console.log(
    label,
    execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], {
      encoding: 'utf8',
    }).trim(),
    counts
  );
}
