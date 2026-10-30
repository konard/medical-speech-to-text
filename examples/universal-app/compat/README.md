# Desktop dependency compatibility

Development and packaging use Node.js 24, as documented in CONTRIBUTING.md.
The scoped overrides retain electron-builder and electron-winstaller while
removing their deprecated glob 7, inflight and rimraf 2 dependency chains.

`@electron/asar` 4.3.1 is a released ESM implementation. Node 24 can load its named
exports through the existing CommonJS consumers. The native desktop probe runs
the actual builder's `createPackageFromStreams` call, packed/unpacked byte reads,
archive metadata checks and electron-winstaller import. CI also packages the
application on Linux, macOS and Windows. Remove this override when the consumers
adopt a maintained ASAR version themselves.

## Native cleanup adapter inventory

Only `temp` 0.9.4 receives the local `temp-rimraf` adapter. Its four cleanup call
sites use literal paths, callback or synchronous removal and `maxBusyTries: 6`.
The adapter maps these contracts to Node's `fs.rm` / `fs.rmSync`, including
recursive removal, missing-path success and bounded busy-file retries. Tests
cover both APIs, literal bracket characters, missing paths and symlink removal
without deleting its target. The desktop probe additionally runs temp's actual
async file/directory and synchronous directory cleanup implementations.

This is a native JavaScript adapter, not a Rust translation or a general rimraf
replacement. Glob patterns and other rimraf options are unsupported; unknown
options and invalid retry counts fail explicitly before deletion. The override
is scoped to the reviewed consumer. No missing or carried Rust behavior is
represented as ready by this adapter. Remove it when temp or its consumer
replaces the obsolete dependency. Preserve the refusal and filesystem tests.

Run `node --pending-deprecation --throw-deprecation experiments/issue-5-desktop-smoke.mjs`
after installing this example, and `node --test tests/temp-cleanup.test.js` from
the repository root. The deprecated-package gate covers all four npm lockfiles
and now permits no deprecated dependency.

Sources: [ASAR releases](https://github.com/electron/asar/releases),
[temp cleanup implementation](https://github.com/bruce/node-temp/blob/master/lib/temp.js),
[Node removal API](https://nodejs.org/docs/latest-v24.x/api/fs.html#fsrmpath-options-callback).
