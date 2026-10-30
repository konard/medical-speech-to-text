# Implementation, prior work and reusable libraries

## Delivered browser behavior

The static [speech lab](../../../examples/speech-lab/README.md) imports native
JavaScript scoring/validation/batch behavior from `src/speech`. Actual inference
runs in a module worker using pinned Transformers.js 3.8.1, ONNX Runtime Web and
q8 Whisper tiny/base English revisions. The UI never supplies prerecorded
hypotheses to the model. Test workers are restricted to the explicitly mocked
interface tests; the opt-in model integration test downloads and executes weights.

The demo supports 1–20 audio files (ten supplied), optional exact-filename reference
JSON, raw hypotheses, estimated word times, WER/CER, sequential progress,
per-recording failure, stop/restart, playback/seek highlighting and a provenance
JSON download. No reference means no accuracy score; a blank reference is an
intentional silence reference. A complete transcript stays visible when timing
metadata is incomplete. File, duration, reference and worker limits are explicit.
The model worker terminates on cancellation or its five-minute per-file deadline.

Browser decoding/downmixing/resampling uses Web Audio, one recording at a time.
This is an offline research demonstrator, not microphone streaming. Inference is
CPU WASM with one thread to remain usable within the 2.92 GiB test container.
WebGPU, live capture, speaker separation, note generation, cloud streaming, CRM
writes and clinical deployment are planned separately and are not hidden stubs.

Audio buffers and object URLs remain local. Clear revokes URLs and removes results;
page exit terminates the worker. Model weights may remain in browser storage and
need clearing through browser site-data controls. Downloads contain transcript
content: store them according to the dataset's policy. The public demo retrieves
assets from global GitHub/CDN/Hugging Face infrastructure, exposing ordinary
connection metadata. It is limited to public/synthetic or expressly approved
research data; local inference alone does not establish Australian residency.
The source host's initial notice has its own advertising and an empty confirmation
POST. The hosted test acknowledges it before selecting recordings, waits for
module initialization, records that hosting request separately and preserves the
GET/HEAD-only assertion for application and inference requests.

## JavaScript and adapter inventory

No production Rust path or translation is introduced. Native acceptance tests
were drafted and observed failing before implementation; they remain independent
of the model wrapper. Existing `add`, `multiply`, `delay`, CLI and universal app
behavior are preserved. The callable Rust parity workflow remains opt-in; there
is no assertion that a WASM model proves a native JavaScript port.

| Contract                                | Native JavaScript / adapter                              | Verification and port status                                                                                                                                                                                                      |
| --------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| WER/CER and micro aggregation           | `src/speech/metrics.js`, native JS                       | Medical numbers/negation, missing/blank references, insertion and empty denominator tests. Complete JS implementation; no Rust translation.                                                                                       |
| Input, reference and timing validation  | `src/speech/index.js`, native JS                         | Limits, unsafe/duplicate names, duplicate escaped JSON keys, invalid/gapped/overlapping timestamps. Complete JS implementation.                                                                                                   |
| Sequential batch, failure, cancellation | Native `runBatch`; browser worker lifecycle adapter      | Independent errors/retained statuses plus browser cancellation and decode failure. Native JS complete; Web Worker APIs remain explicit platform adapters.                                                                         |
| Audio input and decode                  | Browser File, Blob URL, AudioContext/OfflineAudioContext | Real WAV decoding, mock invalid decode, duration/rate/channel checks. Native codec is a browser dependency, not a JS decoder port. Codec availability differs across browsers.                                                    |
| Model execution                         | Transformers.js + ONNX Runtime WASM                      | Both pinned Whisper models observed. Weights, tokenizer and native WASM kernels are carried external dependencies; unsupported model families are not offered in the UI. No from-scratch neural inference implementation claimed. |
| Playback/highlighting                   | HTMLAudioElement + actual word intervals                 | Active playback, pause/seek, gap and endpoint assertions; actual-model screenshot. Browser audio clock is a platform adapter. Timing is approximate, not clinical truth.                                                          |
| References/export                       | Native JSON validation; browser download adapter         | Partial references, actual text without references, model/audio provenance and no Blob URLs in export. No durable clinical persistence implemented.                                                                               |
| Command intent                          | Native exact allowlist + browser dry-run presentation    | Explicit mode, negated/quoted/destructive/compound refusals; no executor. Production permission/CRM transaction adapter is intentionally outside demo scope.                                                                      |
| Associative interchange                 | Actual `links-notation` 0.27.1 in reusable example       | Parser round-trip of audio identity, pinned model, Unicode/quotes and word spans. Interchange only; not a graph-engine port.                                                                                                      |
| Deployment                              | Static source or Vite bundle                             | Build, hosted demo and browser checks; production AU-only mirroring/egress gates specified in architecture. Global demo is not an AU deployment.                                                                                  |

If Rust is later added, convert this inventory into a strict machine-readable
readiness gate. Mark every missing, partial, unsupported or carried behavior and
handwritten adapter explicitly; reject those statuses before Rust CI. Preserve
shared acceptance assertions, independently execute both runtimes, pin sources,
regenerate to temporary output and compare artifacts, and use the tested SHA
for every downstream build/package job as required by `docs/javascript-first.md`.
Do not reuse mock tests or equal test counts as proof of parity.

## Lessons from medical-neural-network-ml

Reviewed [the related project](https://github.com/konard/medical-neural-network-ml)
at commit [`5af99ce9419c7847d474e78576514969d1214b2c`](https://github.com/konard/medical-neural-network-ml/commit/5af99ce9419c7847d474e78576514969d1214b2c),
including the README, October audit and latest GPU test templates
([PR #24](https://github.com/konard/medical-neural-network-ml/pull/24)). Its
[audit](https://github.com/konard/medical-neural-network-ml/blob/5af99ce9419c7847d474e78576514969d1214b2c/docs/audit-2026-10-16.md)
records important limits on what executed evidence supports; do not translate an
upstream research plan into a claimed benchmark here.

Reuse: preflight memory and finite workloads, explicit CPU/native/adapter paths,
dataset/source hashes and licenses, real nonempty benchmark outputs, unmatched
model results treated as missing, exact candidate checks, one push coordinator,
ephemeral GPU budgets and cleanup, and no paid cloud jobs triggered merely by an
untrusted PR. Keep requested public data, generated artifacts and failed-run logs
traceable. Do not delete unrelated target directories to make a run fit.

Improve for this task: actual browser inference rather than UI-only evidence,
clinical dose/negation scoring fixtures, explicit missing-vs-silent references,
source frame provenance, invalid timestamp omission, cancellation retaining all
batch statuses, no-upload network observations and a clear distinction between
public CDN assets and an all-Australian clinical deployment. GPU templates are
useful future machinery, but no account-specific GPU test is claimed in this PR.

## Associative stack

The [formal-ai stack document](https://github.com/link-assistant/formal-ai/blob/main/docs/associative-tech-stack.md)
was reviewed at Git blob `8c600c224db0942873c5d79be3018d613233da35` on 2026-10-30.
Apply the stack where it adds explicit identity and provenance rather than adding
every library to an audio pipeline:

| Component                               | Application and boundary                                                                                                                                                                                                                                                                                      |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Links Notation                          | Exchange graph-shaped run provenance. `examples/speech-provenance.js` uses the actual `Link` formatter and parser-tested escaping, rather than inventing a similar-looking syntax. Example generated `.lino` links accompany the actual run.                                                                  |
| Doublets / `link-cli`                   | Proposed production graph for audio hash → channel/span → model run → hypothesis → correction → draft → signature → command proposal → confirmation/transaction. Use the selected upstream transactional engine, crash recovery and backup contract; a JSON object or `.lino` file is not a durable database. |
| `doublets-web` / IndexedDB              | Optional future browser graph cache after testing exact implementation compatibility, persistence, schema migration and export. Not bundled or claimed in this version; clinical authority stays server-side in AU.                                                                                           |
| `lino-objects-codec`                    | Evaluate strict typed object encoding for production interchange; preserve numbers, missing values and revision IDs. This demo exports explicit JSON plus graph provenance and does not pretend a custom serializer is that codec.                                                                            |
| `lino-arguments` / `lino-env`           | Existing repository tooling already uses settings parsing. Reuse for future benchmark CLI/environment configuration with bounds and validation; no secret or transcript values in CLI logs.                                                                                                                   |
| Typed meta-language / IR                | Useful for deterministic schema transformations and a future verified language port. ASR hypotheses remain uncertain observations, not executable AST or commands.                                                                                                                                            |
| `command-stream`                        | Existing CI command orchestration; use for approved engineering operations, not execution of arbitrary recognized speech. A command needs the typed allowlist/permission/confirmation protocol.                                                                                                               |
| Calculator, i18n and development agents | Optional unit validation/localization/research support where justified. No arithmetic model replaces ASR, no development agent receives patient recordings, and no unnecessary runtime coupling is introduced.                                                                                                |

Example conversion, using the repository's pinned dependency:

```sh
node --input-type=module -e 'import {readFileSync,writeFileSync} from "node:fs"; import {provenanceLinks} from "./examples/speech-provenance.js"; writeFileSync("docs/case-studies/issue-1/data/browser-provenance.lino", provenanceLinks(JSON.parse(readFileSync("docs/case-studies/issue-1/data/browser-results.json", "utf8"))));'
```

For production create immutable IDs and typed relationships for patient context,
source times, model/version, correction author/reason, consent and retention scope.
Keep a content hash as integrity evidence, not a public identifier for a patient.
Persist signed record revisions and confirmation transactions atomically with the
selected store; test crash replay, duplicate events and deletion/tombstone rules.
Retrieval of a source span must obey the same authorization as the recording.
