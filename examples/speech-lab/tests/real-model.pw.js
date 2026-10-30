import { test, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

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
  const errors = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    requests.push({ url: url.origin + url.pathname, method: request.method() });
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('./index.html');
  await page.locator('#samples').click();
  await expect(page.locator('#selection')).toContainText('10 PriMock57');
  await page.locator('#run').click();
  await expect(page.locator('#status')).toContainText('10 of 10', {
    timeout: 540000,
  });
  await expect(page.locator('article[data-status="complete"]')).toHaveCount(10);
  await expect(page.locator('.word').first()).toBeVisible();
  const downloadEvent = page.waitForEvent('download');
  await page.locator('#export').click();
  const download = await downloadEvent;
  await mkdir(evidence, { recursive: true });
  await download.saveAs(`${evidence}/browser-results.json`);
  await writeFile(
    `${evidence}/browser-network.json`,
    JSON.stringify({ requests, errors }, null, 2)
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
  await expect(page.locator('#status')).toContainText('1 of 1', {
    timeout: 300000,
  });
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
    JSON.stringify({ requests, errors }, null, 2)
  );
});
