"""Rebuild ten CC BY 4.0 PriMock57 utterance clips, without patient data.

Uses the doctor channel of a MOCK consultation. No model predictions are baked in.
Run from repository root: python3 experiments/issue-1/prepare-demo-data.py
The source has uncertain/unintelligible tags; those intervals are excluded.
"""
import hashlib
import json
from pathlib import Path
import re
import urllib.request
import wave

REVISION = 'cd2ac707ad03cb4d2531f4ec6b90c659bf4357c5'
ROOT = Path(__file__).resolve().parents[2]
CACHE = ROOT / '.cache' / 'primock'
OUTPUT = ROOT / 'examples' / 'speech-lab' / 'public' / 'samples'
CACHE.mkdir(parents=True, exist_ok=True)
OUTPUT.mkdir(parents=True, exist_ok=True)


def fetch(name, url, expected):
    path = CACHE / name
    if not path.exists():
        with urllib.request.urlopen(url) as response, path.open('wb') as target:
            size = 0
            while chunk := response.read(1024 * 1024):
                size += len(chunk)
                if size > 64 * 1024 * 1024:
                    raise ValueError('Source exceeds 64 MiB limit')
                target.write(chunk)
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    if digest != expected:
        raise ValueError(f'Unexpected source hash for {name}: {digest}')
    return path


# Hashes were independently recorded from the pinned publisher files.
audio = fetch('doctor.wav', f'https://media.githubusercontent.com/media/babylonhealth/primock57/{REVISION}/audio/day1_consultation01_doctor.wav', 'a93ca69f49da821b2d10b03f3189fd0d82200a697805c18f316719ba328ff96b')
textgrid = fetch('doctor.TextGrid', f'https://raw.githubusercontent.com/babylonhealth/primock57/{REVISION}/transcripts/day1_consultation01_doctor.TextGrid', 'a727b4f53fd0c21750405fa683a0079585d9cf3cf763d3ced51bde9673a3eb04')
intervals = re.findall(r'xmin = ([\d.]+)\s+xmax = ([\d.]+)\s+text = "((?:[^"]|"")*)"', textgrid.read_text())
selected = [(float(start), float(end), text.replace('""', '"')) for start, end, text in intervals if text.strip() and '<' not in text and 0.7 < float(end) - float(start) < 12][:10]
if len(selected) != 10:
    raise ValueError('Expected exactly ten clean complete utterances')
records = []
references = {}
with wave.open(str(audio), 'rb') as source:
    if (source.getnchannels(), source.getsampwidth(), source.getframerate()) != (1, 2, 16000):
        raise ValueError('Unexpected audio format')
    for index, (start, end, text) in enumerate(selected, 1):
        name = f'primock-{index:02}.wav'
        first, last = int(start * 16000), int(end * 16000)
        source.setpos(first)
        frames = source.readframes(last - first)
        path = OUTPUT / name
        with wave.open(str(path), 'wb') as target:
            target.setnchannels(1)
            target.setsampwidth(2)
            target.setframerate(16000)
            target.writeframes(frames)
        references[name] = text
        records.append({'file': name, 'start': start, 'end': end, 'sourceFrames': [first, last], 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'reference': text})
manifest = {'dataset': 'PriMock57', 'license': 'CC-BY-4.0', 'sourceRevision': REVISION, 'source': f'https://github.com/babylonhealth/primock57/tree/{REVISION}', 'sourceAudioSha256': hashlib.sha256(audio.read_bytes()).hexdigest(), 'sourceTranscriptSha256': hashlib.sha256(textgrid.read_bytes()).hexdigest(), 'selection': 'First ten complete doctor utterances of 0.7–12 seconds without uncertainty tags; interval cropping only. Single speaker, one mock consultation. Smoke test, not clinical benchmark.', 'records': records}
(OUTPUT / 'references.json').write_text(json.dumps(references, indent=2) + '\n')
(OUTPUT / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(f'Prepared {len(records)} attributed clips at {OUTPUT}')
