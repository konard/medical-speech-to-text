# Verification and native adapter inventory

This record distinguishes deterministic contracts, actual model execution,
physical-device coverage and external blockers. Test doubles are confined to
Playwright route interception. No production transcript or reply is hard-coded.

## Reproduction and checks

The previous demo had no chat/capture/model-management interface, desktop-first
layout and no React state. Open it at the original issue 1 branch URL to reproduce.
[Before](../../screenshots/speech-lab/issue-3-before.png) and
[after](../../screenshots/speech-lab/issue-3-after.png) are real Playwright MCP
390px screenshots. Native device and missing-CLI tests were run red before their
implementation (`ci-logs/device-red.log`, `ci-red.log`).

The pending-permission cancellation regression was also reproduced before its fix
(`ci-logs/capture-pending-red.log`): Stop left every input disabled while waiting
for `getUserMedia`. The per-request cancellation guard now releases the UI
immediately and stops a subsequently granted stream. Real browser
[before](../../screenshots/speech-lab/issue-3-permission-before.png) and
[after](../../screenshots/speech-lab/issue-3-permission-after.png) captures show
the same stopped task.

```sh
npm ci
npm --prefix examples/speech-lab ci
npm run check
node --test --test-concurrency=2 --test-timeout=30000 tests/*.test.js
npm --prefix examples/speech-lab run build
CHROME_PATH=/usr/bin/google-chrome npm --prefix examples/speech-lab run test:browser
CHROME_PATH=/usr/bin/google-chrome npm --prefix examples/speech-lab run test:model
```

`CHROME_PATH` is optional if Playwright's Chromium is installed. The normal
browser suite explicitly skips network/model tests; `test:model` sets `REAL_ASR=1`
and runs both actual speech models plus chat. For immutable local model validation,
serve the built `dist/` with `npm --prefix examples/speech-lab run preview -- --port 4175`
and set `SPEECH_LAB_URL=http://127.0.0.1:4175`. This avoids development reloads.
One early run was invalidated by a source edit/live reload and discarded; it is
not counted as successful evidence. Model executions are sequential to respect
the shared 2.92 GiB container memory budget.

## Native JavaScript and browser contracts

| Area                                                | Evidence                                                                                                                                                                                                                                                                                                                     |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Capability/chat/WAV/service/cache/worker boundaries | `tests/speech-device.test.js`: unavailable capabilities; valid and oversized prompts/roles; actual RIFF negative/full-scale samples; HTTPS and consent; malformed/oversized/HTTP response failures; preserve unrelated cache entries; serialize/stream/stop/retry inference.                                                 |
| Workflow regression                                 | `tests/speech-ci-regression.test.js`: CLI prerequisite before the failing container auth path. Existing workflow/security/release tests retained.                                                                                                                                                                            |
| Existing behavior preservation                      | `tests/speech.test.js` and `workbench.pw.js` keep all acceptance assertions. Only worker route matching expands to include Vite's production hashed filename. Ten files, partial/missing references, word-clock/play/seek/gaps, provenance, export, validation, decode failure continuation and cancellation remain checked. |
| Mobile/chat/consent/capture                         | `device.pw.js`: 320px no overflow; prepare/unload; streamed chat/clear/stop/retry; no early POST; one explicit comparison with no references; endpoint consent reset; denied microphone permission; actual browser encoder/fake microphone and all tracks ended before transcription.                                        |
| Production build                                    | Vite builds React and a module worker; nine browser contract tests pass against the built static assets, two explicit real-model tests skipped in that command.                                                                                                                                                              |
| Actual models                                       | Separate `real-model.pw.js` executes pinned tiny on all ten clips, base on one unreferenced clip and actual local chat; warm offline chat, no application uploads, no page errors and model-cache deletion assertions. Observations are recorded in data after completion.                                                   |

## Native adapters and unsupported behavior

| Native component                               | Contract / boundary                                                                                                                                                                                     |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| React UI (`app.js`, `views.js`)                | Presentation/state adapter around the existing native speech core and DOM playback renderer. Source import map and npm build use matching pinned React versions.                                        |
| Inference worker (`worker.js`, `inference.js`) | One actual Transformers.js pipeline, pinned model/runtime, CPU/WASM single thread, task switch disposal, progress/text streaming, hard stop and finite deadlines. No alternate backend fallback.        |
| Microphone (`capture.js`)                      | Foreground permission/MediaRecorder/Web Audio; mono WAV conversion, duration/byte bounds, track release including late permission cancellation. Not multichannel reference capture or live partial ASR. |
| Browser cache (`device.js`)                    | Only exact demo model/revision URLs inside shared `transformers-cache`; not other user cache names/models. Browser site-data controls remain authoritative for full removal.                            |
| Optional service (`device.js`)                 | Explicit HTTPS/consent/per-recording action, credential-free multipart, bounded response and abort; requires an independently approved deployed service.                                                |
| Samples/playback/export                        | Existing integrity/decoding/scoring/timestamp/command contracts retained; downloads gain cancellation. Raw transcript and missing-reference behavior unchanged.                                         |

There are **no new translations or ports** and no carried runtime behavior marked
ready. Native Gallery-only runtimes/model formats and background/OS capabilities
are explicitly unsupported in the browser and mapped in the research table. No
Rust build or CI path was introduced; future ports must reject missing/partial
inventory entries before Rust runs, as required by `docs/javascript-first.md`.

Physical Android/iOS/Safari/Firefox measurements, clinical validation, multi-mic
trials, AWS provisioning and training remain the original research plan's staged
experiments. They were not executed on absent hardware/private data/accounts.
The strict main CI configuration acceptance remains unfinished as documented in
[the investigation](ci-investigation.md); local tests or green PR checks cannot
turn that into a claimed completion.

## Observed results, 30 October 2026

Node and Bun each passed 1,055 native tests. Deno passed 1,054 with one existing
runtime-specific skip (Deno resolves an npm-style bin symlink differently) and zero failures. Lint, formatting and duplication checks
passed. Root and speech-lab npm audits reported zero vulnerabilities.

Actual Chromium CPU/WASM tiny inference on ten clips from **one consultation**
retained the prior output: **41/147 word edits (27.9% WER)** and **103/583 character
edits (17.7% CER)**. The audio totals 40.94 seconds; this run used 35.60 seconds
of inference plus cold load. Base also produced real text for one clip without
a reference; it is not scored. See [raw results](data/browser-results.json),
[base output](data/browser-base-result.json) and [network](data/browser-network.json).
These are functional observations on public material, not clinical accuracy or
physical-phone performance estimates.

The real chat check generated two replies, including a second reply with the
browser offline, then deleted its five cached model files. The first response to
“What is speech recognition?” was “Spreading your voice through text.” This weak
answer illustrates the small model's quality limit. Warm response status and
all model requests are preserved in [chat observations](data/chat-results.json).
No application audio/chat upload or page error occurred in either model test.
