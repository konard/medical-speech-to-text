import { test, expect } from '@playwright/test';

async function mockWorker(page, delay = 0) {
  await page.route('**/worker*.js*', (route) =>
    route.fulfill({
      contentType: 'text/javascript',
      body: `globalThis.onmessage = ({data}) => setTimeout(() => {
    if (data.prepare) { postMessage({type:'result',loadMs:4,cold:true}); return; }
    if (data.messages) { postMessage({type:'token',text:'Local reply.'}); postMessage({type:'result',output:[{generated_text:'Local reply.'}],loadMs:4,inferenceMs:12,firstTokenMs:2,cold:false}); return; }
    postMessage({type:'result',output:{text:'No allergies.',chunks:[{text:'No',timestamp:[0,0.2]}]},loadMs:4,inferenceMs:12,cold:true});
  }, ${delay});`,
    })
  );
}

test('mobile layout, explicit downloads, local chat and stop/retry without uploads', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await mockWorker(page);
  const outgoing = [];
  page.on('request', (request) => {
    if (!['GET', 'HEAD'].includes(request.method())) {
      outgoing.push(request.url());
    }
  });
  await page.goto('/');
  expect(
    await page.evaluate(
      () =>
        globalThis.document.documentElement.scrollWidth <= globalThis.innerWidth
    )
  ).toBe(true);
  await page.locator('#download-model').click();
  await expect(page.locator('#status')).toHaveText(
    'Model ready on this device.'
  );
  await page.locator('#unload-model').click();
  await expect(page.locator('#model-state')).toContainText('Model loads');
  await page.getByRole('button', { name: 'Local chat', exact: true }).click();
  await page.locator('#chat-prompt').fill('Explain speech recognition');
  await page.locator('#send-chat').click();
  await expect(page.locator('.message.assistant')).toHaveText(
    'Local modelLocal reply.'
  );
  await expect(page.locator('#status')).toContainText('Local reply');
  await page.locator('#clear-chat').click();
  await expect(page.locator('.message')).toHaveCount(0);
  expect(outgoing).toEqual([]);
  await page.unroute('**/worker*.js*');
  await page.locator('#unload-model').click();
  await mockWorker(page, 15000);
  await page.locator('#chat-prompt').fill('Hello');
  await page.locator('#send-chat').click();
  await page.locator('#cancel').click();
  await expect(page.locator('#status')).toContainText('Stopped');
  await expect(page.locator('#send-chat')).toBeEnabled(); // prompt retained for retry
  await expect(page.locator('#chat-prompt')).toBeEnabled();
});

test('quality comparison sends only after consent and a per-recording action', async ({
  page,
}) => {
  await mockWorker(page);
  const uploads = [];
  await page.route('https://quality.example/compare', async (route) => {
    uploads.push(route.request().postDataBuffer().toString());
    await route.fulfill({
      json: {
        text: 'No known allergies.',
        model: { id: 'service-asr', revision: 'test-revision' },
      },
    });
  });
  await page.goto('/');
  await page.locator('#samples').click();
  await expect(page.locator('#selection')).toContainText('10 PriMock57');
  await page.locator('#files').evaluate((node) => {
    const files = new globalThis.DataTransfer();
    files.items.add(node.files[0]);
    node.files = files.files;
  });
  await page.locator('#references').fill('');
  await page.locator('#run').click();
  await expect(page.locator('#status')).toContainText('1 of 1');
  await expect(
    page.getByRole('button', { name: 'Compare with quality service' })
  ).toBeDisabled();
  await page
    .getByText('Optional service quality check', { exact: true })
    .click();
  await page
    .locator('#quality-endpoint')
    .fill('https://quality.example/compare');
  expect(uploads).toHaveLength(0);
  await page.locator('#quality-consent').check();
  expect(uploads).toHaveLength(0);
  await page
    .getByRole('button', { name: 'Compare with quality service' })
    .click();
  await expect(page.locator('#status')).toContainText(
    'Quality comparison received'
  );
  await expect(
    page.getByText('Service transcript: No known allergies.')
  ).toBeVisible();
  expect(uploads).toHaveLength(1);
  expect(uploads[0]).toContain('name="audio"');
  expect(uploads[0]).toContain('name="localTranscript"');
  expect(uploads[0]).not.toContain('name="references"');
  await page.locator('#quality-endpoint').fill('https://other.example/compare');
  await expect(page.locator('#quality-consent')).not.toBeChecked();
});

test('microphone permission denial is recoverable', async ({ page }) => {
  await page.addInitScript(() => {
    globalThis.navigator.mediaDevices.getUserMedia = () =>
      Promise.reject(new Error('Microphone permission denied'));
  });
  await page.goto('/');
  await page.locator('#record').click();
  await expect(page.locator('#status')).toContainText(
    'Microphone permission denied'
  );
  await expect(page.locator('#run')).toBeEnabled();
});

test('stopping a pending microphone request recovers immediately and releases a late stream', async ({
  browser,
}) => {
  const context = await browser.newContext({ permissions: ['microphone'] });
  const page = await context.newPage();
  try {
    await page.goto('/');
    await page.evaluate(() => {
      const original = globalThis.navigator.mediaDevices.getUserMedia.bind(
        globalThis.navigator.mediaDevices
      );
      globalThis.navigator.mediaDevices.getUserMedia = (constraints) =>
        original(constraints).then(
          (stream) =>
            new Promise((resolve) => {
              globalThis.capturedTracks = stream.getTracks();
              globalThis.allowMicrophone = () => resolve(stream);
            })
        );
    });
    await page.locator('#record').click();
    await expect(page.locator('#status')).toContainText(
      'Waiting for microphone permission'
    );
    await expect
      .poll(() => page.evaluate(() => typeof globalThis.allowMicrophone))
      .toBe('function');
    await page.locator('#cancel').click();
    await page.screenshot({ path: 'test-results/pending-microphone-stop.png' });
    await expect(page.locator('#status')).toContainText('Stopped');
    await expect(page.locator('#run')).toBeEnabled();
    await page.evaluate(() => globalThis.allowMicrophone());
    await expect
      .poll(() =>
        page.evaluate(() =>
          globalThis.capturedTracks.every(
            (track) => track.readyState === 'ended'
          )
        )
      )
      .toBe(true);
  } finally {
    await context.close();
  }
});

test('real microphone adapter captures and releases tracks before local transcription', async ({
  browser,
}) => {
  const context = await browser.newContext({ permissions: ['microphone'] });
  const page = await context.newPage();
  try {
    await mockWorker(page);
    await page.goto('/');
    await page.evaluate(() => {
      const original = globalThis.navigator.mediaDevices.getUserMedia.bind(
        globalThis.navigator.mediaDevices
      );
      globalThis.navigator.mediaDevices.getUserMedia = async (constraints) => {
        const stream = await original(constraints);
        globalThis.capturedTracks = stream.getTracks();
        return stream;
      };
    });
    await page.locator('#record').click();
    await expect(page.locator('#status')).toContainText('Recording locally');
    // Wait for the browser encoder's first timeslice, not for an ASR stub.
    await page.waitForTimeout(1300);
    await page.locator('#stop-recording').click();
    await expect(page.locator('#selection')).toContainText('microphone.wav');
    expect(
      await page.evaluate(() =>
        globalThis.capturedTracks.every((track) => track.readyState === 'ended')
      )
    ).toBe(true);
    await page.locator('#run').click();
    await expect(page.locator('#status')).toContainText('1 of 1');
  } finally {
    await context.close();
  }
});
