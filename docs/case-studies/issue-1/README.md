# Medical speech research: issue 1

Research date: **30 October 2026**. Scope: verbatim medical history, reviewed
clinical documentation, and explicit commands to a CRM or another system. The
original [issue](https://github.com/konard/medical-speech-to-text/issues/1) asks for
an entire research plan and a working browser experiment. This case study supplies
both. It does not assert that a small browser model is clinically validated.

Start with the [requirement inventory](requirements.md), then use:

| Decision                                                   | Evidence and implementation                                                                            |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Which engines should be compared?                          | [20 solution families and clinical products](solutions.md)                                             |
| How can every processing step stay in Australia on Amazon? | [Architecture, residency and access](architecture.md)                                                  |
| How will we establish quality and subsecond latency?       | [Dataset and evaluation protocol](evaluation.md)                                                       |
| Which microphones and processing should we try?            | [Capture and signal processing experiments](audio.md)                                                  |
| When should we fine-tune or build a model?                 | [Lifecycle and escalation gates](lifecycle.md)                                                         |
| Which existing components and prior experience are reused? | [Implementation and associative stack](implementation.md)                                              |
| What actually ran?                                         | [Verification and observed results](verification.md), [raw browser results](data/browser-results.json) |
| Where did the claims come from?                            | [Dated primary-source register](sources.md)                                                            |

The recommended first production experiment pairs Amazon Transcribe in Sydney
with self-hosted NVIDIA streaming ASR and Whisper on Australian AWS compute.
Compare raw capture against carefully controlled preprocessing; acquire good
per-speaker audio before increasing model size. Selection depends on the locked
clinical evaluation, Australian processing evidence, latency and reviewer effort.
There is no universal best model or microphone independent of the room, accents,
clinical vocabulary and deployment hardware.

## Try the experiment

[Open Speech Lab](https://raw.githack.com/konard/medical-speech-to-text/issue-1-362226f4199c/examples/speech-lab/index.html).
Select **Try 10 public consultation clips**, then **Transcribe recordings**.
Alternatively select 1–20 local audio files and optionally supply a JSON object
mapping exact filenames to reference transcripts. Play a recording or select a
word to seek. Export includes actual text, timing, metrics and provenance.

The public demo runs Whisper locally using pinned Transformers.js and ONNX
weights. It downloads code and models from public CDNs; it is for public or
synthetic data. An Australian browser location does not establish an Australian
hosting contract for every dependency. The [restricted deployment design](architecture.md)
mirrors assets, restricts endpoints and keeps all clinical data and processing
inside the approved Australian boundary.

```sh
npm ci
npm --prefix examples/speech-lab ci
npm --prefix examples/speech-lab run dev
npm --prefix examples/speech-lab run test:browser
npm --prefix examples/speech-lab run test:model
```

The last command downloads and executes real models; the normal browser tests
use an explicit test-only model substitute. See the [demo README](../../../examples/speech-lab/README.md)
for controls, limits, attribution and reproducibility. No model weights or private
patient recordings are committed. Ten attributed public mock-consultation clips
are included so the experiment can be reproduced.

## Interpretation of scope

Planning fine-tuning, training from scratch, AWS provisioning and a clinical pilot
is part of this issue. Claiming these future research stages were executed without
the promised private dataset, hardware or accounts would be misleading. Each stage
below has inputs, ownership, experiments and exit criteria. Implemented browser
behavior and measured outcomes are identified separately. No required sub-issues
or issue/PR comments existed when the initial inventory was collected; the original
request is preserved in [data/issue.json](data/issue.json).
