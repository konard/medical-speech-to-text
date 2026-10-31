"""Finite, model-free probe of the pinned upstream session admission path.

Numpy is a refusal stub: this probe exercises only queue admission, never DSP or
recognition. No upstream dependency is installed or model checkpoint executed.
"""
import asyncio
import importlib.util
import json
import resource
import sys
import types
from pathlib import Path

sys.dont_write_bytecode = True
resource.setrlimit(resource.RLIMIT_AS, (256 * 1024**2, 256 * 1024**2))
base = Path('docs/case-studies/issue-7/data/whisper-flow')
package = types.ModuleType('whisperflow')
sys.modules['whisperflow'] = package
sys.modules['numpy'] = types.ModuleType('numpy')
for name in ['config', 'streaming']:
    spec = importlib.util.spec_from_file_location('whisperflow.' + name, base / ('whisperflow__' + name + '.py'))
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    setattr(package, name, module)
    spec.loader.exec_module(module)

async def main():
    async def unused(*args, **kwargs):
        raise AssertionError('Recognition must not run in this queue admission probe')
    package.config.MAX_WINDOW_CHUNKS = 2
    session = package.streaming.TranscribeSession(unused, unused)
    try:
        chunk = b'\x01\x01' * 1024
        for _ in range(1024):
            session.add_chunk(chunk)
        result = {'windowCapFrames': 2, 'acceptedQueueFrames': session.queue.qsize(), 'logicalQueuedBytes': session.queue.qsize() * len(chunk), 'queueMaxsize': session.queue.maxsize, 'modelExecuted': False}
        assert result['acceptedQueueFrames'] == 1024
        print(json.dumps(result, indent=2))
    finally:
        await session.stop()

asyncio.run(main())
