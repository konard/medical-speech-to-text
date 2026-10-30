import { test, expect } from '@playwright/test';

function silence(seconds = 1) {
  const bytes = Buffer.alloc(44 + seconds * 16000 * 2);
  bytes.write('RIFF');
  bytes.writeUInt32LE(bytes.length - 8, 4);
  bytes.write('WAVEfmt ', 8);
  bytes.writeUInt32LE(16, 16);
  bytes.writeUInt16LE(1, 20);
  bytes.writeUInt16LE(1, 22);
  bytes.writeUInt32LE(16000, 24);
  bytes.writeUInt32LE(32000, 28);
  bytes.writeUInt16LE(2, 32);
  bytes.writeUInt16LE(16, 34);
  bytes.write('data', 36);
  bytes.writeUInt32LE(bytes.length - 44, 40);
  return bytes;
}
const files = (count) =>
  Array.from({ length: count }, (_, i) => ({
    name: `sample-${i + 1}.wav`,
    mimeType: 'audio/wav',
    buffer: silence(),
  }));

async function mockModel(page, delay = 0) {
  await page.route('**/worker.js*', (route) =>
    route.fulfill({
      contentType: 'text/javascript',
      body: `
    globalThis.onmessage = () => setTimeout(() => globalThis.postMessage({type:'result',
      output:{text:'No allergies.',chunks:[{text:'No',timestamp:[0.1,0.3]},{text:'allergies.',timestamp:[0.4,0.7]}]},
      cold:true,loadMs:12,inferenceMs:25}), ${delay});
  `,
    })
  );
}

test('ten recordings, partial references, actual timed words and provenance export', async ({
  page,
}) => {
  await mockModel(page);
  await page.goto('/');
  await page.locator('#files').setInputFiles(files(10));
  await page
    .locator('#references')
    .fill(JSON.stringify({ 'sample-1.wav': 'No allergies.' }));
  await page.getByRole('button', { name: 'Transcribe recordings' }).click();
  await expect(page.locator('#status')).toContainText('10 of 10');
  await expect(page.locator('article[data-status="complete"]')).toHaveCount(10);
  await expect(page.locator('.raw').first()).toHaveText('No allergies.');
  await expect(page.locator('#summary')).toContainText('0.0%');
  await expect(
    page.getByText('No reference · accuracy not scored')
  ).toHaveCount(9);
  const card = page.locator('article').first();
  const audio = card.locator('audio');
  await card.getByRole('button', { name: 'allergies.', exact: true }).click();
  await expect
    .poll(() => audio.evaluate((node) => node.currentTime))
    .toBeCloseTo(0.4, 2);
  await expect(card.locator('.word[aria-current="true"]')).toHaveText(
    'allergies.'
  );
  await audio.evaluate((node) => {
    node.currentTime = 0.35;
  });
  await expect(card.locator('.word[aria-current="true"]')).toHaveCount(0);
  // Observe transitions in the page: locator polling can miss short word spans.
  const playedWords = await audio.evaluate(async (node) => {
    const observed = new Set();
    const recording = node.closest('article');
    const observer = new globalThis.MutationObserver(() => {
      const active = recording.querySelector('.word[aria-current="true"]');
      if (active && !node.paused) {
        observed.add(active.textContent);
      }
    });
    observer.observe(recording, {
      attributes: true,
      subtree: true,
      attributeFilter: ['aria-current'],
    });
    node.currentTime = 0.1;
    await node.play();
    await new Promise((resolve) =>
      node.addEventListener('ended', resolve, { once: true })
    );
    observer.disconnect();
    return [...observed];
  });
  expect(playedWords).toEqual(['No', 'allergies.']);
  await expect.poll(() => audio.evaluate((node) => node.ended)).toBe(true);
  await expect(card.locator('.word[aria-current="true"]')).toHaveCount(0);
  const downloaded = page.waitForEvent('download');
  await page.locator('#export').click();
  const download = await downloaded;
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  const exported = JSON.parse(Buffer.concat(chunks).toString());
  expect(exported.results).toHaveLength(10);
  expect(exported.results[0].audio.sha256).toMatch(/^[a-f0-9]{64}$/);
  expect(exported.results[0].model.revision).toHaveLength(40);
  expect(exported.results[1].score).toBeNull();
  expect(exported.results[0].url).toBeUndefined();
  await page.locator('#clear').click();
  await expect(page.locator('article')).toHaveCount(0);
  await expect(page.locator('#files')).toHaveValue('');
});

test('rejects bad references and excessive batches before inference', async ({
  page,
}) => {
  await mockModel(page);
  await page.goto('/');
  await page.locator('#files').setInputFiles(files(1));
  await page.locator('#references').fill('{"wrong.wav":"x"}');
  await page.locator('#run').click();
  await expect(page.locator('#status')).toContainText('does not match');
  await expect(page.locator('article')).toHaveCount(0);
  await page.locator('#references').fill('[]');
  await page.locator('#run').click();
  await expect(page.locator('#status')).toContainText('object');
  await page.locator('#files').setInputFiles(files(21));
  await page.locator('#run').click();
  await expect(page.locator('#status')).toContainText('1 to 20');
});

test('retains a decode failure and continues to the next file', async ({
  page,
}) => {
  await mockModel(page);
  await page.goto('/');
  await page.locator('#files').setInputFiles([
    {
      name: 'broken.wav',
      mimeType: 'audio/wav',
      buffer: Buffer.from('invalid'),
    },
    ...files(1),
  ]);
  await page.locator('#run').click();
  await expect(page.locator('#status')).toContainText('1 of 2');
  await expect(page.locator('article[data-status="error"]')).toHaveCount(1);
  await expect(page.locator('article[data-status="complete"]')).toHaveCount(1);
});

test('stops an active worker and marks remaining recordings cancelled', async ({
  page,
}) => {
  await mockModel(page, 60000);
  await page.goto('/');
  await page.locator('#files').setInputFiles(files(2));
  await page.locator('#run').click();
  await expect(page.locator('#status')).toContainText('Transcribing');
  await page.locator('#cancel').click();
  await expect(page.locator('#status')).toContainText('Stopped.');
  await expect(page.locator('article[data-status="cancelled"]')).toHaveCount(2);
  await expect(page.locator('#run')).toBeEnabled();
});
