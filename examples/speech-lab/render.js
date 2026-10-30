import { activeWord, aggregateScores } from '../../src/speech/index.js';

export const element = (tag, className, text) => {
  const node = globalThis.document.createElement(tag);
  if (className) {
    node.className = className;
  }
  if (text !== undefined) {
    node.textContent = text;
  }
  return node;
};
export const rate = (value) =>
  value === null || value === undefined ? '—' : `${(value * 100).toFixed(1)}%`;

function playback(card, result) {
  const audio = element('audio');
  audio.controls = true;
  audio.preload = 'metadata';
  audio.src = result.url;
  audio.setAttribute('aria-label', `Play ${result.name}`);
  card.append(audio);
  const paragraph = element('div', 'transcript');
  paragraph.setAttribute('aria-label', 'Timed words');
  const buttons = result.words.map((word) => {
    const button = element('button', 'word', word.text);
    button.title = `Seek to ${word.start.toFixed(2)} seconds`;
    button.addEventListener('click', () => {
      audio.currentTime = word.start;
    });
    paragraph.append(button, ' ');
    return button;
  });
  if (buttons.length) {
    card.append(paragraph);
  }
  let frame;
  const update = () => {
    const active = activeWord(result.words, audio.currentTime);
    buttons.forEach((button, index) =>
      button.setAttribute('aria-current', String(index === active))
    );
    if (!audio.paused && !audio.ended) {
      frame = globalThis.requestAnimationFrame(update);
    }
  };
  audio.addEventListener('play', () => {
    globalThis.cancelAnimationFrame(frame);
    update();
  });
  audio.addEventListener('timeupdate', () => {
    if (audio.paused) {
      update();
    }
  });
  audio.addEventListener('seeked', () => {
    if (audio.paused) {
      update();
    }
  });
  audio.addEventListener('pause', () => {
    globalThis.cancelAnimationFrame(frame);
    update();
  });
  return () => {
    globalThis.cancelAnimationFrame(frame);
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
  };
}

export function renderResult(result, container) {
  const card = element('article', 'recording');
  card.dataset.status = result.status;
  card.append(
    element(
      'h3',
      '',
      `${String(result.index + 1).padStart(2, '0')} / ${result.name}`
    )
  );
  container.append(card);
  if (result.status !== 'complete') {
    card.append(element('p', 'error', result.error || result.status));
    return () => {};
  }
  const { inferenceMs, loadMs, cold } = result.timing;
  card.append(
    element(
      'p',
      'result-meta',
      `${result.duration.toFixed(1)}s audio · ${(inferenceMs / 1000).toFixed(1)}s inference · RTF ${(inferenceMs / (result.duration * 1000)).toFixed(2)} · ${cold ? 'cold' : 'warm'} load ${(loadMs / 1000).toFixed(1)}s`
    )
  );
  card.append(
    element('p', 'raw', result.text || '(No speech returned by model)')
  );
  const cleanup = playback(card, result);
  card.append(
    element(
      'p',
      'result-meta',
      result.words.length
        ? `${result.words.length} timed words · Estimated alignment; gaps and invalid intervals are not highlighted.`
        : 'No valid word timestamps returned. The transcript remains available.'
    )
  );
  if (result.reference !== undefined) {
    card.append(
      element('p', 'reference', `Reference: ${result.reference || '(silence)'}`)
    );
    card.append(
      element(
        'p',
        'result-meta',
        `WER ${rate(result.score.word.rate)} · CER ${rate(result.score.character.rate)} · ${result.score.word.errors} word errors / ${result.score.word.referenceLength} reference words`
      )
    );
  } else {
    card.append(
      element('p', 'result-meta', 'No reference · accuracy not scored')
    );
  }
  if (result.command) {
    card.append(
      element(
        'p',
        'command',
        `Command preview: ${JSON.stringify(result.command)}`
      )
    );
  }
  const details = element('details');
  details.append(
    element('summary', '', 'Model & recording provenance'),
    element(
      'pre',
      '',
      JSON.stringify(
        { model: result.model, audio: result.audio, timing: result.timing },
        null,
        2
      )
    )
  );
  card.append(details);
  return cleanup;
}

export function renderSummary(results, container) {
  const complete = results.filter((result) => result.status === 'complete');
  const scores = aggregateScores(complete.map((result) => result.score));
  container.replaceChildren();
  for (const [label, value] of [
    ['Completed', `${complete.length} / ${results.length}`],
    ['Scored references', scores.scored],
    ['Word error rate', rate(scores.word.rate)],
    ['Character error rate', rate(scores.character.rate)],
  ]) {
    const metric = element('div');
    metric.append(element('strong', '', value), element('span', '', label));
    container.append(metric);
  }
  container.hidden = false;
}
