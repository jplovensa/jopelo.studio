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
  for (const id of ['work', 'recognition', 'principal', 'capabilities', 'experience', 'contact']) {
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
  const word = page.locator('.kinetic-letter').first();
  await expect(page.locator('.kinetic-letter')).toHaveCount(6);
  await expect(page.locator('.kinetic-line')).toHaveText('JOPELO');
  const transform = () => word.evaluate(el => {
    const m = new DOMMatrix(getComputedStyle(el).transform);
    return { x: m.m41, y: m.m42, animation: getComputedStyle(el).animationName };
  });
  const first = await transform();
  await expect.poll(async () => Math.abs((await transform()).y - first.y)).toBeGreaterThan(1);
  expect((await transform()).x).toBe(0);
  expect(first.animation).toBe('letter-module');
  const offsets = await page.locator('.kinetic-letter').evaluateAll(letters => letters.map(el => {
    const m = new DOMMatrix(getComputedStyle(el).transform); return { x: m.m41, y: Math.round(m.m42) };
  }));
  expect(offsets.every(offset => offset.x === 0)).toBeTruthy();
  expect(new Set(offsets.map(offset => offset.y)).size).toBeGreaterThan(1);
  await page.getByRole('button', { name: 'Pause motion', exact: true }).click();
  await expect(word).toHaveCSS('animation-play-state', 'paused');
  expect(await page.locator('.kinetic-letter').evaluateAll(letters => letters.every(el => getComputedStyle(el).animationPlayState === 'paused'))).toBeTruthy();
  await expect.poll(() => page.locator('video').evaluateAll(vs => vs.every(v => v.paused))).toBeTruthy();
  await page.getByRole('button', { name: 'Resume motion', exact: true }).click();
  await expect(word).toHaveCSS('animation-play-state', 'running');
  const awards = page.locator('.awards-track');
  await page.getByRole('button', { name: 'Pause awards', exact: true }).click();
  await expect(awards).toHaveCSS('animation-play-state', 'paused');
});

test('menu and section navigation', async ({ page }, testInfo) => {
  await openSite(page);
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip')).toBeFocused();
  await expect(page.locator('.skip')).toHaveCSS('opacity', '1');
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
  await expect(page.locator('.kinetic-letter').first()).toHaveCSS('animation-name', 'none');
  expect(await page.locator('.kinetic-letter').evaluateAll(letters => letters.every(el => getComputedStyle(el).animationName === 'none'))).toBeTruthy();
  await expect(page.locator('.awards-track')).toHaveCSS('animation-name', 'none');
  expect(await page.locator('video').evaluateAll(vs => vs.every(v => v.paused))).toBeTruthy();
});


test('sections and navigation follow the reference sequence', async ({ page }) => {
  await openSite(page);
  const order = ['work', 'recognition', 'principal', 'capabilities', 'experience', 'contact'];
  expect(await page.locator('main > section[id]').evaluateAll(sections => sections.map(s => s.id))).toEqual(order);
  expect(await page.locator('#navigation a').evaluateAll(links => links.map(a => a.hash))).toEqual(order.map(id => `#${id}`));
  expect(await page.locator('.section-label > span:first-child').allTextContents()).toEqual([
    '01 / SELECTED WORK', '02 / RECOGNITION', '03 / THE PRINCIPAL', '04 / CAPABILITIES',
    '05 / THE EXPERIENCE BEHIND THE WORK', '06 / YOUR NEXT CHAPTER',
  ]);
  await expect(page.locator('#recognition .awards')).toBeAttached();
  await expect(page.locator('#experience .awards')).toHaveCount(0);
  const delays = await page.locator('.kinetic-letter').evaluateAll(letters => letters.map(el => getComputedStyle(el).animationDelay));
  expect(new Set(delays).size).toBe(6);
});

test('recorded hero previews, award and four venture logos', async ({ page }) => {
  await openSite(page);
  await expect(page.locator('.project-fjall h3')).toHaveText('Fjäll Group');
  await expect(page.locator('.project-fjall p')).toContainText('EPS building systems');
  await expect(page.locator('.project-fjall p')).not.toContainText('Chief Business Officer');
  await page.locator('#work').scrollIntoViewIfNeeded();
  for (const video of await page.locator('.project-video').all()) {
    await expect.poll(() => video.evaluate(v => v.readyState)).toBeGreaterThanOrEqual(2);
    expect(await video.evaluate(v => v.duration)).toBeCloseTo(12, 0);
    expect(await video.evaluate(v => v.videoWidth)).toBe(1280);
    expect(await video.evaluate(v => v.videoHeight)).toBe(720);
    await expect(video).toHaveAttribute('aria-label', /live website hero preview/);
  }
  await page.locator('#recognition').scrollIntoViewIfNeeded();
  await expect(page.locator('.awards-group').first()).toContainText('The Women’s Tabloid Award');
  await expect(page.locator('.award-detail h3')).toHaveText('Emerging Woman CEO – Real Estate 2024');
  await expect(page.locator('.award-detail a')).toHaveAttribute('href', 'https://awards.womenstabloid.com/awards/leadership-awards-2024/');
  await page.locator('.venture-logos').scrollIntoViewIfNeeded();
  expect(await page.locator('.venture-logos img').evaluateAll(imgs => imgs.map(img => img.alt))).toEqual(['Antler', 'Iterative', 'Startupbootcamp', 'Startup Studio Indonesia']);
  for (const img of await page.locator('.venture-logos img').all()) {
    await expect.poll(() => img.evaluate(i => i.complete && i.naturalWidth > 0)).toBeTruthy();
    await expect(img).toBeVisible();
  }
});
