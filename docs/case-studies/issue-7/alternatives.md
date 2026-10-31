# Missing options and original-task fit

Review date: 31 October 2026. The [previous twenty engine families](../issue-1/solutions.md)
and clinical products remain useful; this adds the missing application and
streaming layers. [Source register](sources.md) pins code and licenses. Stars
are dated discoverability signals, not user counts, clinical evidence or an
exhaustive global popularity ranking. No paid product was benchmarked here.

## Whisper Flow

[`dimastatz/whisper-flow`](https://github.com/dimastatz/whisper-flow) is a Python
FastAPI/PyTorch server and library under MIT, with 1,003 stars and 138 forks at
retrieval. It is distinct from **Wispr Flow**, the commercial dictation product.
The exact inspected revision is recorded in [the SHA receipt](data/whisper-flow-sha.txt);
[protocol](data/whisper-flow/docs__protocol.txt), implementation, license and
requirements are archived alongside it. This review includes current code,
not only the README's older benchmark example.

`/ws` accepts 16 kHz mono signed little-endian int16 PCM binary frames. Optional
`start` configures model, language and vocabulary prompt; `flush` and `stop`
finalize accepted audio. `/ready` exposes wire protocol version, model inventory
and session state; clients must reject unknown versions. HTTP multipart batch
recognition is also available. Only `tiny.en.pt` is bundled; other model files
must be provisioned. A tiny English checkpoint does not establish medical quality.

Streaming repeatedly decodes an uncommitted audio window. The current prefix
commit path compares consecutive word hypotheses and drops committed audio;
finalization can follow silence, stable text, a frame-count cap or explicit
flush. Partials replace the pending segment rather than append. The returned
`segments` describe only the uncommitted tail and use relative times. Integration
needs absolute sample offsets and a segment ledger to preserve correct playback
highlighting across committed prefixes and new segments. Do not infer final-word
timestamps from the server's processing-time field.

Defaults in the pinned source include 600 ms silence endpointing, 64 ms client
frames (1024 samples), a 1000-frame window cap, a 30-second transcription deadline,
128 sessions, one replica per model and eight executor workers. The cap's nominal
64 seconds assumes default-size frames. One model replica serializes its sessions;
eight workers do not mean eight simultaneous decoders. More replicas consume more
RAM/VRAM. `torch` and `numpy` are not version-pinned in upstream runtime requirements;
produce a tested resolver lock and checkpoint hashes before deployment.

The README's latency is measured between partial results, using LibriSpeech.
It does not include every capture/network/endpoint delay and is not an
Australian medical benchmark. Measure speech-sample-to-stable-word and
end-of-speech-to-final latency with actual arrival timestamps, cold/warm model
state, accent/noise/overlap and concurrent sessions. Do not equate repeated-window
Whisper with a cache-aware streaming acoustic model. Compare against existing
NeMo streaming/sherpa candidates and the additional servers below.

`WF_API_KEY` optionally enables header authentication. Browser WebSocket APIs
cannot set arbitrary `x-api-key` headers, so a browser client requires a reviewed
same-origin session gateway; never place a service secret in static JS or a query
string. Keep WSS, authenticated admission, origin policy, per-user quotas, idle and
audio-duration caps, graceful shutdown and AU-only logs/storage in that gateway.
HTTP's 25 MiB upload limit does not bound the WebSocket backlog.

A [finite source probe](../../../experiments/issue-7-whisper-flow-queue.py)
confirms unlimited queue admission independently of the segment cap, under a
256 MiB process limit. [Upstream issue 64](https://github.com/dimastatz/whisper-flow/issues/64)
contains the reproduction, workaround and proposed byte-budget fix. Treat this
as a production admission gate. No full PyTorch/model benchmark was attempted in
the 2.92 GiB container; the probe exercises only the native queue, using a
refusal-only NumPy stub. No model speed or transcription score is inferred.

Recommended experiment: after fixing admission and locking dependencies, deploy
one pinned replica on an appropriately sized Australian AWS host, send the same
public/synthetic clips in paced 64 ms frames, finalize explicitly, and compare
chunk sizes and 1/2/4 concurrent streams. Preserve partial revisions and word
offsets, record p50/p95/p99 end-to-end timings and memory, and score medical terms,
negation, numbers and correction effort. Use no private clinical data until the
entire processing/telemetry/support boundary is approved.

## Additional open application/server families

| Candidate / dated GitHub stars                                                                                         | What to learn or reuse                                                                                          | Fit and admission limits                                                                                                                                                                                                                                                                                                                                      |
| ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Handy](https://github.com/cjpais/Handy), 35,882; MIT                                                                  | Cross-platform offline hotkey → local ASR → text insertion; Silero VAD, Whisper/Parakeet choices.               | Strong minimal native-client comparator. Tauri/Rust adapters are not browser behavior; no imported Rust component or parity claim here. Test permissions, wrong-field insertion, cancel/retry and local model cleanup.                                                                                                                                        |
| [Buzz](https://github.com/chidiwilliams/buzz), 22,323; MIT                                                             | Offline transcription UI, recorded-file and live-input workflows.                                               | Practical evaluator/annotation companion. Desktop availability does not provide clinical record lifecycle or authenticated CRM execution. Recheck exact engine, timestamps and export configuration.                                                                                                                                                          |
| [WhisperLiveKit](https://github.com/QuentinFuxa/WhisperLiveKit), 11,196; Apache-2.0                                    | Self-hosted streaming pipeline, incremental policies, diarization and compatible API surfaces.                  | Compare its current causal Qwen3-ASR path with repeated-window Whisper; backend/weight licenses and speaker models are separate. Complexity and GPU needs require measured operational cost.                                                                                                                                                                  |
| [OpenWhispr](https://github.com/OpenWhispr/openwhispr), 10,455; MIT                                                    | Global dictation, local/cloud choices, transcription import, correction/agent modes and local speaker features. | Useful full-client comparator. Disable cloud/sync/screenshot/agent egress unless each path is approved. Local ASR alone does not constrain the remaining application. Test selected text and focus before inserting.                                                                                                                                          |
| [VoiceInk](https://github.com/Beingpax/VoiceInk), 6,984; GPLv3 text                                                    | macOS-native dictation/shortcuts, personalized workflow and local recognition.                                  | Evaluate signed releases separately from source. GitHub reports `NOASSERTION`; inspected LICENSE is an abbreviated GPLv3 notice, so resolve exact redistribution terms before embedding code. macOS focus limits cross-platform coverage.                                                                                                                     |
| [WhisperLive](https://github.com/collabora/WhisperLive), 4,339; MIT                                                    | Server/client real-time transcription architecture.                                                             | Independent service comparator; verify backend configuration, buffering, TLS/auth and per-session bounds rather than inheriting README latency.                                                                                                                                                                                                               |
| [WhisperStreaming](https://github.com/ufal/whisper_streaming), 3,679; MIT                                              | LocalAgreement streaming reference and reproducible latency research.                                           | Baseline for commit policy tradeoffs. Its current README points to successors; compare maintained implementations and exact engines instead of treating an older benchmark as current best quality.                                                                                                                                                           |
| [Whispering / Epicenter](https://github.com/EpicenterHQ/epicenter/tree/main/apps/whispering), 4,834; AGPL-3.0-or-later | Local-first dictation, shortcuts, configurable transcription and transformation pipeline.                       | Follow the current repository: `braden-w/whispering` is a redirect placeholder, not the active product. Inspect each chosen local/self-hosted/cloud provider and durable-history boundary. The pinned root license assigns current apps AGPL-3.0-or-later; older MIT terms apply only to historical versions. Review redistribution obligations before reuse. |

The last row's current metadata and active app README are separately archived;
we do not use the placeholder's 291 stars as the product's popularity. Product
features in this table are source claims, not local execution receipts.

## Commercial workflow comparators

[Wispr Flow](https://wisprflow.ai/) markets dictation across desktop/mobile apps,
context-aware polishing, personalization and voice editing. Those define useful
UX experiments: capture activation, vocabulary correction, punctuation, edit
intention, focus handling and recovery. The product page's productivity claims
are not clinical accuracy measurements. Its
[data-controls documentation](https://docs.wisprflow.ai/articles/9609615338-private-cloud-sync-and-data-sharing-preferences-in-wispr-flow)
separates model-improvement permission, dictation cloud storage and local history.
Turning model improvement off does not stop cloud processing; both relevant
switches must be checked for dictation zero-retention settings. Reported
examples can be retained. Enterprise privacy controls need product-specific
contract review; no all-Australian processing entitlement was established.

Also evaluate [Superwhisper](https://superwhisper.com/) for configurable dictation
and local/cloud model workflow, [Aqua Voice](https://aquavoice.com/) for
context-sensitive text insertion, and [MacWhisper](https://www.macwhisper.com/)
for file/meeting transcription and dictation review. These are service/UI
comparators, not four interchangeable self-hostable ASR libraries. No license,
account, AU residency or independent superiority is implied by a landing page.
[Talon](https://talonvoice.com/) is a further command/accessibility comparator:
its custom command grammars inform controlled CRM intents, with explicit
patient/focus/confirmation safeguards rather than unrestricted OS macros.

## Shortlist decision

Retain the previous engine shortlist; add Whisper Flow, WhisperLiveKit and
WhisperLive as streaming orchestration challengers, and Handy/OpenWhispr plus a
native macOS option as capture/insertion references. Use the existing browser lab
for public-data reproducibility, not as a claim of OS-wide delivery. Prefer
composition behind a stable, versioned segment protocol; do not fork entire
clients to obtain one microphone button. Filter every option by AU processing,
license, support, medical error rates and operator effort before procurement.
