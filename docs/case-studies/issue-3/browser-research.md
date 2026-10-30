# Browser and device research

Research date: 2026-10-30. [Sources](sources.md) are primary upstream documentation.
Gallery reference revision is preserved in [gallery-sha.txt](data/gallery-sha.txt).
Gallery is a native Android/iOS showcase with a macOS preview and Android XR
example in the captured revision. Its LiteRT-LM and OS integrations are not
interchangeable with a browser JavaScript runtime.

## Gallery practices and browser decisions

| Gallery practice / feature                                                   | Browser implementation or explicit unsupported item                                                                                                                                                            |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discover model/task before downloading                                       | Separate Transcribe/Local chat modes, English names, weight estimates and prepare button; selecting a mode alone does not fetch weights.                                                                       |
| Local inference and visible model status                                     | Real worker pipelines; progress/status, ready state, cold/warm timings. No automatic cloud fallback. CDN requests still disclose IP/request metadata.                                                          |
| Download and resource management                                             | Browser HTTP/Transformers cache, one active model, unload/stop terminates worker, delete only own immutable model entries. Quotas/eviction remain browser controlled.                                          |
| Task-specific chat and speech experiences                                    | Independent chat history, no implicit transcript/system injection, incremental text, bounded context and reply length. Speech retains raw words, timing and scores.                                            |
| Long task cancellation                                                       | Worker termination, abort sample/service requests, microphone-track cleanup on stop/error/page exit, 5-minute model request deadline. Denied permission and cancellation are recoverable.                      |
| Benchmark and compare                                                        | Exported model/audio provenance, timing, reference WER/CER, service disagreement; separate real-model tests. No vendor benchmark is presented as a measured browser result.                                    |
| Prompt Lab: sampling and parameter experiments                               | Chat deliberately uses deterministic decoding and a 128-token reply bound. No unsupported sampling controls; compare quality and repeatability before exposing alternative generation settings.                |
| Audio Scribe: transcription and translation                                  | Actual English transcription is implemented. Live partial transcription and translation require different checkpoint/streaming contracts and bilingual evaluation; neither is silently inferred from file ASR. |
| Voice chat / text-to-speech                                                  | Text chat and foreground speech recording are separate. Speech synthesis is not implemented; a future adapter must verify local voice availability and avoid an implicit remote synthesis service.             |
| Agent Skills, Mobile Actions and Tiny Garden / FunctionGemma                 | No tool or agent execution. Retained CRM command detection is a dry run; device actions and skill downloads need separate permissions, confirmation, provenance and refusal tests.                             |
| Ask Image, Instant Media Search, Video Moment Finder and XR Language Teacher | Image/video indexing, camera/AR access and multimodal teaching are unsupported task families. Reuse explicit download, cancellation, resource and consent patterns if those tasks are separately specified.    |
| Device suitability                                                           | Secure-context/API capability check and portable CPU/WASM single-thread baseline. WebGPU presence displayed separately, not equated with a validated GPU or sufficient memory.                                 |
| Native Android/iOS model manager/background tasks                            | Unsupported in a tab: no guaranteed background execution, package installer, filesystem persistence or model registry. Reopen/foreground requirements and cache limits are explicit.                           |
| Native audio/OS services                                                     | Browser MediaRecorder/Web Audio adapter, explicit permission, bounded mono capture. No promise of native multichannel, wake-word, continuous background listening or hardware acceleration parity.             |
| Multimodal agents/tools, image/audio generation, location and device actions | Outside requested chat/ASR scope. No hidden tools, device actions, automatic clinical note generation or CRM writes. Future additions require explicit contracts and tests.                                    |
| LiteRT-LM inference / Gallery model formats                                  | Unsupported translation, not carried code: this demo executes compatible ONNX weights with Transformers.js. Gallery task/model files cannot simply be loaded into this runtime.                                |

No Gallery source was copied into production code. React and the existing speech
core provide web behavior. The Gallery repository README is a research snapshot;
its upstream Apache-2.0 license is included with that snapshot.

## Existing libraries and model options

| Candidate                                    | Advantages                                                                                      | Decision / validation gate                                                                                                                                                                                                           |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Transformers.js 3.8.1 + ONNX Runtime Web     | One worker API for Whisper and text generation, WASM baseline, progress, cache, streamed tokens | Selected pinned tested runtime; conservative one-thread q8 ASR/q4 chat. Validate checkpoint-specific quantization and model format rather than assuming every Hub model works.                                                       |
| LiteRT.js                                    | Google's browser WASM/WebGPU path; relevant to Gallery ecosystem                                | Research alternative; validate supported converted model, tokenizer, timestamps, cancellation and memory before swapping runtime. Native LiteRT-LM is not this JS API.                                                               |
| WebLLM                                       | Browser LLM runtime and WebGPU specialization                                                   | Alternative for larger chat models on qualifying GPUs; fails the broad CPU baseline. Compare real devices, download/memory and first-token delay before adding.                                                                      |
| whisper.cpp WASM / sherpa-onnx WASM          | Dedicated speech engines, streaming checkpoint choices                                          | Alternative for live captions/command latency; requires a separate native adapter and license/hash/word-time/streaming tests. No fabricated port exists here.                                                                        |
| Browser SpeechRecognition `processLocally`   | OS-provided local language pack when supported                                                  | Experimental, uneven browser/language support. Require feature detection, local pack availability/install and `processLocally=true`; default implementations can send audio to a remote service. Never use as an invisible fallback. |
| Web Audio + MediaRecorder                    | Browser permission, capture, audio decode and conversion                                        | Selected bounded foreground capture; fake-device browser test exercises actual encoder and released tracks. Codec availability and applied DSP vary.                                                                                 |
| React 19.2.0                                 | Explicit task/state rendering and accessible controls                                           | Pinned npm dependency for build, matching source import map for static online hosting. No JSX build requirement for raw-source hosting.                                                                                              |
| Whisper tiny.en/base.en q8                   | Known compatible English baseline, word chunks, manageable models                               | Retained two choices and exact revisions. Local quality is measured; neither is clinical-grade or guaranteed realtime.                                                                                                               |
| SmolLM2-135M-Instruct q4                     | Small compatible instruction model, Apache-2.0 model metadata, CPU feasible                     | Added English local chat. Exact Hub revision and weight bytes in data. Not a medical model; smallness trades quality for access and does not guarantee phone memory safety.                                                          |
| Larger SmolLM/Gemma/Qwen browser conversions | Potential response-quality improvement                                                          | Future device-specific comparison only after ONNX/tokenizer/template/license verification and cold/warm memory/latency tests. Keep one selected pipeline and stop on allocation failure.                                             |

## Device support and test matrix

These are capability targets, not claims of physical-device validation. There is
no API exposing a reliable browser free-memory budget. Download bytes understate
loaded weight, tensor, decoder and browser memory; avoid parallel model instances.
The container validation itself has a 2.92 GiB budget and uses one browser worker.

| Device / browser                                                     | Baseline expectation and failure handling                                                                        | Evidence / required physical check                                                                                                                                                                                            |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Desktop Chromium, recent Chrome/Edge, HTTPS/localhost                | Worker, WebAssembly, Web Audio and cache usually available; CPU baseline, microphone permission required         | Automated actual Chromium ASR/chat/capture and deterministic UI tests. Record browser/OS in exported results.                                                                                                                 |
| Android Chrome, low/mid/high-memory phone                            | Same feature checks, CPU slow/thermal pressure, possible process eviction                                        | 320/390px viewport assertions and screenshots are layout evidence only. Physical 4/6/8GB-class phones: cold/warm tiny, base/chat opt-in, lock/suspend/permission/reload tests and OS process-memory observations.             |
| iPhone/iPad Safari                                                   | Check Worker/WASM/Web Audio/MediaRecorder individually; MIME and storage eviction differ; foreground constraints | Not physically executed. Test recent supported iOS/iPadOS hardware with actual recordings, denied permission, format fallback, tab resume, memory termination and rotation. Native Gallery iOS support is not web validation. |
| macOS Safari / desktop Firefox                                       | CPU path conditional on APIs/codecs, GPU availability irrelevant to baseline                                     | Not physically executed. Run browser suite and real models, verify WAV/browser recording decode and cache/storage behavior.                                                                                                   |
| Insecure HTTP, no WASM/Worker/Web Audio, embedded restricted webview | Inference disabled with explanation; microphone unavailable; no cloud fallback                                   | Native capability negative tests; browser failure paths. Use HTTPS and a supported browser, or an explicitly approved server comparator.                                                                                      |
| Offline after warm model                                             | Loaded pipeline can execute without network; cached files alone may omit runtime/tokenizer/app code              | Actual warm offline chat check; no service worker or full offline installation claimed. Reload-offline needs all app/runtime/model resources packaged and tested first.                                                       |

Run the physical matrix on public samples first: record exact OS/browser, CPU/GPU,
RAM class, storage availability, model revision, cold load bytes/time, first text,
inference RTF, p50/p95 warm latency, thermal state, crash and eviction observations.
Pair microphone speech/noise with reference transcripts and medical-entity review.
Repeat foreground/background, low disk, airplane mode, denied/revoked permission,
slow network, stop during download/inference, model switch and deletion. Pass only
if all contract assertions hold; classify unsupported devices explicitly. Do not
increase timeouts to conceal resource failure or infer quality from screen size.

The issue 1 microphone/hardware and preprocessing protocols remain the required
quality experiment. The browser requests mono echo cancellation, noise suppression
and AGC for convenient recording, but these are requests rather than verified DSP.
Preserve lossless raw synchronized channels on the reference rig and compare DSP
ablations; no headset/array purchase or multi-microphone improvement was measured.
