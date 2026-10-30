import { createElement as h, useEffect, useRef } from 'react';
import { MODELS, CHAT_MODEL } from './config.js';
import { renderResult } from './render.js';

export const Hint = ({ children }) => h('p', { className: 'hint' }, children);
const label = (id, text) => h('label', { htmlFor: id }, text);

export function ModelPanel({
  mode,
  model,
  setModel,
  busy,
  ready,
  cacheCount,
  onPrepare,
  onUnload,
  onDelete,
  capabilities,
}) {
  return h(
    'section',
    { className: 'model-panel', 'aria-label': 'On-device models' },
    h(
      'div',
      { className: 'section-title' },
      h('span', { className: 'step' }, '01'),
      h('h2', null, 'Your local model'),
      h('span', { className: 'local-badge' }, 'ON DEVICE')
    ),
    mode === 'speech'
      ? h(
          'div',
          null,
          label('model', 'Recognition model'),
          h(
            'select',
            {
              id: 'model',
              value: model,
              onChange: (event) => setModel(event.target.value),
              disabled: busy,
            },
            Object.entries(MODELS).map(([key, item]) =>
              h('option', { key, value: key }, item.label)
            )
          )
        )
      : h('p', { className: 'model-name' }, CHAT_MODEL.label),
    h(
      Hint,
      null,
      'CPU mode works without WebGPU. First use downloads weights; cached files can be reused. Keep this page open while running.'
    ),
    h(
      'div',
      { className: 'model-actions' },
      h(
        'button',
        {
          id: 'download-model',
          disabled: busy || !capabilities.inference,
          onClick: onPrepare,
        },
        ready ? 'Check model' : 'Download & load model'
      ),
      h(
        'button',
        {
          id: 'unload-model',
          className: 'quiet',
          disabled: busy,
          onClick: onUnload,
        },
        'Unload'
      )
    ),
    h(
      'p',
      { id: 'model-state', className: 'hint', role: 'status' },
      ready
        ? 'Model loaded · ready on this device'
        : 'Model loads when you download or start'
    ),
    h(
      'details',
      null,
      h('summary', null, 'Device & storage'),
      h(
        'p',
        { className: 'hint' },
        `Local inference: ${capabilities.inference ? 'available' : 'unavailable — use HTTPS and a browser with Web Audio, workers and WASM'}. Microphone: ${capabilities.microphone ? 'available with permission' : 'unavailable — use file upload'}. WebGPU: ${capabilities.webgpu ? 'API detected; CPU selected for compatibility' : 'not detected; CPU selected'}.`
      ),
      h(
        'p',
        { className: 'hint' },
        `${cacheCount} cached model files. Partial downloads may need internet. Browser storage may be evicted; this is not an offline-install guarantee.`
      ),
      h(
        'button',
        {
          id: 'delete-models',
          className: 'quiet',
          disabled: busy,
          onClick: onDelete,
        },
        'Delete this demo’s cached models'
      )
    )
  );
}

export function SpeechInputs({
  busy,
  input,
  references,
  selection,
  onSelection,
  onSamples,
  onRun,
  commandMode,
  setCommandMode,
  recording,
  capabilities,
  onRecord,
  onStopRecord,
  onReferenceFile,
}) {
  return h(
    'section',
    { className: 'input-panel', 'aria-label': 'Recordings' },
    h(
      'div',
      { className: 'section-title' },
      h('span', { className: 'step' }, '02'),
      h('h2', null, 'Add your recordings')
    ),
    h(
      'div',
      { className: 'capture-actions' },
      h(
        'button',
        {
          id: 'record',
          disabled: busy || !capabilities.microphone,
          onClick: onRecord,
        },
        '● Record microphone'
      ),
      h(
        'button',
        { id: 'stop-recording', disabled: !recording, onClick: onStopRecord },
        'Finish recording'
      )
    ),
    h(
      Hint,
      null,
      recording
        ? 'Recording locally · stops after 60 seconds. Finish to review before transcription.'
        : 'Record up to 60 seconds, or choose files below. Microphone access starts only when you tap Record.'
    ),
    h(
      'label',
      { className: 'drop', htmlFor: 'files' },
      h('span', { className: 'upload' }, '↥'),
      h('strong', null, 'Choose your recordings'),
      h('span', null, 'WAV, MP3, FLAC, OGG, M4A or WebM'),
      h(
        'span',
        { className: 'hint' },
        '1–20 files · 120 seconds each · 25 MiB per file · 100 MiB total'
      )
    ),
    h('input', {
      id: 'files',
      ref: input,
      type: 'file',
      accept: 'audio/*,.wav,.flac,.m4a,.webm,.mp4',
      multiple: true,
      disabled: busy,
      onChange: onSelection,
    }),
    h(
      'button',
      { id: 'samples', className: 'quiet', disabled: busy, onClick: onSamples },
      'Try 10 public consultation clips ↗'
    ),
    h('p', { id: 'selection', className: 'hint' }, selection),
    h(
      'details',
      { className: 'reference-options', open: true },
      h('summary', null, 'References & command preview'),
      label('references', 'Reference transcripts · optional'),
      h('textarea', {
        id: 'references',
        ref: references,
        rows: 3,
        disabled: busy,
        spellCheck: false,
        placeholder: '{"consultation.wav": "No known allergies."}',
      }),
      label('reference-file', 'Or choose reference JSON'),
      h('input', {
        id: 'reference-file',
        type: 'file',
        accept: '.json,application/json',
        disabled: busy,
        onChange: onReferenceFile,
      }),
      h(
        Hint,
        null,
        'Use exact filenames. Empty text means silence. Missing references are never scored.'
      ),
      h(
        'label',
        { className: 'check' },
        h('input', {
          id: 'command-mode',
          type: 'checkbox',
          checked: commandMode,
          disabled: busy,
          onChange: (event) => setCommandMode(event.target.checked),
        }),
        'Preview commands in dry-run mode'
      ),
      h(
        Hint,
        null,
        'Only “open patient 123” is allowlisted. Nothing executes or connects to a CRM.'
      )
    ),
    h(
      'button',
      {
        id: 'run',
        className: 'primary',
        disabled: busy || !capabilities.inference,
        onClick: onRun,
      },
      'Transcribe recordings'
    )
  );
}

export function ResultCard({ result, onCompare, canCompare }) {
  const container = useRef();
  useEffect(() => {
    const cleanup = renderResult(result, container.current);
    const node = container.current;
    return () => {
      cleanup();
      node.replaceChildren();
    };
  }, [result]);
  return h(
    'div',
    { className: 'result-slot' },
    h('div', { ref: container }),
    result.status === 'complete' &&
      h(
        'div',
        { className: 'quality-result' },
        h(
          'button',
          { disabled: !canCompare, onClick: () => onCompare(result) },
          'Compare with quality service'
        ),
        result.quality &&
          h(
            'div',
            null,
            h('p', null, `Service transcript: ${result.quality.text}`),
            h(
              'p',
              { className: 'hint' },
              `Disagreement with local transcript: ${result.quality.agreement.word.errors} word edits. Neither transcript is a gold reference. Service: ${result.quality.model.id}@${result.quality.model.revision}`
            )
          )
      )
  );
}

export function QualitySettings({
  endpoint,
  setEndpoint,
  consent,
  setConsent,
  busy,
}) {
  return h(
    'details',
    { className: 'quality-settings' },
    h('summary', null, 'Optional service quality check'),
    h(
      Hint,
      null,
      'Send one recording, its local transcript and model identity to your approved service. This leaves your device. Verify the service’s Australian processing and retention before sharing. Chat and reference text are excluded.'
    ),
    label('quality-endpoint', 'Approved HTTPS quality endpoint'),
    h('input', {
      id: 'quality-endpoint',
      type: 'url',
      value: endpoint,
      disabled: busy,
      onChange: (event) => {
        setEndpoint(event.target.value);
        setConsent(false);
      },
      placeholder: 'https://your-service.example/quality',
    }),
    h(
      'label',
      { className: 'check' },
      h('input', {
        id: 'quality-consent',
        type: 'checkbox',
        checked: consent,
        disabled: busy,
        onChange: (event) => setConsent(event.target.checked),
      }),
      'I agree to send each recording I choose to compare.'
    )
  );
}

export function ChatPanel({
  history,
  draft,
  setDraft,
  partial,
  busy,
  onSend,
  onClear,
  capabilities,
}) {
  return h(
    'section',
    { className: 'chat-panel', 'aria-label': 'Local chat' },
    h(
      'div',
      { className: 'section-title' },
      h('span', { className: 'step' }, '02'),
      h('h2', null, 'Chat on your device')
    ),
    h(
      'p',
      { className: 'hint' },
      'A small experimental model for general research prompts. It can invent facts; do not use it for diagnosis, medication or clinical decisions. Recordings and transcripts are never added to chat automatically.'
    ),
    h(
      'div',
      {
        className: 'chat-messages',
        role: 'log',
        'aria-live': 'polite',
        'aria-label': 'Conversation',
      },
      history.length
        ? history.map((message, i) =>
            h(
              'div',
              { className: `message ${message.role}`, key: i },
              h(
                'strong',
                null,
                message.role === 'user' ? 'You' : 'Local model'
              ),
              h('p', null, message.content)
            )
          )
        : h(
            'div',
            { className: 'empty' },
            h('span', null, '✳'),
            h('h3', null, 'A conversation that stays here.'),
            h('p', null, 'Try “Explain what a speech recognition model does.”')
          ),
      partial &&
        h(
          'div',
          { className: 'message assistant' },
          h('strong', null, 'Local model · generating'),
          h('p', null, partial)
        )
    ),
    h(
      'form',
      {
        onSubmit: (event) => {
          event.preventDefault();
          onSend();
        },
      },
      label('chat-prompt', 'Your message'),
      h('textarea', {
        id: 'chat-prompt',
        value: draft,
        onChange: (event) => setDraft(event.target.value),
        rows: 3,
        maxLength: 1200,
        disabled: busy,
        placeholder: 'Ask a research question…',
      }),
      h(
        'div',
        { className: 'actions' },
        h(
          'button',
          {
            className: 'primary',
            id: 'send-chat',
            disabled: busy || !capabilities.inference || !draft.trim(),
            type: 'submit',
          },
          'Send locally'
        ),
        h(
          'button',
          {
            type: 'button',
            id: 'clear-chat',
            disabled: busy,
            onClick: onClear,
          },
          'Clear chat'
        )
      )
    )
  );
}
