# Capture, audio processing and microphone experiments

The first quality intervention is a clean, close, unclipped recording. More
microphones, stronger denoising and a larger model can each make recognition
worse. Select the combination by paired medical-error and latency measurements
on the same held-out consultations, following [the evaluation protocol](evaluation.md).
Keep the original synchronized channels and every processing configuration.

## Microphones and placement

Recommended **initial research kit**, rather than an unmeasured claim of the best
ASR hardware:

| Item                                     | Exact starting choice and purpose                                                                                                                                                                   | Limitation / setup                                                                                                                                                                                                                                                        |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Room array                               | [Seeed ReSpeaker XVF3800 USB 4-Mic Array](https://wiki.seeedstudio.com/respeaker_xvf3800_introduction/)                                                                                             | Convenient USB beamforming/AEC baseline. Default firmware exposes processed channels; install and record the appropriate raw multichannel firmware before claiming four independent microphone inputs. Save firmware and DSP settings.                                    |
| Separate speakers                        | [RØDE Wireless PRO](https://rode.com/en-au/products/wireless-pro), two transmitters                                                                                                                 | Put one on clinician and one on consenting participant, approximately 15–20 cm below the mouth, outside clothing. Compare rustle/dropouts against wired capture. Onboard 32-bit float backup is distinct from the wireless receiver output; synchronize before comparing. |
| Reference capture                        | Borrow/rent two [DPA 4088 CORE+ cardioid headsets](https://www.dpamicrophones.com/microphones/headset-and-earset/4088/) and a [Focusrite Scarlett 4i4](https://focusrite.com/products/scarlett-4i4) | DPA placement guidance is near the mouth corner, approximately 2–3 cm away, outside direct breath. Use manufacturer-compatible connector-to-XLR phantom-power adapters. The 4i4 has **two** microphone preamps, not four.                                                 |
| Three or more independent close channels | [Zoom F6](https://zoomcorp.com/en/us/field-recorders/field-recorders/f6/) with three or more matched headsets and correct adapters/cables                                                           | Six microphone inputs and local multitrack recording. Validate USB interface mode, driver/platform support, clocking, recording format and monitoring before purchase. Extra line inputs on a different interface are not extra microphone preamps.                       |

Recommended **quality reference rig** is a treated, quiet room with a correctly
fitted DPA 4088 per speaker, wired into synchronized preamps; use the F6 for three
or more people. It maximizes controllable direct speech capture, not guaranteed
ASR accuracy. Rent it first and retain the cheaper kit if its clinical errors and
correction time are statistically indistinguishable. Get current Australian
quotes, connector compatibility and return terms; a purchase budget is not an
authorization to buy. Include stands, shock isolation, windscreens, hygiene covers,
closed monitoring headphones, cables, storage and spare batteries in the quote.

Use a fixed script plus natural conversation in the actual room. Compare headset
2–3 cm, lapel 15–20 cm, tabletop 30/60/100 cm and array locations near each speaker
and at room centre. Log exact distance/angle, mouth height, speaker orientation,
table vibration, HVAC, masks, reverberation, competing conversation and microphone
polar pattern. Do not interchange distances between headset and room microphones.
Mount away from laptops, fans and handling; avoid mouth-front plosives, clothing
contact and head-turn occlusion. Check comfort, infection control and refusal to
wear a microphone, because the technically best setup may not be usable.

Set gain using realistic loud speech, leave roughly 12 dB headroom as a starting
setting, and measure actual clipped samples/noise floor. A float recorder cannot
repair capsule overload, a radio dropout or a distorted analogue input. Record
lossless raw channels, original rate and calibration tone. Disable OS enhancement
and AGC for the reference condition; separately evaluate the production device's
default DSP. The [Shure critical-distance guidance](https://service.shure.com/articles/en_US/Knowledge/critical-distance-and-microphone-placement)
explains why moving closer can beat gain changes in a reverberant room.

## Two, three and more microphones

Run a synchronized crossover: one shared room mic; two close speaker mics; three
close mics with a third participant; four raw array elements; and array-processed
output. The two-speaker trials also compare 1/2/3/4 array subsets with constant
geometry and source positions. More participants and more sensors are different
factors: compare them independently. Randomize capture setup order and include
overlap, quiet speech, movement and a distractor. Use 20 short consented sessions
for feasibility, then size the definitive study from observed paired variance.

Preserve one channel per speaker where possible. Compare independent ASR +
time-based speaker merge, energy/SNR channel selection, acoustic beamforming and
overlap separation. Never naïvely average unsynchronized USB microphones: clock
drift, phase cancellation and latency skew can reduce intelligibility. A single
multichannel ADC/array is preferable. Otherwise estimate clock drift against a
shared calibration signal, resample with an audited offset map and reject
unrecoverable drift. Do not infer speaker identity merely from a channel label.

For arrays test delay-and-sum, GCC-PHAT direction estimation and MVDR against the
unprocessed best channel, with calibration and held-out room noise. For distant
speech test WPE dereverberation and source separation only when there is an error
class to address. Measure target suppression, missed quiet words, overlap word
error, speaker-attributed WER, latency and CPU/memory. “Four microphones improve
quality” requires an observed paired effect and confidence interval. There is no
universal improvement percentage to promise before those recordings exist.

## Processing taxonomy and ablations

| Stage                        | Candidate libraries / method                                                                                                                                                                 | What must be preserved and measured                                                                                                                                                                                                                                                                                     |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Capture integrity            | Native browser Audio APIs; target OS recorder; lossless WAV/FLAC                                                                                                                             | Dropouts, clipping, gain, room/device identity, channels and sample clock. Compressed source cannot be made lossless by transcoding.                                                                                                                                                                                    |
| Decode / channel policy      | Browser AudioContext in demo; production FFmpeg/TorchCodec after license/build review                                                                                                        | Codec errors, channel routing and duration. Resample once with antialiasing to the exact model rate; do not relabel rates. Demo averages at most two channels for simplicity, so use mono or separated speakers for experiments.                                                                                        |
| Echo / gain / DC / bandwidth | [WebRTC Audio Processing Module](https://webrtc.googlesource.com/src/+/refs/heads/main/modules/audio_processing/g3doc/audio_processing_module.md), high-pass/DC filter, conservative limiter | AEC needs the actual playback reference. Double-talk suppression, AGC pumping and clipping can destroy evidence. Do not apply telephone bandwidth filters to wideband recordings without an ablation.                                                                                                                   |
| Segmentation / silence       | [Silero VAD](https://github.com/snakers4/silero-vad), endpoint hangover/pre-roll                                                                                                             | Keep breaths, short negations, numbers and turn tails. Save source-to-segment offsets and evaluate false starts, missed speech, delay and hallucinations on true silence. Never substitute an empty transcript for a failed decode.                                                                                     |
| Noise enhancement            | [RNNoise](https://github.com/xiph/rnnoise), [DeepFilterNet](https://github.com/Rikorose/DeepFilterNet)                                                                                       | Raw vs each enhancement strength; competing speech vs stationary noise separately. Evaluate consonant loss, musical artifacts and false medical terms; improved perceptual quality does not imply lower WER.                                                                                                            |
| Spatial / overlap            | MVDR, WPE, SpeechBrain/ESPnet separation recipes                                                                                                                                             | Require synchronized channels and exact checkpoint licenses. Test source swaps, duplicate words, speaker leakage and added buffering. [PyTorch's MVDR tutorial](https://docs.pytorch.org/audio/2.8/tutorials/mvdr_tutorial.html) is a method reference; its library version is not an unexamined production dependency. |
| Speaker / language           | [pyannote.audio](https://github.com/pyannote/pyannote-audio), channel metadata, language identification                                                                                      | DER/JER and overlap policy, speaker-attributed medical errors, language switches and uncertain identity. Weight terms may differ from code license.                                                                                                                                                                     |
| ASR decoding                 | Vocabulary/context bias, beam width, temperature, chunk/stride and streaming cache                                                                                                           | Fixed held-out tuning set; preserve raw hypotheses and revisions. Biasing a drug can hallucinate it elsewhere. Tune numbers, abbreviations, accents and out-of-vocabulary speech together.                                                                                                                              |
| Word alignment               | Model word intervals; [WhisperX](https://github.com/m-bain/whisperX) forced alignment if justified                                                                                           | Timing error against annotated words, missing/overlapping intervals and original time mapping. Alignment positions supplied text; it cannot prove the text was spoken. Never invent uniform word durations for karaoke.                                                                                                 |
| Text presentation            | Punctuation, casing, inverse text normalization, units and medical dictionary                                                                                                                | Store literal and normalized forms independently. Do not erase decimals, negate a negation, or auto-correct a plausible medicine/dose. Highlight uncertain spans for review rather than silently rewriting.                                                                                                             |
| Clinical note / commands     | Source-linked structured extraction, terminology validation, explicit intent mode                                                                                                            | Unsupported facts, speaker attribution, dose/unit/negation errors, corrections and confirmation. An LLM rewrite is a separate model with separate locality and safety tests.                                                                                                                                            |

Run raw audio + fixed ASR first. Add one intervention at a time on train/dev only,
then evaluate the selected combination once on locked test sessions. Use factorial
trials for interactions such as VAD × denoising and beamforming × microphone
placement; do not search every combination on the test set. Save model/DSP hashes,
parameters, source offsets, device firmware, intermediate checksums and measured
added delay. Reject an enhancement that improves global WER but worsens critical
negation/dose errors or suppresses quieter speakers. Retain a reversible raw path.
