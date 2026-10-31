# Bound queued PCM bytes independently of the segment window cap

At revision 41a8e2a55a2c4c5520ae15f5ec392993e956efcd, `TranscribeSession` constructs `Queue()` and `add_chunk()` calls `put_nowait()` without a frame or byte admission limit. `WF_MAX_WINDOW_CHUNKS` bounds the segment after dequeueing; it does not bound the queue while recognition is slower than incoming audio. The public server passes each received binary frame directly to this method. A fast producer or slow model can therefore accumulate audio beyond the intended window budget. This is independent of issue #39's finalization behavior.

A finite reproducer using the installed package (no model needed):

```python
import asyncio
from whisperflow import config
from whisperflow.streaming import TranscribeSession

async def probe():
    async def unused(*args, **kwargs):
        raise AssertionError("No recognition should execute")
    config.MAX_WINDOW_CHUNKS = 2
    session = TranscribeSession(unused, unused)
    try:
        chunk = b"\x01\x01" * 1024
        for _ in range(1024):
            session.add_chunk(chunk)
        print(session.queue.qsize(), session.queue.maxsize)
        assert session.queue.qsize() <= 2  # fails: 1024, maxsize 0
    finally:
        await session.stop()

asyncio.run(probe())
```

The producer deliberately runs before yielding, so the result is deterministic and allocates at most 1024 queue entries referencing one 2048-byte chunk. It demonstrates admission behavior rather than an end-to-end memory exhaustion experiment. A model-free load of the pinned source produced `acceptedQueueFrames=1024`, `logicalQueuedBytes=2097152`, `queueMaxsize=0` under a 256 MiB process memory limit.

Expected: a configured finite byte/audio-duration backlog, explicit backpressure or overload refusal, and predictable finalization of accepted frames. A count alone is insufficient because the wire contract permits frames of arbitrary length.

Workaround: place the service behind an authenticated gateway that validates even int16 frame lengths, caps frame bytes, session duration and audio rate, limits concurrent streams, and closes overloaded clients. Do not treat the HTTP upload limit or the decoded segment cap as a WebSocket queue bound. Gateway rate limits reduce exposure but do not replace an in-process byte budget.

Suggested fix: track queued PCM bytes (including in-flight segment accounting where needed), enforce a separate `WF_MAX_QUEUED_BYTES` budget before enqueue, and make the receiver await capacity or close with a documented overload code. Release accounting on dequeue, stop, cancellation and failure. Reserve control-marker capacity or use a separate control channel so a full queue cannot deadlock flush/stop. Add tests for a blocked fake recognizer plus a finite burst, oversized/odd frames, overload recovery and finalization of already accepted audio; no model weights are necessary.
