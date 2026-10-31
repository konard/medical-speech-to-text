import { createElement as h, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { loadSamples } from './samples.js';
import {
  validateFiles,
  parseReferences,
  validateWords,
  scoreTranscript,
  commandProposal,
  runBatch,
} from '../../src/speech/index.js';
import { MODELS, CHAT_MODEL } from './config.js';
import { decodeAudio } from './audio.js';
import { Inference } from './inference.js';
import { Capture, capturedFile } from './capture.js';
import {
  capabilityReport,
  chatMessages,
  modelCache,
  compareQuality,
} from './device.js';
import { renderSummary } from './render.js';
import {
  ModelPanel,
  SpeechInputs,
  ResultCard,
  QualitySettings,
  ChatPanel,
} from './views.js';

function download(payload, name) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  );
  const anchor = globalThis.document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Hooks and event handlers share the page session; rendering lives in the view components.
// eslint-disable-next-line max-lines-per-function
function App() {
  const [mode, setMode] = useState('speech');
  const [model, setModel] = useState('tiny');
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState('');
  const [status, setStatus] = useState('Ready when you are');
  const [results, setResults] = useState([]);
  const [selection, setSelection] = useState('No recordings selected');
  const [commandMode, setCommandMode] = useState(false);
  const [recording, setRecording] = useState(false);
  const [cacheCount, setCacheCount] = useState(0);
  const [history, setHistory] = useState([]);
  const [draft, setDraft] = useState('');
  const [partial, setPartial] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [consent, setConsent] = useState(false);
  const input = useRef();
  const references = useRef();
  const summary = useRef();
  const session = useRef({
    inference: new Inference(),
    capture: new Capture(),
    cancelled: false,
    urls: [],
    files: [],
    controller: null,
    captureTimer: null,
  });
  const capabilities = capabilityReport();
  const selectedModel = mode === 'speech' ? MODELS[model] : CHAT_MODEL;
  const refreshCache = () =>
    modelCache()
      .then(setCacheCount)
      .catch(() => setCacheCount(0));
  const unload = () => {
    session.current.inference.stop();
    setReady('');
  };
  const revoke = () => {
    session.current.urls.forEach((url) => URL.revokeObjectURL(url));
    session.current.urls = [];
  };

  useEffect(() => {
    refreshCache();
    const active = session.current;
    const leave = () => {
      active.cancelled = true;
      active.inference.stop();
      active.capture.cancel();
      clearTimeout(active.captureTimer);
      active.controller?.abort();
      active.urls.forEach((url) => URL.revokeObjectURL(url));
    };
    globalThis.addEventListener('pagehide', leave);
    return () => {
      leave();
      globalThis.removeEventListener('pagehide', leave);
    };
  }, []);
  useEffect(() => {
    renderSummary(results, summary.current);
    if (!results.length) {
      summary.current.hidden = true;
    }
  }, [results]);

  async function task(action) {
    if (busy) {
      return;
    }
    setBusy(true);
    session.current.cancelled = false;
    session.current.controller = new AbortController();
    try {
      await action();
    } catch (error) {
      setStatus(
        session.current.cancelled
          ? 'Stopped. Completed results are available.'
          : String(error.message || error)
      );
    } finally {
      setBusy(false);
      session.current.controller = null;
      refreshCache();
    }
  }
  function stop() {
    session.current.cancelled = true;
    session.current.inference.stop();
    session.current.capture.cancel();
    clearTimeout(session.current.captureTimer);
    session.current.controller?.abort();
    setRecording(false);
    setReady('');
    setStatus('Stopping…');
  }
  function clear() {
    unload();
    revoke();
    setResults([]);
    session.current.files = [];
    input.current.value = '';
    references.current.value = '';
    globalThis.document.getElementById('reference-file').value = '';
    setSelection('No recordings selected');
    setConsent(false);
    setStatus(
      'Recordings and results cleared. Cached model weights remain in browser storage.'
    );
  }
  async function transcribe(file, selected, refs) {
    setStatus(`Reading ${file.name}…`);
    const url = URL.createObjectURL(file);
    session.current.urls.push(url);
    const decoded = await decodeAudio(file, url);
    if (session.current.cancelled) {
      throw new Error('Stopped');
    }
    const hash = await globalThis.crypto.subtle.digest(
      'SHA-256',
      await file.arrayBuffer()
    );
    const sha256 = Array.from(new Uint8Array(hash), (byte) =>
      byte.toString(16).padStart(2, '0')
    ).join('');
    if (session.current.cancelled) {
      throw new Error('Stopped');
    }
    setStatus(`Transcribing ${file.name}…`);
    const prediction = await session.current.inference.run(
      decoded.samples,
      selected,
      setStatus
    );
    const { text, chunks } = prediction.output;
    if (typeof text !== 'string') {
      throw new Error('Model returned no transcript');
    }
    setReady(selected.id);
    return {
      name: file.name,
      url,
      text,
      chunks,
      words: validateWords(chunks, decoded.duration),
      duration: decoded.duration,
      reference: refs[file.name],
      score: scoreTranscript(refs[file.name], text),
      model: {
        ...selected,
        runtime: 'Transformers.js 3.8.1',
        device: 'wasm',
        dtype: 'q8',
        threads: 1,
      },
      audio: {
        sha256,
        bytes: file.size,
        channels: decoded.channels,
        decodedSampleRate: decoded.sampleRate,
        inferenceSampleRate: 16000,
      },
      timing: {
        loadMs: prediction.loadMs,
        inferenceMs: prediction.inferenceMs,
        cold: prediction.cold,
      },
      ...(commandMode ? { command: commandProposal(text, true) } : {}),
    };
  }
  function run() {
    let files;
    let refs;
    try {
      files = validateFiles(input.current.files);
      refs = parseReferences(references.current.value.trim() || '{}');
      const names = new Set(files.map((file) => file.name));
      if (Object.keys(refs).some((name) => !names.has(name))) {
        throw new Error(
          'A reference filename does not match any selected recording'
        );
      }
    } catch (error) {
      setStatus(error.message);
      return;
    }
    task(async () => {
      revoke();
      setResults([]);
      session.current.files = files;
      session.current.startedAt = new Date().toISOString();
      const complete = await runBatch(
        files,
        (file) => transcribe(file, MODELS[model], refs),
        () => session.current.cancelled,
        (result) => {
          setResults((current) => [
            ...current,
            { ...result, name: files[result.index].name },
          ]);
        }
      );
      setStatus(
        session.current.cancelled
          ? 'Stopped. Completed results are available.'
          : `Finished · ${complete.filter((result) => result.status === 'complete').length} of ${files.length} recordings transcribed`
      );
    });
  }
  function samples() {
    task(async () => {
      setStatus('Loading ten public mock-consultation clips…');
      const loaded = await loadSamples(session.current.controller.signal);
      if (session.current.cancelled) {
        return;
      }
      input.current.files = loaded.files;
      references.current.value = JSON.stringify(loaded.references, null, 2);
      setSelection('10 PriMock57 clips · one mock consultation · CC BY 4.0');
      setStatus(
        'Ten public samples ready. Select Transcribe recordings to run the model.'
      );
    });
  }
  function record() {
    task(async () => {
      setStatus('Waiting for microphone permission…');
      try {
        const blob = await session.current.capture.start(() => {
          setRecording(true);
          setStatus('Recording locally · maximum 60 seconds');
          session.current.captureTimer = setTimeout(
            () => session.current.capture.stop(),
            60000
          );
        });
        if (session.current.cancelled) {
          return;
        }
        const file = await capturedFile(blob);
        if (session.current.cancelled) {
          return;
        }
        const transfer = new globalThis.DataTransfer();
        transfer.items.add(file);
        input.current.files = transfer.files;
        references.current.value = '';
        setSelection('microphone.wav · captured locally');
        setStatus(
          'Microphone recording ready. Select Transcribe recordings to review it.'
        );
      } finally {
        setRecording(false);
        clearTimeout(session.current.captureTimer);
      }
    });
  }
  function send() {
    let messages;
    try {
      messages = chatMessages(history, draft);
    } catch (error) {
      setStatus(error.message);
      return;
    }
    task(async () => {
      setHistory(messages);
      setDraft('');
      setPartial('');
      setStatus('Loading local chat…');
      try {
        const prediction = await session.current.inference.chat(
          messages,
          CHAT_MODEL,
          setStatus,
          (text) => setPartial((current) => current + text)
        );
        const generated = prediction.output?.[0]?.generated_text;
        const text =
          typeof generated === 'string'
            ? generated
            : generated?.at(-1)?.content;
        if (typeof text !== 'string' || !text.trim()) {
          throw new Error('Chat model returned no reply');
        }
        setHistory([...messages, { role: 'assistant', content: text }]);
        setReady(CHAT_MODEL.id);
        setStatus(
          `Local reply · ${(prediction.inferenceMs / 1000).toFixed(1)}s generation · ${prediction.firstTokenMs === null ? 'first token unmeasured' : `${Math.round(prediction.firstTokenMs)}ms to first text`} · ${prediction.cold ? 'cold' : 'warm'} model`
        );
      } catch (error) {
        setHistory(history);
        setDraft(messages.at(-1).content);
        throw error;
      } finally {
        setPartial('');
      }
    });
  }
  function compare(result) {
    task(async () => {
      setStatus(`Sending ${result.name} to your approved quality service…`);
      const quality = await compareQuality({
        endpoint,
        consent,
        file: session.current.files[result.index],
        text: result.text,
        model: result.model,
        signal: AbortSignal.any([
          session.current.controller.signal,
          AbortSignal.timeout(60000),
        ]),
      });
      setResults((current) =>
        current.map((item) =>
          item.index === result.index ? { ...item, quality } : item
        )
      );
      setStatus(
        'Quality comparison received. Review both transcripts; disagreement is not an accuracy score.'
      );
    });
  }
  const exportResults = () =>
    download(
      {
        schema: 'speech-lab/v1',
        startedAt: session.current.startedAt,
        exportedAt: new Date().toISOString(),
        userAgent: globalThis.navigator.userAgent,
        notes:
          'Research only. Word timestamps are estimates. No missing reference is scored.',
        results: results.map((result) =>
          Object.fromEntries(
            Object.entries(result).filter(([key]) => key !== 'url')
          )
        ),
      },
      'speech-lab-results.json'
    );

  return h(
    'div',
    null,
    h(
      'header',
      null,
      h(
        'a',
        { className: 'brand', href: './index.html' },
        h('span', { className: 'mark' }, '∿'),
        'Speech Lab'
      ),
      h('span', { className: 'badge' }, 'ON-DEVICE RESEARCH'),
      h(
        'a',
        {
          href: 'https://github.com/konard/medical-speech-to-text/tree/main/docs/case-studies/issue-7',
        },
        'Research ↗'
      )
    ),
    h(
      'main',
      null,
      h(
        'section',
        { className: 'intro' },
        h('p', { className: 'eyebrow' }, 'SMALL MODELS. YOUR DEVICE.'),
        h('h1', null, 'Every word, in context.'),
        h(
          'p',
          null,
          'Transcribe, listen and compare. Or start a local conversation.'
        ),
        h(
          'div',
          { className: 'privacy' },
          h('span', null, '◉'),
          h(
            'p',
            null,
            h('strong', null, 'Local by default. '),
            'Audio and chat stay in this browser unless you explicitly compare a recording with your service. Public model downloads use global hosts. Use public or synthetic data here.'
          )
        )
      ),
      h(
        'nav',
        { className: 'mode-switch', 'aria-label': 'Research tools' },
        ...[
          ['speech', 'Transcribe'],
          ['chat', 'Local chat'],
        ].map(([key, title]) =>
          h(
            'button',
            {
              key,
              'aria-pressed': mode === key,
              disabled: busy,
              onClick: () => {
                unload();
                setMode(key);
                setStatus('Ready when you are');
              },
            },
            title
          )
        )
      ),
      h(
        'div',
        { className: 'statusbar' },
        h('span', { id: 'status-dot' }),
        h('p', { id: 'status', role: 'status', 'aria-live': 'polite' }, status),
        h('button', { id: 'cancel', disabled: !busy, onClick: stop }, 'Stop')
      ),
      h(
        'div',
        { className: 'workspace' },
        h(
          'div',
          { className: 'setup' },
          h(ModelPanel, {
            mode,
            model,
            setModel: (value) => {
              unload();
              setModel(value);
            },
            busy,
            ready: ready === selectedModel.id,
            cacheCount,
            capabilities,
            onUnload: () => {
              unload();
              setStatus('Model unloaded. Downloaded files remain cached.');
            },
            onPrepare: () =>
              task(async () => {
                await session.current.inference.prepare(
                  selectedModel,
                  setStatus
                );
                setReady(selectedModel.id);
                setStatus('Model ready on this device.');
              }),
            onDelete: () =>
              task(async () => {
                unload();
                const count = await modelCache(globalThis, true);
                setStatus(
                  `Deleted ${count} cached model files belonging to this demo.`
                );
              }),
          }),
          h(
            'div',
            { hidden: mode !== 'speech' },
            h(SpeechInputs, {
              busy,
              input,
              references,
              selection,
              commandMode,
              setCommandMode,
              recording,
              capabilities,
              onRun: run,
              onSamples: samples,
              onSelection: () =>
                setSelection(
                  Array.from(input.current.files, (file) => file.name).join(
                    ' · '
                  ) || 'No recordings selected'
                ),
              onRecord: record,
              onStopRecord: () => session.current.capture.stop(),
              onReferenceFile: async (event) => {
                const file = event.target.files[0];
                if (!file) {
                  return;
                }
                try {
                  if (file.size > 250000) {
                    throw new Error(
                      'Reference file must be at most 250000 bytes'
                    );
                  }
                  const text = await file.text();
                  parseReferences(text);
                  references.current.value = text;
                  setStatus('Reference JSON loaded');
                } catch (error) {
                  setStatus(error.message);
                }
              },
            }),
            h(QualitySettings, {
              endpoint,
              setEndpoint,
              consent,
              setConsent,
              busy,
            })
          )
        ),
        h(
          'div',
          { className: 'results-pane', hidden: mode !== 'speech' },
          h(
            'div',
            { className: 'section-title' },
            h('h2', null, 'Listen & review'),
            h(
              'button',
              {
                id: 'export',
                className: 'quiet',
                disabled: busy || !results.length,
                onClick: exportResults,
              },
              'Export JSON ↓'
            )
          ),
          h('div', {
            id: 'summary',
            className: 'summary',
            ref: summary,
            hidden: true,
          }),
          h(
            'div',
            { id: 'results' },
            results.length
              ? results.map((result) =>
                  h(ResultCard, {
                    key: `${session.current.startedAt}-${result.index}`,
                    result,
                    onCompare: compare,
                    canCompare: !busy && consent && Boolean(endpoint),
                  })
                )
              : h(
                  'div',
                  { className: 'empty' },
                  h('span', null, '≋'),
                  h('h3', null, 'Your recordings become readable.'),
                  h(
                    'p',
                    null,
                    'Add a recording or try the public dataset. Select a timed word to hear it in context.'
                  ),
                  h(
                    'div',
                    { className: 'pills' },
                    h('span', null, 'Local inference'),
                    h('span', null, 'Word timing'),
                    h('span', null, 'WER & CER')
                  )
                )
          ),
          h(
            'button',
            { id: 'clear', className: 'quiet', disabled: busy, onClick: clear },
            'Clear recordings & results'
          )
        ),
        h(
          'div',
          { hidden: mode !== 'chat' },
          h(ChatPanel, {
            history,
            draft,
            setDraft,
            partial,
            busy,
            capabilities,
            onSend: send,
            onClear: () => {
              setHistory([]);
              setPartial('');
              setDraft('');
              setStatus('Chat cleared from this page.');
            },
          })
        )
      ),
      h(
        'footer',
        null,
        h(
          'p',
          null,
          'Research only · Review medical terms, doses and negations before clinical use.'
        ),
        h(
          'p',
          null,
          'English models · Estimated word timing · No CRM connection · No Australian deployment claimed'
        )
      )
    )
  );
}

createRoot(globalThis.document.getElementById('root')).render(h(App));
