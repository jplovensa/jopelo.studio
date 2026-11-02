import { test, expect } from '@playwright/test';

let runtimeErrors;
test.beforeEach(async ({ page }) => {
  runtimeErrors = [];
  page.on('pageerror', error => runtimeErrors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') runtimeErrors.push(message.text()); });
});
test.afterEach(async () => { expect(runtimeErrors, 'browser console and runtime errors').toEqual([]); });

async function openSite(page) {
  await page.addInitScript(() => sessionStorage.setItem('jopelo-closeup-seen', '1'));
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
}

test('page, assets, video playback and responsive layout', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await openSite(page);
  await expect(page.locator('h1')).toContainText('MAKE A MARK');
  await expect(page.locator('.portrait')).toBeVisible();
  expect(await page.locator('.portrait').evaluate(img => img.complete && img.naturalWidth === 1024)).toBeTruthy();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  for (const id of ['work', 'experience', 'principal', 'capabilities', 'contact']) {
    await page.locator(`#${id}`).scrollIntoViewIfNeeded();
    await expect(page.locator(`#${id} h2`)).toBeVisible();
  }
  await page.locator('#work').scrollIntoViewIfNeeded();
  for (const video of await page.locator('video').all()) {
    await expect.poll(() => video.evaluate(v => v.readyState)).toBeGreaterThanOrEqual(2);
    await video.evaluate(async v => { v.currentTime = 0; await v.play(); });
    await expect.poll(() => video.evaluate(v => v.currentTime)).toBeGreaterThan(0);
  }
  await page.evaluate(() => { document.querySelectorAll('.text-reveal').forEach(el => el.classList.add('is-visible')); window.scrollTo(0, 0); });
  await page.locator('.motion-toggle').click();
  await page.screenshot({ path: `artifacts/${testInfo.project.name}-hero.png` });
  await page.screenshot({ path: `artifacts/${testInfo.project.name}-full.png`, fullPage: true });
  expect(errors).toEqual([]);
});

test('hero moves vertically, pause and resume work', async ({ page }) => {
  await openSite(page);
  const word = page.locator('.kinetic-word > span');
  const transform = () => word.evaluate(el => {
    const m = new DOMMatrix(getComputedStyle(el).transform);
    return { x: m.m41, y: m.m42, animation: getComputedStyle(el).animationName };
  });
  const first = await transform();
  await expect.poll(async () => Math.abs((await transform()).y - first.y)).toBeGreaterThan(1);
  expect((await transform()).x).toBe(0);
  expect(first.animation).toBe('word-rise');
  await page.getByRole('button', { name: 'Pause motion', exact: true }).click();
  await expect(word).toHaveCSS('animation-play-state', 'paused');
  await expect.poll(() => page.locator('video').evaluateAll(vs => vs.every(v => v.paused))).toBeTruthy();
  await page.getByRole('button', { name: 'Resume motion', exact: true }).click();
  await expect(word).toHaveCSS('animation-play-state', 'running');
  const awards = page.locator('.awards-track');
  await page.getByRole('button', { name: 'Pause awards', exact: true }).click();
  await expect(awards).toHaveCSS('animation-play-state', 'paused');
});

test('menu and section navigation', async ({ page }, testInfo) => {
  await openSite(page);
  if (testInfo.project.name === 'mobile') {
    const menu = page.locator('.menu-toggle');
    await menu.click();
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
    await page.screenshot({ path: 'artifacts/mobile-menu.png' });
    await page.keyboard.press('Escape');
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    await menu.click();
  }
  await page.locator('#navigation').getByRole('link', { name: 'Capabilities', exact: true }).click();
  await expect(page).toHaveURL(/#capabilities$/);
  if (testInfo.project.name === 'mobile') await expect(page.locator('.menu-toggle')).toHaveAttribute('aria-expanded', 'false');
  await page.locator('.cinema-copy .button').click();
  await expect(page).toHaveURL(/#work$/);
});

test('all services, form validation, generated message and clipboard', async ({ page, context }, testInfo) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await openSite(page);
  for (const button of await page.locator('[data-service]').all()) {
    const service = await button.getAttribute('data-service');
    await button.click();
    await expect(page.locator('#service')).toHaveValue(service);
    await expect.poll(() => page.locator('#contact').evaluate(el => Math.round(el.getBoundingClientRect().top))).toBe(25);
    await expect(page.locator('#name')).toBeFocused();
  }
  await page.locator('#contact-form button[type=submit]').click();
  await expect(page.locator('#introduction')).toBeHidden();
  await page.locator('#name').fill('Portfolio Visitor');
  await page.locator('#brief').fill('I would like to discuss a new website.');
  await page.locator('#contact-form button[type=submit]').click();
  await expect(page.locator('#introduction')).toBeVisible();
  await expect(page.locator('#message')).toHaveValue(/Portfolio Visitor/);
  await expect(page.locator('#message')).toHaveValue(/I would like to discuss a new website\./);
  await page.getByRole('button', { name: 'Copy introduction', exact: true }).click();
  await expect(page.locator('#copy-status')).toContainText('Copied.');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(await page.locator('#message').inputValue());
  await page.locator('#introduction').screenshot({ path: `artifacts/${testInfo.project.name}-contact.png` });
  await expect(page.locator('#introduction a')).toHaveAttribute('href', 'https://www.linkedin.com/in/josephinepetralovensa/');
});

test('intro replay, skip and Escape restore focus', async ({ page }) => {
  await openSite(page);
  await page.getByRole('button', { name: 'Replay studio opening' }).click();
  await expect(page.locator('#intro')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Skip intro' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#intro')).toBeHidden();
  await expect(page.locator('.brand')).toBeFocused();
  await page.getByRole('button', { name: 'Replay studio opening' }).click();
  await page.getByRole('button', { name: 'Skip intro' }).click();
  await expect(page.locator('#intro')).toBeHidden();
});

test('reduced motion disables movement and video autoplay', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openSite(page);
  await expect(page.locator('#intro')).toBeHidden();
  await expect(page.locator('.kinetic-word > span')).toHaveCSS('animation-name', 'none');
  await expect(page.locator('.awards-track')).toHaveCSS('animation-name', 'none');
  expect(await page.locator('video').evaluateAll(vs => vs.every(v => v.paused))).toBeTruthy();
});
