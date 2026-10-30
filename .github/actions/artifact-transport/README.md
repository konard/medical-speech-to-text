# Artifact SDK compatibility

This action uses the official `@actions/artifact` client for authentication,
immutable artifact IDs and transport. Two narrowly scoped npm overrides remove
obsolete dependencies without changing the transport API:

- `archiver-utils` uses only `glob.sync`. Its pinned `glob` 13.0.6 replacement
  retains that API; glob 10 is deprecated.
- The SDK's `unzip-stream` name resolves to `unzipper` 0.12.5. Both expose
  `Extract({ path })` and emit `close` after writing files. The older reader uses
  deprecated `Buffer()` constructors. Version 0.12.5 checks directory boundaries
  using `path.relative`, including backslash traversal, instead of a string prefix.

Run `npm ci --prefix .github/actions/artifact-transport --ignore-scripts`, then
`node --pending-deprecation --throw-deprecation experiments/issue-5-artifact-smoke.mjs`.
The native JavaScript probe exercises real archive dependencies, binary and empty
files, nested paths, glob exclusions and both traversal spellings. The Workflows
job additionally uploads/downloads bytes and Pages tar files through GitHub.
Deprecations fail those checks rather than being suppressed.

Remove each override when the official dependency chain supplies a maintained
compatible implementation. Retain both local and hosted roundtrip assertions
when updating versions. Dependency audits cover this lockfile on every PR and
on the weekly security schedule.
