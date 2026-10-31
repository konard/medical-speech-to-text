"""Archive dated primary-source responses without executing upstream projects."""
import hashlib
import json
from pathlib import Path
from urllib.request import Request, urlopen
from datetime import datetime, timezone

sources = {
    'wispr-home': 'https://wisprflow.ai/',
    'wispr-data-controls': 'https://docs.wisprflow.ai/articles/9609615338-private-cloud-sync-and-data-sharing-preferences-in-wispr-flow',
    'wispr-security': 'https://wisprflow.ai/security',
    'superwhisper': 'https://superwhisper.com/',
    'aqua-voice': 'https://aquavoice.com/',
    'macwhisper': 'https://macwhisper.com/',
    'talon': 'https://talonvoice.com/',
    'pages-artifact': 'https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages',
}
base = Path('docs/case-studies/issue-7/data/sources')
base.mkdir(exist_ok=True)
records = []
for name, url in sources.items():
    record = {'name': name, 'url': url, 'retrievedAt': datetime.now(timezone.utc).isoformat()}
    try:
        with urlopen(Request(url, headers={'User-Agent': 'MedicalSpeechResearch/1.0'})) as response:
            content = response.read()
            record.update(status=response.status, finalUrl=response.url, sha256=hashlib.sha256(content).hexdigest())
            (base / (name + '.txt')).write_bytes(content)
    except Exception as error:
        record['error'] = str(error)
    records.append(record)
(base / 'index.json').write_text(json.dumps(records, indent=2) + '\n')
