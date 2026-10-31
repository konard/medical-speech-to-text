# Speech research lab

A mobile-first React lab for real English Whisper tiny/base transcription and
local SmolLM2 chat. Compare optional references and play audio with word highlighting.
[Browser/device research and quality-service protocol](../../docs/case-studies/issue-3/README.md). [Research plan](../../docs/case-studies/issue-1/README.md)
and [measured results](../../docs/case-studies/issue-1/verification.md).

[Open the main medical speech demo](https://konard.github.io/medical-speech-to-text/).
The Pages workflow publishes this production build after subpath and real-model
acceptance. See [rollout evidence](../../docs/case-studies/issue-7/README.md).
Use public/synthetic recordings: the demonstration loads global CDN/model assets
and is **not an Australian clinical deployment**. Audio inference runs locally;
an optional quality comparison uploads one recording and its local transcript only
after you configure an approved HTTPS endpoint, consent and select Compare. No
endpoint, credentials, analytics or CRM executor is bundled. Editing the endpoint
resets consent. See the [HTTP contract](../../docs/case-studies/issue-3/quality-service.md).

```sh
npm ci --prefix examples/speech-lab
npm --prefix examples/speech-lab run dev
```

Open the displayed localhost URL. Choose **Try 10 public samples** and then
**Transcribe recordings**, or select 1–20 recordings of your own. Maximum 25 MiB
per file, 100 MiB per batch, 120 seconds per recording and two decoded channels.
The decoded sample rate must be at most 96 kHz; Web Audio resamples to the audio
context rate, so this is not a check of the source codec's original sample rate.
The export labels this value `decodedSampleRate`. Browser codec support varies;
16 kHz mono PCM WAV is the
reproducible interchange format. First use downloads approximately 75 MB (tiny)
or 145 MB (base); CPU/WASM execution can take several seconds per short clip.
Use the microphone button for a foreground recording up to 60 seconds; permission
errors are recoverable and tracks stop before transcription. This records first,
then transcribes; it is not live partial ASR. Both speech models are English only and have five-minute per-file worker deadlines.

Optional reference JSON maps **exact unique filenames** to strings:

```json
{ "consultation.wav": "No known drug allergies." }
```

Omit a key to skip scoring; an empty string is a deliberate silence reference.
Click a timed word to seek; the active word follows the audio clock and gaps remain
unhighlighted. Timestamps are model estimates, and absent/invalid intervals are
omitted while the full transcript remains visible. Clear releases local recording
URLs/results. Device & storage exposes model-file counts and deletes only this
demo's pinned entries; browser site-data controls handle all stored assets. Exported
JSON includes audio SHA-256, exact model revision, parameters, raw chunks and
scores. Secure the download like the source material. The optional command mode
only illustrates a dry-run allowlist and requires confirmation; it writes nothing.

Ten included clips are **one** public PriMock57 mock consultation, not ten patients
or a clinical quality study. See [attribution](public/samples/ATTRIBUTION.md) and
the manifest for CC BY 4.0 source, pinned revision, crop boundaries and hashes.
Recreate them with `python3 experiments/issue-1/prepare-demo-data.py` from repo root.

```sh
npm --prefix examples/speech-lab run build
cd examples/speech-lab
npx playwright install chromium
npm run test:browser
npm run test:model
```

Local chat uses pinned SmolLM2-135M-Instruct q4 weights (about 182 MB plus assets),
CPU/WASM, at most 1200 prompt characters, bounded context and 128 generated tokens.
It is a general small model, not medical advice. Chat remains separate from
recordings, lives in page memory and can be cleared. Stop terminates the worker;
failed/cancelled prompts remain editable for retry. Explicit prepare/unload and
progress controls manage first-use downloads. Cache presence alone does not prove
complete offline support; only a loaded warm pipeline has been checked offline.

Interface tests use an explicit fake worker for deterministic browser contracts;
`test:model` separately executes actual pinned models on the supplied speech.
Its fresh downloads and screenshot go to ignored `test-results/model-evidence/`;
they do not overwrite the historical case-study observations. Runtime code is
imported directly from the version-pinned browser CDN in `config.js`. No unused
Node inference or image-processing package is installed for this static example.
`CHROME_PATH=/path/to/chrome` can reuse an installed compatible Chromium.
Set `SPEECH_LAB_URL` to a served `index.html` URL to run the actual model test
against that static deployment instead of the local Vite server.
The test handles the source host's notice, records that empty hosting request
separately, waits for deferred modules, and still rejects application upload
requests. UI/navigation actions are bounded independently of model inference.
The build produces `dist/` and can be served by a static HTTPS host. Raw source
also works on an HTTPS host with correct JavaScript MIME types and relative paths;
global model/runtime delivery needs CORS. For restricted Australian deployment,
mirror **all** code, WASM, tokenizer and weights in Australian AWS and remove
external fetch/telemetry paths as described in the architecture.

To test the exact Pages build, run the root-level
`node experiments/issue-7-serve-pages.mjs` after building, then set
`SPEECH_LAB_URL=http://127.0.0.1:4175/medical-speech-to-text/` and run
`npm run test:pages` followed by `npm run test:model` from this directory.
The first test mocks inference to isolate asset/subpath contracts; the second
executes the actual models. `PAGES_DEBUG=1` traces local static requests.
