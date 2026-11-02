import { test, expect } from '@playwright/test';

let runtimeErrors;
test.beforeEach(async ({ page }) => {
  runtimeErrors = [];
  page.on('pageerror', error => runtimeErrors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') runtimeErrors.push(message.text()); });
});
test.afterEach(async () => { expect(runtimeErrors, 'browser console and runtime errors').toEqual([]); });

async function openSite(page) {
  await page.goto('/');
  if (await page.locator('#intro').isVisible()) await page.getByRole('button', { name: 'Skip intro', exact: true }).click();
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
  for (const id of ['work', 'styling', 'recognition', 'principal', 'capabilities', 'experience', 'contact']) {
    await page.locator(`#${id}`).scrollIntoViewIfNeeded();
    await expect(page.locator(`#${id} h2`)).toBeVisible();
  }
  await page.locator('#work').scrollIntoViewIfNeeded();
  for (const video of await page.locator('.project-video').all()) {
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
  await page.locator('.brand').focus();
  await page.keyboard.press('Shift+Tab');
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
  for (const button of await page.locator('[data-service]:visible').all()) {
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
  const order = ['work', 'styling', 'recognition', 'principal', 'capabilities', 'experience', 'contact'];
  expect(await page.locator('main > section[id]').evaluateAll(sections => sections.map(s => s.id))).toEqual(order);
  expect(await page.locator('#navigation a').evaluateAll(links => links.map(a => a.hash))).toEqual(order.map(id => `#${id}`));
  expect(await page.locator('.section-label > span:first-child').allTextContents()).toEqual([
    '01 / SELECTED WORK', '02 / STYLING YOUR SPACE', '03 / RECOGNITION', '04 / THE PRINCIPAL', '05 / CAPABILITIES',
    '06 / THE EXPERIENCE BEHIND THE WORK', '07 / YOUR NEXT CHAPTER',
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


test('studio opening plays on every refresh, including previously seen sessions', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('jopelo-closeup-seen', '1'));
  await page.goto('/');
  await expect(page.locator('#intro')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Skip intro', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Skip intro', exact: true }).click();
  await expect(page.locator('#intro')).toBeHidden();
  await page.reload();
  await expect(page.locator('#intro')).toBeVisible();
  await expect(page.locator('#intro-count')).toHaveText('001 / 003');
  await expect(page.locator('#intro')).toBeHidden({ timeout: 5000 });
  await expect(page.locator('.brand')).toBeFocused();
  await page.reload();
  await expect(page.locator('#intro')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#intro')).toBeHidden();
});


test('styling portfolio previews show each source concept and restore focus', async ({ page }, testInfo) => {
  await openSite(page);
  const names = ['Warm Modern', 'Soft Contemporary', 'Earthy Retreat', 'Urban Studio'];
  await expect(page.locator('#styling h2')).toContainText('STYLING');
  await expect(page.locator('.styling-note')).toContainText('Purpose before');
  await expect(page.locator('.style-collection-label')).toContainText('GENERATED INTERIOR CONCEPTS');
  for (const name of names) {
    const preview = page.getByRole('button', { name: `View ${name} design concept`, exact: true });
    await preview.click();
    await expect(page.locator('#style-dialog')).toBeVisible();
    await expect(page.locator('#style-dialog-title')).toHaveText(name);
    await expect.poll(() => page.locator('#style-dialog-image').evaluate(img => img.complete && img.naturalWidth > 0)).toBeTruthy();
    await expect(page.getByRole('button', { name: 'Close', exact: true })).toBeFocused();
    expect(await page.locator('#style-dialog').evaluate(el => el.scrollWidth <= el.clientWidth)).toBeTruthy();
    if (name === 'Warm Modern') await page.locator('#style-dialog').screenshot({ path: `artifacts/styling-dialog-${testInfo.project.name}.png` });
    await page.keyboard.press('Escape');
    await expect(page.locator('#style-dialog')).toBeHidden();
    await expect(preview).toBeFocused();
  }
  await page.getByRole('button', { name: 'View Warm Modern design concept', exact: true }).click();
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(page.locator('#style-dialog')).toBeHidden();
  await page.getByRole('button', { name: 'View Warm Modern design concept', exact: true }).click();
  await page.mouse.click(3, 3);
  await expect(page.locator('#style-dialog')).toBeHidden();
});

test('styling enquiry carries the chosen look without losing the existing brief', async ({ page }) => {
  await openSite(page);
  await page.locator('#brief').fill('Please keep my reading chair.');
  for (const name of ['Warm Modern', 'Earthy Retreat']) {
    await page.getByRole('button', { name: `View ${name} design concept`, exact: true }).click();
    await page.getByRole('button', { name: 'Discuss this look', exact: true }).click();
    await expect(page.locator('#style-dialog')).toBeHidden();
    await expect(page.locator('#service')).toHaveValue('Styling your space');
    await expect(page.locator('#brief')).toHaveValue(new RegExp(`Preferred direction: ${name}\\.`));
    await expect(page.locator('#brief')).toHaveValue(/Please keep my reading chair/);
    await expect(page.locator('#name')).toBeFocused();
  }
  expect(await page.locator('#brief').inputValue()).not.toContain('Preferred direction: Warm Modern.');
  await page.locator('#name').fill('Styling Visitor');
  await page.locator('#contact-form button[type=submit]').click();
  await expect(page.locator('#message')).toHaveValue(/styling your space/);
  await expect(page.locator('#message')).toHaveValue(/Earthy Retreat/);
  await expect(page.locator('#message')).toHaveValue(/Please keep my reading chair/);
});


test('service catalogue selects all five films and carries each service to the brief', async ({ page }) => {
  await openSite(page);
  const services = ['Strategy & storytelling', 'Web experiences', 'Brand worlds', 'Styling your space', 'Ventures & real estate'];
  const thumbnailRatios = await page.locator('.service-thumb > img').evaluateAll(images => images.map(img => {
    const bounds = img.getBoundingClientRect(); return bounds.width / bounds.height;
  }));
  expect(thumbnailRatios.every(ratio => Math.abs(ratio - 16 / 9) < .04)).toBeTruthy();
  for (const name of services) {
    const button = page.getByRole('button', { name: `Preview ${name}`, exact: true });
    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#service-title')).toHaveText(name + '.');
    await expect(page.locator('[data-preview-service][aria-pressed=true]')).toHaveCount(1);
    const transcript = page.locator('.service-info .chat-transcript');
    await transcript.locator('summary').click();
    await expect(transcript.locator('li')).toHaveCount(5);
    await expect(transcript.locator('li').nth(3)).toContainText('JOPELO:');
    if (name === 'Web experiences') await expect(transcript).toContainText("it's a website. not popcorn.");
    if (name === 'Styling your space') await expect(transcript).toContainText('my room has no personality');
    await page.locator('#service-inquire').click();
    await expect(page.locator('#service')).toHaveValue(name);
    await expect(page.locator('#name')).toBeFocused();
  }
});

test('five actual service trailers decode, play with sound and stop on close', async ({ page }, testInfo) => {
  await openSite(page);
  for (const name of ['Strategy & storytelling', 'Web experiences', 'Brand worlds', 'Styling your space', 'Ventures & real estate']) {
    await page.getByRole('button', { name: `Preview ${name}`, exact: true }).click();
    await page.locator('#service-watch').click();
    await expect(page.locator('#trailer-dialog')).toBeVisible();
    await expect(page.locator('#trailer-dialog-title')).toHaveText(name);
    await expect.poll(() => page.locator('#trailer-video').evaluate(v => v.readyState)).toBeGreaterThanOrEqual(2);
    expect(await page.locator('#trailer-video').evaluate(v => Math.round(v.duration))).toBe(12);
    expect(await page.locator('#trailer-video').evaluate(v => v.videoWidth)).toBe(1280);
    expect(await page.locator('#trailer-video').evaluate(v => v.videoHeight)).toBe(720);
    expect(await page.locator('#trailer-video').evaluate(v => v.muted)).toBe(false);
    await expect.poll(() => page.locator('#trailer-video').evaluate(v => v.currentTime)).toBeGreaterThan(0);
    expect(await page.locator('#service-preview').evaluate(v => v.paused)).toBeTruthy();
    if (name === 'Web experiences') {
      await page.locator('#trailer-video').evaluate(v => { v.pause(); v.currentTime = 11.4; });
      await expect.poll(() => page.locator('#trailer-video').evaluate(v => !v.seeking && v.readyState >= 2)).toBeTruthy();
      await page.locator('#trailer-dialog').screenshot({ path: `artifacts/service-trailer-dialog-${testInfo.project.name}.png` });
      const transcript = page.locator('#trailer-dialog .chat-transcript');
      await transcript.locator('summary').click();
      await expect(transcript).toContainText("it's a website. not popcorn.");
    }
    await page.keyboard.press('Escape');
    await expect(page.locator('#trailer-dialog')).toBeHidden();
    expect(await page.locator('#trailer-video').evaluate(v => v.paused)).toBeTruthy();
    await expect(page.locator('#service-watch')).toBeFocused();
  }
});

test('service previews respect global pause and reduced motion; keyboard selection works', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openSite(page);
  await page.locator('#capabilities').scrollIntoViewIfNeeded();
  expect(await page.locator('#service-preview').evaluate(v => v.paused && v.muted)).toBeTruthy();
  const first = page.getByRole('button', { name: 'Preview Strategy & storytelling', exact: true });
  await first.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('button', { name: 'Preview Web experiences', exact: true })).toBeFocused();
  await expect(page.locator('#service-title')).toHaveText('Web experiences.');
  await page.keyboard.press('End');
  await expect(page.locator('#service-title')).toHaveText('Ventures & real estate.');
  await page.keyboard.press('Home');
  await expect(first).toBeFocused();
  await expect(page.locator('#service-title')).toHaveText('Strategy & storytelling.');
  await page.locator('#service-watch').click();
  await expect.poll(() => page.locator('#trailer-video').evaluate(v => !v.paused && v.currentTime > 0)).toBeTruthy();
  await page.getByRole('button', { name: 'Close trailer', exact: true }).click();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.getByRole('button', { name: 'Pause motion', exact: true }).click();
  await page.locator('#capabilities').scrollIntoViewIfNeeded();
  expect(await page.locator('#service-preview').evaluate(v => v.paused)).toBeTruthy();
  await page.getByRole('button', { name: 'Resume motion', exact: true }).click();
  await page.locator('#service-preview').scrollIntoViewIfNeeded();
  await expect.poll(() => page.locator('#service-preview').evaluate(v => !v.paused && v.muted)).toBeTruthy();
  await page.locator('#service-preview').evaluate(v => v.pause());
  await page.getByRole('button', { name: 'Pause awards', exact: true }).click();
  await page.locator('#service-preview').scrollIntoViewIfNeeded();
  expect(await page.locator('#service-preview').evaluate(v => v.paused)).toBeTruthy();
});

test('full trailer enquiry uses the selected service and closes playback', async ({ page }) => {
  await openSite(page);
  await page.getByRole('button', { name: 'Preview Brand worlds', exact: true }).click();
  await page.locator('#service-watch').click();
  await expect(page.locator('#trailer-dialog')).toBeVisible();
  await page.locator('#trailer-dialog-inquire').click();
  await expect(page.locator('#trailer-dialog')).toBeHidden();
  await expect(page.locator('#service')).toHaveValue('Brand worlds');
  await expect(page.locator('#name')).toBeFocused();
  expect(await page.locator('#trailer-video').evaluate(v => v.paused)).toBeTruthy();
});
