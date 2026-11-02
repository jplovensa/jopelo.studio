# JOPELO Studio

Responsive frontend recreation of https://jplovensa.github.io/jopelo/ using its locally downloaded portrait, fonts, project films, icons, and page content.

## Development

Requires Node.js 20.19+ or 22.12+ (validated with Node.js 24).

```sh
npm ci
npm run dev -- --host 0.0.0.0 --port 4173 --strictPort
```

## Production

```sh
npm run build
npm run preview -- --host 0.0.0.0 --port 4173
```

Build output is in `dist/`. No API keys or backend required.

## Motion and interactions

The hero JOPELO word moves vertically with a perspective tilt behind the stationary portrait. Mobile uses a smaller movement range. Pause motion stops the word and films; operating-system reduced-motion preferences disable animation. The studio opening can be skipped or replayed, and recognition has its own pause control.

Includes responsive navigation, section links, original external project links, service selection, and a contact form that prepares an introduction for copying to LinkedIn. The form does not send messages or store submissions.

## Browser verification

Playwright and Chromium are configured for desktop (1440 × 1000) and mobile (390 × 844) verification.

```sh
npm ci
npx playwright install chromium
npm test
```

The test runner starts the Vite server automatically, or reuses an existing development server on port 4173. To inspect the latest HTML report, run `npx playwright show-report`. Screenshots are saved in `artifacts/`, test reports and failure traces are ignored by Git.

All 12 Chromium tests passed: responsive layout without horizontal overflow, asset loading, actual video playback, vertical-only hero translation, pause/resume, awards, navigation, mobile menu/Escape, all four services, form validation, introduction generation, clipboard, intro replay/skip/focus, and reduced motion. No console or JavaScript runtime errors were detected. Production build and JavaScript syntax checks pass.

Live reference and implementation screenshots were compared at desktop and mobile sizes; see `design-qa.md`. Mobile service jumps use immediate scrolling to avoid a Chromium crash encountered with repeated smooth-scroll navigation. Desktop service navigation remains smooth. A local barcode SVG supplies the favicon.

Verification covers desktop Chromium and Chromium mobile emulation; real-device Safari and Firefox have not been tested. External project/LinkedIn destinations were preserved, but messages were not sent and external sites were not audited.
