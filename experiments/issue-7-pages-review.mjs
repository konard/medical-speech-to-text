// Capture the actual public page or a served candidate at the repository subpath.
import { chromium } from '../examples/speech-lab/node_modules/playwright/index.mjs';
import { mkdir, writeFile } from 'node:fs/promises';
const url =
  process.env.REVIEW_URL || 'https://konard.github.io/medical-speech-to-text/';
const label = process.env.REVIEW_LABEL || 'before';
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/opt/google/chrome/chrome',
  args: ['--no-sandbox'],
});
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(url, { waitUntil: 'networkidle' });
  await mkdir('docs/screenshots/issue-7', { recursive: true });
  for (const [device, width, height] of [
    ['desktop', 1440, 1000],
    ['mobile', 390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    await page.screenshot({
      path: `docs/screenshots/issue-7/${label}-${device}.png`,
      fullPage: true,
    });
  }
  await writeFile(
    `docs/case-studies/issue-7/data/${label}-page.json`,
    `${JSON.stringify(
      {
        observedAt: new Date().toISOString(),
        url: page.url(),
        title: await page.title(),
        text: await page.locator('body').innerText(),
        errors,
      },
      null,
      2
    )}\n`
  );
} finally {
  await browser.close();
}
