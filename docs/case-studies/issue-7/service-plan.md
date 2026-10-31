# Plan to match or exceed Wispr Flow for this medical task

The target is a clinician's complete capture → review → signed-history or
confirmed-command workflow. A general dictation product's polished sentence or
model benchmark does not measure that outcome. This extends the original
[lifecycle](../issue-1/lifecycle.md), [AU architecture](../issue-1/architecture.md),
[evaluation](../issue-1/evaluation.md), [microphone/DSP protocol](../issue-1/audio.md)
and [quality-service contract](../issue-3/quality-service.md). It is an executable
research/development plan, not a delivered clinical service or an observed
quality ranking.

## Acceptance contract and experiment design

Compare separately: short foreground dictation, longer doctor/patient consultation,
and explicit CRM commands. Use a locked consented dataset with Australian accents,
quiet/noisy rooms, quiet speakers, masks, medication names, spelling, dose/unit
pairs, negations, numbers, interruptions, silence and overlapping speech. Keep
speakers/patients and repeated sessions out of both train and test partitions.
The demo's ten clips from one mock consultation are a pipeline smoke test only.

Start with 50 public/synthetic paired cases per task to find instrumentation
errors, then a feasibility pilot with 10 consenting clinicians and 200 paired
utterances each, subject to the original governance/ethics protocol. Treat this
sample size as a planning estimate: the statistician must power the confirmatory
study from pilot variance and a predeclared clinically meaningful difference.
A benchmark can be inconclusive, and weak subgroup coverage cannot pass by
averaging it away.

Feed the identical source audio, microphone condition and available patient-free
vocabulary to each eligible engine. If a native vendor cannot import identical
audio, use a fixed calibrated replay/capture rig and disclose that extra acoustic
path; do not silently compare live speech with pristine files. Freeze app/model
versions, region, hardware, hot/cold state and postprocessing settings. Randomize
presentation order and have two blinded clinical reviewers adjudicate reference
text and error severity, resolving disagreement before scoring. Keep raw ASR and
polished output separately; human reviewers must see no vendor identity.

Compare actual installed Wispr Flow with appropriate privacy settings on
public/synthetic data only until its complete regional processing contract is
eligible. If it cannot pass the Australian-data boundary, it remains a synthetic
UX comparator, not a candidate for clinical deployment. A vendor account or
trial is a prerequisite, not presumed access.

| Dimension          | Measurement and proposed go/no-go target                                                                                                                                                                                                                                                                                                                             |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Clinical fidelity  | Count critical medication, dose/unit, allergy, negation, laterality and patient-context errors per 100 utterances, separately for raw and polished text. No silent change to dose/negation and no wrong-patient writes in the acceptance corpus. Any such event blocks release pending review. Finite zero observed errors does not prove zero population risk.      |
| Correction burden  | Clinician active correction seconds per accepted word, number of interactions, abandoned/repeated utterances and time to signed draft. Aim for at least 20% lower median correction burden than the chosen comparator, with a paired confidence interval excluding no improvement and no critical-error regression. This is a project target, not a measured result. |
| Recognition        | WER/CER and medical entity/number exact match with insertion/deletion/substitution breakdown; report speaker/accent/noise/task subgroups. Do not optimize polished WER at the cost of omitted uncertainty.                                                                                                                                                           |
| Streaming          | p50/p95/p99 sample-capture-to-first-partial, sample-to-stable-word, end-of-speech-to-final, revision rate and RTF. Proposed warm p95 stable-text/final target under 1 second at supported concurrency; report cold start separately and refuse to label inter-partial cadence as end-to-end latency.                                                                 |
| Native interaction | Activation-to-record-ready, capture indicator correctness, focus validation, paste/edit latency, undo, permission denial, reconnect, sleep and cancellation. Never insert into a changed patient/field or execute while context is ambiguous.                                                                                                                        |
| Reliability        | Fault-inject disconnects, delayed/lost frames, overload, service restart, slow GPU, model timeout, malformed audio and expired auth. No duplicate confirmed commands or accepted-audio loss without an explicit user error. Proposed service SLO 99.9% monthly availability after capacity testing; define exclusions and recovery objectives before contracts.      |
| Resources/cost     | Measure CPU/RAM/VRAM, per-session backlog, p95 delay and cost per audio minute and accepted clinical note at 1/2/4/8 streams. Include idle GPU, gateways, storage, backup, observability and support, rather than model inference alone.                                                                                                                             |
| Data boundary      | No unapproved egress for recordings, text, prompts, telemetry, model assets, logs, backups, support or training; independent packet/egress-policy review and deletion/restore drill. Region labels or a storage bucket alone cannot pass.                                                                                                                            |

Choose a Pareto frontier for safety, correction time, p95 delay and total cost.
Pre-register superiority/noninferiority rules, paired bootstrap confidence
intervals at clinician/session level, missing-case handling and the reviewer's
severity rubric. Publish failures and excluded conditions along with successes.
Do not claim equivalence merely because a small study lacks statistical power.

## Service and client design

Keep capture, transcription, editing, signed documentation and executable
commands as different stages. A patient-context change invalidates a pending
command. The CRM adapter needs scoped permissions, a validated intent/schema,
explicit human confirmation, an idempotency key, an immutable receipt and a
reconciliation path. OS-wide auto-paste into an arbitrary focused field is not
an adequate clinical write contract.

Use a native client only where OS hotkeys, keyboard/accessibility integration,
background recording or device routing require it. Start with the browser's
explicit foreground workflow and a reviewed native prototype inspired by Handy,
OpenWhispr or VoiceInk. Model downloads, capture indication, pause/stop, editable
retry, unload, cache deletion and consent must remain visible. Separate
transcription from chat; do not send patient context to a small general-purpose
chat model as an implicit cleanup step.

At the server, accept authenticated WSS with sequenced audio frames, sample-rate
and channel declarations, monotonically increasing sample offsets and finite byte
and duration budgets. Reply with session/segment/revision IDs, absolute time
ranges and explicit provisional/final status. Treat provisional text as
replaceable. Finalization must flush accepted audio, acknowledge the last frame
and produce an actionable error if completion cannot be guaranteed. A reconnect
uses explicit resume/deduplication semantics; never concatenate a replay twice.

Implement word/time provenance as a segment ledger over original samples, with
committed prefixes and uncommitted tails represented independently. Validate
word intervals against actual audio duration; omit invalid highlights while
retaining raw text. Browser playback continues to use the audio clock. This is
particularly necessary for Whisper Flow's relative tail timestamps.

Retain immutable raw recognition and source hashes, with a separately versioned
edited draft. Apply terminology hints before recognition and deterministic
formatting after it where possible. Any language-model rewrite is an opt-in,
source-linked proposal with a diff and protected medication/number/negation
spans. Do not silently replace uncertain speech with medically plausible text.
Test no-DSP vs VAD/noise reduction/AEC/AGC on the same multichannel reference;
better perceptual audio can produce worse recognition.

Use the original Australian AWS boundary: pinned assets/models and inference
in approved Australian regions; Australian logs, object storage, backups,
keys, monitoring, identity/support access and recovery replicas; default-deny
egress with explicit operational allowlists. Put the ASR workers behind an
admission gateway with bounded queues, per-user quotas, backpressure, autoscaling
and warm capacity. Do not derive replica capacity from Python thread count.
A GPU SKU/region must be quota-checked and load-tested before making a latency
promise. No AWS credentials or provisioned account are assumed here.

## Ordered delivery plan and responsible roles

| Phase                                    | Owner / concrete output                                                                                                                                                             | Exit criterion / dependency                                                                                                                                                                                                                                    |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0. Reproducible public baseline          | Web maintainer: this PR's Pages speech build, subpath/real-model tests, research register and screenshots.                                                                          | Exact-source CI green; production deployment verified separately after authorized main integration. Npm publication is independent.                                                                                                                            |
| 1. Governance and contracts              | Clinical lead + security/data owner: approved tasks, consent, data flow, patient-context policy, licenses, AU cloud account/quotas, retention and audit plan.                       | Every data path and access contract approved; no private-data pilot before this gate.                                                                                                                                                                          |
| 2. Instrumented engine tournament        | ASR engineer + evaluator: frozen corpus, raw browser Whisper baseline, AU AWS/self-hosted engine shortlist, Whisper Flow/LiveKit/Live policies, paired metrics and resource traces. | Complete replay/offset/overload tests and source hashes; choose quality/cost frontier rather than one vendor claim. Admission defect 64 resolved or challenger excluded.                                                                                       |
| 3. Native capture and controlled editing | Client engineer + clinicians: hotkey prototype, device/permission states, insertion preview, focus validation, reversible edit diff and keyboard-only UX.                           | Tested on physical supported OS/devices, including quiet capture, wrong focus, locks/sleep, interrupted network and recovery. Browser viewport emulation alone cannot pass.                                                                                    |
| 4. Clinical note and CRM service         | Service engineer + CRM owner: source-linked drafts, signature, patient-scoped intent validation, confirmation, idempotency/audit and rollback/reconciliation.                       | All fault/refusal cases pass; blinded correction/safety pilot meets preregistered thresholds. No real command execution delegated to free-form LLM text.                                                                                                       |
| 5. Confirmatory pilot and launch         | Clinical lead + statistician + SRE: powered paired study, subgroup report, latency/capacity test, restore/deletion drills, canary/rollback plan and incident runbook.               | Clinical/security signoff and SLO/cost evidence; release only on demonstrated supported conditions. Failures lead back to data/model/UX experiments.                                                                                                           |
| 6. Operation and escalation              | Support lead + ML engineer: drift/error triage, consented correction capture, quarterly dependency/model/regional audit, shadow evaluation and rollback registry.                   | Reproduce incidents from redacted source receipts; retest before promotions. Escalate from vocabulary/DSP/commit tuning to adaptation/distillation/full fine-tuning, then from-scratch training only when the original data/license/resource gates justify it. |

No phase treats an unapproved contract, missing physical device or insufficient
sample size as a successful workaround. The browser remains a useful public
research surface while the separately gated service is developed.
