// Bounded model metadata probe; never downloads weights or uses clinical input.
import { writeFile } from 'node:fs/promises';
import { CHAT_MODEL } from '../examples/speech-lab/config.js';
const response = await fetch(
  `https://huggingface.co/${CHAT_MODEL.id}/resolve/${CHAT_MODEL.revision}/onnx/model_q4.onnx`,
  { method: 'HEAD' }
);
if (!response.ok) {
  throw new Error(`Model HTTP ${response.status}`);
}
await writeFile(
  'docs/case-studies/issue-3/data/chat-weight-metadata.json',
  JSON.stringify(
    {
      checkedAt: new Date().toISOString(),
      model: CHAT_MODEL,
      bytes: Number(response.headers.get('content-length')),
      etag: response.headers.get('etag'),
    },
    null,
    2
  )
);
