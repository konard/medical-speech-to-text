import { test, expect } from '@playwright/test';

test('built medical landing page works under the GitHub Pages repository path', async ({
  page,
  baseURL,
}) => {
  test.skip(
    !process.env.SPEECH_LAB_URL,
    'Run test:pages against the built Pages server'
  );
  const failures = [];
  page.on('pageerror', (error) => failures.push(error.message));
  page.on('response', (response) => {
    if (response.url().startsWith(baseURL) && response.status() >= 400) {
      failures.push(`${response.status()} ${response.url()}`);
    }
  });
  await page.route('**/worker*.js*', (route) =>
    route.fulfill({
      contentType: 'text/javascript',
      body: `onmessage = () => postMessage({type:'result',output:{text:'No allergies.',chunks:[{text:'No',timestamp:[0.1,0.3]}]},cold:true,loadMs:1,inferenceMs:1})`,
    })
  );
  await page.goto('./');
  await expect(page).toHaveTitle('Speech Lab · Medical speech research');
  await page.locator('#samples').click();
  await expect(page.locator('#selection')).toContainText('10 PriMock57');
  await page.locator('#run').click();
  await expect(page.locator('#status')).toContainText('10 of 10');
  await expect(page.locator('article[data-status="complete"]')).toHaveCount(10);
  await expect(page.locator('.word').first()).toBeVisible();
  await page.locator('article').first().locator('.word').first().click();
  await expect(
    page.locator('article').first().locator('.word[aria-current="true"]')
  ).toHaveCount(1);
  await page.getByRole('button', { name: 'Local chat', exact: true }).click();
  await expect(page.locator('#chat-prompt')).toBeVisible();
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () =>
          globalThis.document.documentElement.scrollWidth <=
          globalThis.innerWidth
      )
    ).toBe(true);
  }
  expect(failures).toEqual([]);
});
