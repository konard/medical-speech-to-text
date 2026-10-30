# Artifact SDK compatibility

This action retains the official `@actions/artifact` client for authentication,
immutable artifact IDs, digests and transport. Scoped npm overrides pin the
SDK's original `unzip-stream` 0.3.4 and replace `archiver-utils`' deprecated glob
with glob 13.0.6, which preserves its only used API, `glob.sync`.

Downloads use the SDK's documented `skipDecompress` option, then `zip.js` 2.24.0
for extraction. The SDK's old reader constructs deprecated `Buffer` instances.
An initial unzipper alias fixed that deprecation but introduced four low
OpenSSF Scorecard dependencies; it was replaced after reviewing the full CI log.
The security threshold and warning reporting remain unchanged. zip.js has no
runtime dependencies and supports ZIP64 and streamed decompression.

## Native adapter inventory

`extract.mjs` implements the JavaScript filesystem/download adapter; it is not a
Rust translation. All behavior used by this action is implemented and tested:

| Contract                                  | Implementation and verification                                                                                                                                                                                            |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SDK transport, retries and digest results | Raw download into an owned temporary directory; reject missing/extra files and digest mismatches. The existing transport helper retries transient failures. Hosted roundtrip exercises the actual SDK.                     |
| Complete extraction before success        | Await each file's streamed writer; return the destination only after extraction. The native probe checks bytes immediately after return.                                                                                   |
| Bounded memory and ZIP64                  | Read a disk-backed Blob; decompress one entry at a time without workers or whole-archive memory buffering. The probe uses real ZIP64 metadata with finite small files.                                                     |
| Names and safety                          | Preserve binary, empty, nested and dot-prefixed files. Refuse traversal in either slash spelling and pre-existing destination symlinks. Archive symlinks remain ordinary data files, matching the SDK's original behavior. |
| Corruption and cleanup                    | Verify CRC32; propagate malformed archive, filesystem and transport errors. Remove only the owned download directory on success and failure.                                                                               |

Password-protected/split archives are not emitted by this action and are outside
its transport contract. Concurrent untrusted modification of the destination is
not supported; jobs own their output directories. No partial or carried behavior
is represented as execution parity for the JavaScript-first Rust example.

Run `npm ci --prefix .github/actions/artifact-transport --ignore-scripts`, then
`node --pending-deprecation --throw-deprecation experiments/issue-5-artifact-smoke.mjs`.
The native probe exercises real archive dependencies, glob exclusions, ZIP64,
binary/empty/nested files, traversal, CRC failure, symlinks and cleanup. The
Workflows job additionally uploads/downloads bytes and Pages tar files through
GitHub. Deprecations fail these checks rather than being suppressed.

Remove the glob override when its consumer supplies a maintained compatible
dependency. Remove the extraction adapter and reader pin when the official SDK
provides a maintained reader without runtime deprecations. Retain the local and
hosted assertions when updating versions. All four locks are audited on every
PR and the weekly security schedule.
