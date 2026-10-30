# Dataset and evaluation protocol

## Data inventory and governance

Treat the promised clinical dataset as a future governed input, not as data already
present in this repository. A data steward records collection purpose, consent,
license, permitted training/sharing, retention, region, withdrawal and access for
every source. Real audio is identifiable even after names are removed. Keep patient
and practice identifiers out of Git, public CI, hosted issue comments and model
provider trial accounts.

| Dataset                                                                      | Use and limits                                                                                                                                                                                                 | Access / license / split handling                                                                                                                                                                                     |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [PriMock57](https://github.com/babylonhealth/primock57)                      | 57 mock primary-care consultations, separate doctor/patient channels and human utterance annotations. Good workflow/medical vocabulary smoke input; British mock speech is not Australian clinical validation. | Publisher CC BY 4.0; Git LFS for full audio. Ten cropped doctor utterances are redistributed with attribution, immutable revision, source/frame/clip hashes in `examples/speech-lab/public/samples`.                  |
| [AMI](https://groups.inf.ed.ac.uk/ami/download/)                             | Meeting corpus with headset/lapel/array recordings, annotations and controlled multichannel comparisons. Nonmedical meetings differ from a consultation.                                                       | Published audio/transcripts covered by CC BY 4.0 with publisher exceptions checked per artifact. Split speakers/meetings, not random snippets.                                                                        |
| [CHiME-6](https://chimechallenge.github.io/chime6/overview.html)             | Real home conversations, multiple arrays, reverberation and overlap; test channel synchronization and robustness.                                                                                              | Check challenge data license/access separately before downloading/redistributing. Keep official disjoint speaker/home splits. It is not a medical corpus.                                                             |
| [Common Voice / Mozilla Data Collective](https://mozilladatacollective.com/) | Accent and device coverage for generalization probes. Validate actual Australian metadata and subgroup sample size rather than infer representativeness from English alone.                                    | Current distribution requires account/terms review; record release/license per artifact. Avoid legacy mirrors with unclear provenance or redistribution permission.                                                   |
| [ACI-BENCH](https://arxiv.org/abs/2306.02022)                                | Additional ambient clinical note-generation evaluation; ASR accuracy and note accuracy are separate outcomes.                                                                                                  | Verify repository license, audio availability and reference derivation before use. Never score a note paraphrase as a verbatim transcript.                                                                            |
| Consented Australian practice recordings                                     | Primary selection/validation input: local accents, specialties, telehealth, room noise, masks, interruptions and patient diversity.                                                                            | Data steward + clinical lead approve capture in AU. Separate evaluation consent from reuse for training/support; de-identify references under controlled access while retaining protected originals for adjudication. |
| Synthetic cases / silence / adverse examples                                 | Reproducible regression, numbers, decimal doses, negation, commands, cancellation and network failure.                                                                                                         | Original scripts with no patient details. TTS is not evidence of human clinical accuracy. Hold out scripts/voices from tuning.                                                                                        |

A minimal manifest has `sample_id`, audio URI/hash, exact channel/time range,
source/license/consent version, patient/speaker/session/site groups, accent/language,
device/placement, processing chain, duration/rate/channels, reference text and
annotation revision, speaker/time spans, split and permitted uses. Store provenance
for corrections and uncertain/unintelligible spans. Use stable opaque identifiers;
put sensitive grouping metadata in the AU access-controlled store.

The demo's smaller interchange format deliberately uses exact unique filenames and
optional reference strings. It supports 1–20 files, 25 MiB/file, 100 MiB/batch,
120 seconds/file, at most stereo/96 kHz decoded output. Web Audio's context rate
is recorded as `decodedSampleRate`; it is not the original codec sample rate.
Unknown references fail
before inference. Empty string explicitly annotates silence; missing reference
produces a transcript with **no** accuracy score. Export retains audio SHA-256,
checkpoint/runtime settings, raw text/chunks, accepted word times and timings.

## Annotation and separation

1. Inventory and deduplicate by full audio hash and perceptual similarity; group
   overlapping windows and both sides of a conversation together. Prevent a
   patient's repeat visit or room-identical excerpt crossing splits.
2. Two trained annotators transcribe verbatim independently on an initial sample;
   a clinician adjudicates drug names, dose/unit/frequency, allergy/negation,
   temporality and patient attribution. Track disagreement and uncertainty labels.
3. Define treatment of filled pauses, punctuation, partial words, numbers and
   unintelligible spans before looking at predictions. Keep raw and normalized
   references. Annotators should not see the candidate model text while creating
   the gold reference.
4. Assign patient/speaker/session/site-disjoint train/dev/calibration/test sets,
   initially about 60/15/10/15% by group if enough independent groups exist.
   With small data use grouped cross-validation and retain an untouched external
   site/temporal lockbox. Do not treat the suggested proportions as adequate size.
5. Freeze test data/hash, scoring version, vocabulary and operating thresholds.
   Only dev informs preprocessing/model choices; calibration estimates thresholds;
   test is opened once per preregistered release comparison. A new holdout is needed
   after repeated decisions contaminate the old test.

Begin with 10 public clips for functionality, then a proposed 10-hour consented
pilot across at least 20 independent speakers and several recording conditions.
Use pilot variance and safety-event frequency to power the subsequent study;
100+ hours/site-diverse coverage is an illustrative acquisition stage, not a
statistical sufficiency claim. Seek deliberate coverage of Australian regional,
Aboriginal and Torres Strait Islander, migrant and non-native accents through
appropriate consent/community engagement, without treating demographic labels as
proxies for quality. Report missing groups and confidence intervals explicitly.

## Metrics and medical error review

WER = `(substitutions + deletions + insertions) / reference words`. CER uses
characters with the declared whitespace convention. Aggregate by total errors /
total reference length, not mean percentage over clips. Report counts alongside
rates. WER can exceed 100%. For a known silent reference with inserted speech,
report insertion count and undefined per-file rate; include errors in the corpus
numerator. Missing references are excluded from accuracy denominators. An empty
batch or zero successful items is a failed evaluation, never a perfect score.

Native code lowercases/NFKC-normalizes, strips most punctuation, keeps decimals,
letters/numbers/apostrophes, and removes spaces for CER. It deliberately does not
map `0.5` to `05` or normalize away negation. This transparent research score is not
an equivalence claim for `five milligrams` vs `5 mg`; report a separately versioned
clinical normalization score when that policy is agreed. Keep both scores and
unaltered text.

For every candidate label errors by medication, dose, unit, route, frequency,
allergy, negation, laterality, time, speaker/patient and unsupported insertion.
Measure critical concept precision/recall and exact dose-unit tuple accuracy;
count “no allergy” → “allergy” separately even if overall WER is low. Score
speaker-attributed WER, diarization error (including overlap policy) and timestamp
boundary error on a human-timed subset. Measure omissions/hallucinations on silent,
noise-only, clipped, whispered, overlapped and out-of-language audio.

Clinical utility also includes correction seconds/minute, proportion of notes
requiring material amendment, task completion, clinician workload and wrong-patient
or unauthorized-action events. For summaries score source support, omission,
contradiction and attribution independently of ASR. Clinician sign-off is required;
an LLM-based judge alone is not a medical safety evaluation.

Publish paired bootstrap intervals clustered by speaker/session, stratified
results for specialty/accent/device/noise/overlap, sample sizes and failure rates.
Use paired comparisons on identical raw audio, report adverse cases, and avoid
selecting a model from an uncorrected sweep over the same test set. For zero
observed command failures, a rough 95% upper event-rate bound is `3/n` for
independent trials: zero failures in ten examples proves little. Predefine an
acceptable risk and power the held-out negative-command study accordingly.

## Latency and cost

Define the target before a vendor says “real time.” Measure these with monotonic
clocks from an Australian device over its actual network:

- Capture-to-first useful partial text, and word-end-to-stable-word delay.
- End-of-utterance to final transcript, including VAD/endpoint silence, network,
  queueing, model decoding and postprocessing.
- End-of-command to displayed confirmation proposal; confirmation-to-acknowledged
  CRM operation is a separate metric.
- Cold model load/download, warm-session inference, reconnection and overload
  tail latency. Batch RTF is inference wall seconds / audio seconds; RTF < 1
  alone does not imply subsecond streaming delay.

Proposed research targets: p95 stable partial and command-proposal delay < 1 s,
p95 finalization < 1 s after speech end, p99 separately reported; sustained RTF < 1
at the intended concurrency with no queue growth. These are **targets to test**,
not vendor SLAs or measured guarantees. Endpoint delay, chunk look-ahead and
correction policy compete with accuracy. Sweep 80–320 ms input frames / supported
model chunk sizes, 200–800 ms endpoint silence and supported stabilization modes
on dev; freeze the chosen policy for test. Do not invent unsupported model knobs.

For each shortlisted checkpoint run one warm stream, then proposed 5/10/25
concurrent streams on adequately provisioned Sydney hardware, with finite
5-minute streams and recorded RAM/VRAM, CPU/GPU, queue, thermal/network and failed
requests. Stop on memory preflight failure, saturation or OOM; reduce concurrency,
not acceptance assertions. Compare cold deployment separately. Each run records
software/checkpoint/container digests, hardware, region, audio manifest, parameters,
seed where meaningful, counts and elapsed timings.

Cost per accepted audio hour = API or compute + storage/transfer + preprocessing +
review/correction + monitoring/support. For self-hosting compute effective
cost from measured streams per instance and utilization, including warm idle
capacity, HA and training. Obtain dated AUD quotes and contractual prices at
procurement; do not turn an advertised per-minute price into a complete system
budget. Include annotation and recurrent validation costs.

## Experiment sequence and continuing support

Run E0 deterministic metric/import/command boundaries; E1 actual browser public
clips; E2 matched raw baselines across the eligible engines; E3 microphone/channel
study; E4 one-factor preprocessing ablations; E5 vocabulary/decoding sweeps; E6
streaming concurrency/failure tests; E7 fine-tuning stages; E8 external clinical
pilot with human review. Each has frozen inputs, explicit successes/failures and a
report. Combine only winners that remain better in a controlled joint ablation.

Route reviewed production errors into a consent-approved AU support queue. Separate
triage from trainability, redact support artifacts, assign severity and clinical
owner, add a minimal nonidentifying regression, and sample corrected sessions for
annotation audits. Retraining never consumes support cases automatically. Track
model/data/config version on every correction and retire expired/withdrawn data
from derived training sets under the agreed governance process.
