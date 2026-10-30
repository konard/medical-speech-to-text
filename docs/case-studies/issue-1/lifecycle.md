# Research, delivery and lifetime plan

This is a staged research programme, not a claim that unprovided private clinical
data, GPU capacity or commercial credentials have been exercised. The browser
baseline and its checks are delivered now. The following work packages specify
inputs, owners, deliverables and measurable exits through an independently trained
network. Advance only when the previous stage is supported by evidence.

## Delivery stages

| Stage / indicative effort                                    | Accountable roles and deliverables                                                                                                                                                                                                                                           | Exit / stop decision                                                                                                                                                                           |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0. Discovery, 1–2 weeks                                      | Clinical lead + product owner: specialties, accents/languages, room workflow, note templates, CRM actions, consent, failure recovery, correction-time baseline and measurable success thresholds. Security lead maps every data class to the [AU boundary](architecture.md). | Written intended use, AU-only service inventory, legal/clinical approval and experiment cost ceiling. Stop if required processing or command destination cannot stay in Australia.             |
| 1. Data pilot, 2–4 weeks after approvals                     | Data steward + two clinical annotators: 10-hour/20-speaker feasibility set, consent and withdrawal registry, double-reviewed verbatim/medical labels, session/speaker/room splits, annotation agreement and capture hardware trial.                                          | Rights and locality documented, disagreement adjudicated, no split leakage. Pilot is not sufficient clinical validation; power the definitive test from pilot variance.                        |
| 2. Baselines, 1–2 weeks                                      | ASR engineer + QA: pinned raw-audio browser and AWS Sydney streaming/offline comparators, immutable run manifests, nonempty outputs, scores, critical error review and latency/cost traces.                                                                                  | Functional access proven with synthetic data first; compare eligible systems on identical approved audio. Reject missing runs and inaccessible regions rather than scoring them as zero error. |
| 3. Capture/DSP/decoding, 2–4 weeks                           | Audio engineer + clinician: [paired microphone and processing ablations](audio.md), vocabulary/endpoint tuning, subgroup analysis, correction effort and bounded capacity tests.                                                                                             | Predeclared clinical and p95 latency targets met on dev without unacceptable subgroup regression. If not, diagnose the error class before buying hardware or training a larger model.          |
| 4. Domain training, 2–8 weeks per bounded experiment         | ML lead + data steward: [training ladder](#training-escalation), budgeted GPU-hours, reproducible checkpoints, licenses/model card, ablation vs frozen baseline and locked evaluation.                                                                                       | Paired clinical benefit and resource feasibility, no leakage or forgotten subgroup; otherwise retain the baseline. Own-network work requires a separate economic go/no-go within this plan.    |
| 5. Workflow integration, 2–4 weeks                           | Application engineer + security + clinician: source-linked draft history, correction UI, consent/permissions, sandbox CRM/FHIR mapping, command confirmation and idempotency, failure/replay tests, signed-record versioning.                                                | Clinician approves every draft; no unconfirmed writes, cross-patient effects or unsupported facts in the acceptance suite. Target CRM location also passes the AU gate.                        |
| 6. Shadow clinical evaluation, 4–8 weeks or powered duration | Clinical safety lead + independent QA: read-only shadow use, prospective representative sessions, blinded correction-time trial, critical-error review, accessibility/workflow and intended-use regulatory review.                                                           | Predeclared safety/accuracy/latency bounds with uncertainty; formal deployment approval. A small set or zero observed failures does not establish safety.                                      |
| 7. Controlled launch, 2–4 weeks                              | Service owner + SRE: limited cohort, warm capacity, alarms, runbooks, backups/restores, rollback drill, operator training and support rota.                                                                                                                                  | Capacity and AU recovery proven, corrections recoverable, incident ownership live. Gradually widen only with monitored quality and clinician acceptance.                                       |
| 8. Operate and refresh, ongoing                              | Service owner + clinical lead: monthly error/latency/cost review, quarterly source/region/license review, data quality audits, retraining proposals and signed release records.                                                                                              | Every model/prompt/DSP update passes the same frozen regression suite and new representative validation before canary. Keep the previous complete configuration for rollback.                  |
| 9. Retirement                                                | Data steward + product/SRE: export signed records and audit relationships, terminate endpoints/keys, withdraw obsolete models, expire caches/backups under policy, test recovery and record deletion evidence.                                                               | Clinical record retention obligations fulfilled; consent-bound research artifacts and vendor copies disposed of with verifiable receipts.                                                      |

Estimates are planning ranges, not commitments independent of dataset access or
trial approval. One person may fill multiple roles in the pilot, but clinical
adjudication and release approval need independent review. Track blockers against
the stage and acceptance criteria; never call an unrun trial complete.

## Training escalation

**1. Error taxonomy before training.** Review drug names, units, doses, negation,
accents, overlap, noise, language switching, truncation, speaker assignment and
silence hallucination separately. Capture/diarization defects need different
interventions from vocabulary errors. Compare at least two frozen pretrained
systems and human correction effort before selecting an architecture.

**2. Low-cost adaptation.** Use approved domain vocabulary, pronunciation and
phrase bias, bounded contextual prompts and language-model rescoring. Separate
patient names from general medical vocabulary and keep patient context ephemeral.
Tune on dev, include negative controls without the hinted terms, and freeze
settings before testing. Do not use the reference transcript as a recognition
prompt. Quantization and distillation are speed/size experiments, not automatically
accuracy improvements.

**3. Fine-tuning.** Start with a 10–50-hour consented pilot to test data tooling and
learning curves; expand to hundreds of representative hours only if held-out
medical errors improve. These are budget scenarios, not a promise of sufficiency.
Compare LoRA/adapters or frozen encoder + decoder adaptation with full fine-tuning
where the exact architecture supports them. Weight losses/sampling for critical
terms without allowing an artificial class distribution to hide ordinary errors.
Mix general speech to assess forgetting; augment only training audio with measured
room responses, channel/noise profiles, rate/gain changes and approved vocabularies.

Use patient/speaker/session/site-disjoint train/dev/test sets and a later temporal
holdout. Review rights for commercial derivatives and release of each checkpoint.
Strip names in annotation exports where possible, but do not claim de-identification
of a recognizable voice. Detect duplicate and near-duplicate audio across all
training/public/validation sources. Two clinicians adjudicate high-risk terms.
Evaluate learning curves and subgroup confidence intervals; repeated tuning on a
locked test requires a fresh prospective holdout.

**4. Training experiment design.** In Australian AWS only, pin container image,
CUDA/runtime/recipe and model revision, tokenizer, data manifest/checksums, seed,
optimizer/schedule, precision, batch/gradient accumulation and augmentation.
Choose CTC, RNN-T/TDT or encoder-decoder based on observed errors and actual
streaming needs. Freeze three learning-rate candidates and two seeds for the pilot,
early-stop by dev critical-error/quality criteria, and set a GPU-hour/spend ceiling
before allocation. Measure one finite step/microbatch for memory feasibility,
then one finite epoch before scaling. Save resumable state and metrics in Sydney,
including failed runs; no invisible restarts, silent CPU fallbacks or OOM loops.

Compare full precision vs deployment q8/FP16 on identical medical fixtures; export
to the intended inference engine and re-evaluate timestamps, tokenizer behavior,
memory and concurrency. Offline quality gains do not establish a deployable
subsecond streaming path. Record unsuccessful experiments and resource use.

**5. Distillation / own architecture.** If a larger teacher is materially better
but too slow, generate consent- and license-permitted soft targets in AU and
compare a smaller causal streaming student against supervised-only training.
Keep human gold for final evaluation, measure inherited hallucinations and teacher
systematic errors, and retain the teacher/student provenance. Do not train on
test references or proprietary API outputs without permission.

If adaptation cannot meet the target and sufficient original licensed speech and
funding exist, build an own network in NeMo, SpeechBrain, ESPnet or icefall. Start
with a reproducible small Conformer/CTC baseline, then a cache-aware causal
Conformer/RNN-T architecture with explicit feature windows, look-ahead, token
commit and endpointer. Train tokenizer on training text only; compare byte/subword
choices for medicines, numbers and languages. Consider self-supervised pretraining
followed by supervised ASR if lawful unlabelled recordings are available. Begin
with a 100-hour pipeline check, then evaluate scenarios of 1,000 and 10,000+ hours
using measured learning/compute curves. Those volumes do not guarantee competitiveness
with foundation systems trained on much larger corpora.

Before scaling, obtain a written estimate for data annotation, storage, GPU-hours,
engineering, clinical review and long-term serving/support. Record parameter count,
training FLOP estimate, observed tokens/seconds, energy/cost and checkpoints. Stop
if error reduction per additional hour/GPU cost flattens, subgroup safety worsens,
the budget is reached, or a licensed existing model meets the goal more reliably.
“Best possible” means a documented Pareto optimum under stated clinical, latency,
locality and economic constraints, not an unfalsifiable global optimum.

## Production records and support

Medical history flows through immutable raw transcript → attributed correction →
source-linked draft sections → clinician review/signature → versioned clinical
record. Keep medications, allergies, symptoms, chronology and uncertainty distinct;
do not infer diagnoses or fill absent values. Preserve the source span behind a
statement and the author/reason for every edit. Corrections create a new revision,
never overwrite the raw transcript or silently alter a previously signed record.

Support staff receive an opaque case ID, sanitized error category and configuration
first. Replaying identifiable recordings needs a separate time-bound authorization
inside the AU environment. Track false commands, critical word/negation/dose errors,
latency tails, correction minutes, abandonment, device/room shifts and subgroup
drift. Sample reviewed cases with consent; no automatic learning from arbitrary
patient sessions. Quarantine adverse events, preserve AU audit evidence and use
the previous known configuration or manual documentation during investigation.

Maintain runbooks for model download failure, endpoint loss, microphone permission,
partial transcript recovery, out-of-order events, overload, bad model/DSP updates,
credential exposure, consent withdrawal and loss of Australia-only locality.
Clinical notification/escalation depends on impact and local obligations. Backups
are useful only after an Australian restore test. A vendor upgrade, terms change,
new region or new LLM summarizer reopens the applicable eligibility and regression
gates. Keep a costed maintenance owner and exit/export path throughout the lifetime.
