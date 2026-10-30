import { test, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { CHAT_MODEL } from '../config.js';

test('real pinned Whisper model on ten attributed mock-consultation clips', async ({
  page,
}) => {
  test.skip(
    process.env.REAL_ASR !== '1',
    'Explicit network/model integration run'
  );
  test.setTimeout(600000);
  const evidence = 'test-results/model-evidence';
  const requests = [];
  const hostingAcknowledgements = [];
  const errors = [];
  let acknowledgingHost = false;
  page.on('request', (request) => {
    const url = new URL(request.url());
    // The source host requires an empty acknowledgement before loading the app.
    // Capture it separately, before any recordings or references are selected.
    if (
      acknowledgingHost &&
      request.method() === 'POST' &&
      url.href === page.url() &&
      !request.postData()
    ) {
      hostingAcknowledgements.push({
        url: url.href,
        method: 'POST',
        bodyBytes: 0,
      });
      return;
    }
    requests.push({ url: url.origin + url.pathname, method: request.method() });
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('./index.html');
  if (
    new URL(page.url()).hostname === 'raw.githack.com' &&
    (await page.title()) === 'External Content Notice | rawgit.hack'
  ) {
    acknowledgingHost = true;
    try {
      await page
        .getByRole('button', { name: 'Open the page', exact: true })
        .click();
    } finally {
      acknowledgingHost = false;
    }
    expect(hostingAcknowledgements).toHaveLength(1);
  }
  // A host-notice navigation can commit before deferred module imports finish.
  await page.waitForLoadState('load');
  await page.exposeFunction('reportModelStatus', (value) =>
    console.log(`Browser status: ${value}`)
  );
  await page.locator('#status').evaluate((node) => {
    new globalThis.MutationObserver(() =>
      globalThis.reportModelStatus(node.textContent)
    ).observe(node, { childList: true, subtree: true, characterData: true });
  });
  await page.locator('#samples').click();
  await expect(page.locator('#selection')).toContainText('10 PriMock57');
  await page.locator('#run').click();
  await expect(page.locator('#status')).toContainText('Finished', {
    timeout: 540000,
  });
  await expect(page.locator('#status')).toContainText('10 of 10');
  await expect(page.locator('article[data-status="complete"]')).toHaveCount(10);
  await expect(page.locator('.word').first()).toBeVisible();
  const downloadEvent = page.waitForEvent('download');
  await page.locator('#export').click();
  const download = await downloadEvent;
  await mkdir(evidence, { recursive: true });
  await download.saveAs(`${evidence}/browser-results.json`);
  await writeFile(
    `${evidence}/browser-network.json`,
    JSON.stringify({ requests, hostingAcknowledgements, errors }, null, 2)
  );
  const posts = requests.filter(
    (request) => request.method !== 'GET' && request.method !== 'HEAD'
  );
  expect(posts).toEqual([]);
  expect(errors).toEqual([]);
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.locator('article').first().locator('.word').first().click();
  await expect(
    page.locator('article').first().locator('.word[aria-current="true"]')
  ).toHaveCount(1);
  await page.screenshot({
    path: `${evidence}/result.png`,
  });
  await page.locator('#clear').click();
  await page.locator('#samples').click();
  await expect(page.locator('#selection')).toContainText('10 PriMock57');
  await page.locator('#files').evaluate((input) => {
    const one = new globalThis.DataTransfer();
    one.items.add(input.files[0]);
    input.files = one.files;
  });
  await page.locator('#references').fill('');
  await page.locator('#model').selectOption('base');
  await page.locator('#run').click();
  await expect(page.locator('#status')).toContainText('Finished', {
    timeout: 300000,
  });
  await expect(page.locator('#status')).toContainText('1 of 1');
  await expect(page.locator('.raw')).not.toBeEmpty();
  await expect(
    page.getByText('No reference · accuracy not scored')
  ).toBeVisible();
  const baseDownloadEvent = page.waitForEvent('download');
  await page.locator('#export').click();
  await (
    await baseDownloadEvent
  ).saveAs(`${evidence}/browser-base-result.json`);
  expect(errors).toEqual([]);
  expect(
    requests.every((request) => ['GET', 'HEAD'].includes(request.method))
  ).toBe(true);
  await writeFile(
    `${evidence}/browser-network.json`,
    JSON.stringify({ requests, hostingAcknowledgements, errors }, null, 2)
  );
});

test('real pinned local chat, warm offline reply and model cache removal', async ({
  page,
}) => {
  test.skip(
    process.env.REAL_ASR !== '1',
    'Explicit network/model integration run'
  );
  test.setTimeout(600000);
  const requests = [];
  const errors = [];
  // The source host's empty acknowledgement is separate from app traffic.
  let acknowledgingHost = false;
  const hostingAcknowledgements = [];
  page.on('request', (request) => {
    if (
      acknowledgingHost &&
      request.method() === 'POST' &&
      !request.postData() &&
      request.url() === page.url()
    ) {
      hostingAcknowledgements.push({
        url: request.url(),
        method: 'POST',
        bodyBytes: 0,
      });
      return;
    }
    requests.push({
      url: new URL(request.url()).origin + new URL(request.url()).pathname,
      method: request.method(),
    });
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('./index.html');
  if (
    new URL(page.url()).hostname === 'raw.githack.com' &&
    (await page.title()) === 'External Content Notice | rawgit.hack'
  ) {
    acknowledgingHost = true;
    try {
      await page
        .getByRole('button', { name: 'Open the page', exact: true })
        .click();
    } finally {
      acknowledgingHost = false;
    }
    expect(hostingAcknowledgements).toHaveLength(1);
  }
  await page.getByRole('button', { name: 'Local chat', exact: true }).click();
  await page
    .locator('#chat-prompt')
    .fill('What is speech recognition? Answer in one sentence.');
  await page.locator('#send-chat').click();
  await expect(page.locator('#status')).toContainText('Local reply', {
    timeout: 540000,
  });
  await expect(page.locator('.message.assistant')).not.toBeEmpty();
  const first = await page.locator('.message.assistant').textContent();
  await page.context().setOffline(true);
  await page.locator('#chat-prompt').fill('Say hello briefly.');
  await page.locator('#send-chat').click();
  await expect(page.locator('#status')).toContainText('warm model', {
    timeout: 120000,
  });
  const messages = await page.locator('.message').allTextContents();
  expect(messages).toHaveLength(4);
  await page.context().setOffline(false);
  await page.getByText('Device & storage', { exact: true }).click();
  await expect(page.locator('details').first()).toContainText(
    'cached model files'
  );
  const cache = page
    .locator('details')
    .first()
    .getByText(/^\d+ cached model files/);
  await expect(cache).toContainText(/[1-9]\d* cached model files/);
  const cachedBefore = await cache.textContent();
  const evidence = 'test-results/model-evidence';
  await mkdir(evidence, { recursive: true });
  await writeFile(
    `${evidence}/chat-results.json`,
    JSON.stringify(
      {
        observedAt: new Date().toISOString(),
        model: {
          ...CHAT_MODEL,
          runtime: 'Transformers.js 3.8.1',
          device: 'wasm',
          threads: 1,
        },
        first,
        messages,
        status: await page.locator('#status').textContent(),
        cachedBefore,
        hostingAcknowledgements,
        requests,
        errors,
      },
      null,
      2
    )
  );
  expect(
    requests.every((request) => ['GET', 'HEAD'].includes(request.method))
  ).toBe(true);
  expect(errors).toEqual([]);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: `${evidence}/chat.png`, fullPage: true });
  await page.locator('#delete-models').click();
  await expect(page.locator('#status')).toContainText('Deleted');
  await expect(cache).toContainText(/^0 cached model files/);
});
