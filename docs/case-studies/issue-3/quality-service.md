# Optional quality-service contract and research plan

The default demo performs local inference and reference scoring without uploading
recordings, transcripts, reference text or chat. This PR adds an optional HTTP
adapter; it does not provision a service or promise endpoint residency. The user
must configure an approved HTTPS URL, check a consent box, then select **Compare
with quality service** on one completed recording. Editing the endpoint clears
consent. Clearing results also clears consent. Chat is never submitted.

## HTTP contract

POST multipart form data to the configured endpoint with exactly:

| Field             | Value                                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| `audio`           | Original selected recording (or locally converted `microphone.wav`), original filename, at most 25 MiB |
| `localTranscript` | Actual local model text, at most 10,000 characters                                                     |
| `localModel`      | JSON containing local immutable model identity and runtime parameters                                  |

No API key is shipped. Credentials are omitted, redirects rejected, referrer
omitted. URLs with credentials, query parameters or fragments are rejected.
The request uses a 60-second deadline and the page Stop AbortSignal. Browser CORS
must permit the demo origin; HTTPS alone does not establish service ownership,
retention, authorization or Australian processing. If access control is required,
use an approved first-party gateway/session design before clinical use; do not
paste secrets into endpoint URLs or commit them to static JavaScript.

A successful JSON response is:

```json
{
  "text": "No known drug allergies.",
  "model": {
    "id": "service-model-name",
    "revision": "immutable-service-revision"
  }
}
```

The response body is bounded to 1 MB while streaming, including missing-content-
length responses; text is bounded to 10,000 characters. HTTP/schema/JSON/size
errors remain visible, with local results retained. The UI shows both texts and
edit counts as **disagreement**, not clinical accuracy. The service can be wrong.
The browser compares raw outputs without silently rewriting the local transcript.
The export includes returned service provenance and disagreement under the result.
References are not sent and model chat is never used as an accuracy judge.

## Implementing an approved service

Use the [issue 1 AU architecture](../issue-1/architecture.md): Australian AWS
compute, encrypted regional storage/logs/backups, no public third-party clinical
egress, approved support access and retention/deletion policy. Select a self-hosted
Whisper/Parakeet/streaming engine or an eligible Australian managed comparator,
with pinned runtime/checkpoint. Validate file size, decode limits, content type,
rate/concurrency, authorization and job cancellation server-side. CORS is not
authorization. Disable request-body logging and return stable model revisions.
Keep the response minimal and preserve audit IDs inside the approved boundary.

The current environment supplies neither an approved endpoint nor clinical data,
cloud account or service credentials. Browser contract tests use a clearly labelled
intercepted service; they establish consent and wire behavior, not a deployed
service, model accuracy or Australian locality. Provisioning/deployment remains a
separate authorized production stage under the original research plan.

## Establishing recognition quality

1. Lock participant-separated clinical train/dev/test data and consent according
   to the [evaluation plan](../issue-1/evaluation.md). The included public ten clips
   are smoke data from one consultation; never report them as ten participants.
2. Run the identical source audio through local tiny/base and approved comparator.
   Record audio SHA-256, reference revision, capture/DSP settings, model revisions,
   latency, device/browser and all failures. Evaluate batch/live modes separately.
3. Score both transcripts against the same independently checked gold reference:
   WER/CER, drug/dose/unit/negation omissions/substitutions, hallucinations, speaker
   attribution, correction time, subgroup results and paired uncertainty.
   Disagreement prioritizes human review and cannot replace a gold reference.
4. Set go/no-go thresholds before opening test data. Reject a lower global WER
   that worsens critical medical errors. Keep raw text and human corrections linked;
   never allow service output to execute a CRM command or sign a medical record.
5. Compare the same physical-device/noise/microphone conditions and frozen tests
   after every model/runtime/browser change. Review errors under the lifetime
   support loop and training escalation protocol; revoke a failing model release.
