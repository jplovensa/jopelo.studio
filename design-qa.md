# Design QA

final result: passed

## Findings

No unresolved P0/P1/P2 findings after the fixes and browser verification below.

- Fixed: repeated mobile service selections crashed Chromium during smooth-scroll navigation. Isolated focus and touch handling; using immediate scrolling avoided the failure. Mobile and reduced-motion service navigation now uses `instant`, while desktop retains smooth scrolling. The final mobile service test passes all four selections, input focus, validation, message preparation, and real clipboard copying. Evidence: `artifacts/mobile-contact.png`; passing Playwright report.
- Fixed: full Chromium requested a missing favicon and logged a 404. Added a favicon link to the existing local barcode SVG. Final browser checks report zero console/runtime errors.
- Test correction: mobile menu button changes its accessible name from Menu to Close. The test now locates the persistent button before asserting its expanded state. Menu navigation and Escape both pass.

## Source and implementation evidence

Source visual truth: live https://jplovensa.github.io/jopelo/ captured over the configured HTTPS proxy in Chromium, with TLS verification enabled.

Implementation: http://127.0.0.1:4173/, rendered by standalone Playwright Chromium as explicitly requested by the user. This is not the unavailable integrated Browser panel.

| View | Source | Implementation | Combined comparison |
| --- | --- | --- | --- |
| Desktop hero | `artifacts/reference-desktop-hero.png` | `artifacts/desktop-hero.png` | `artifacts/comparison-desktop-hero.png` |
| Desktop full page | `artifacts/reference-desktop-full.png` | `artifacts/desktop-full.png` | `artifacts/comparison-desktop-full.png` |
| Mobile hero | `artifacts/reference-mobile-hero.png` | `artifacts/mobile-hero.png` | `artifacts/comparison-mobile-hero.png` |
| Mobile full page | `artifacts/reference-mobile-full.png` | `artifacts/mobile-full.png` | `artifacts/comparison-mobile-full.png` |

Desktop viewport: 1440 × 1000 CSS px; hero screenshots 1440 × 1000 px; full screenshots 1440 × 6363 px.
Mobile viewport: 390 × 844 CSS px; hero screenshots 390 × 844 px; full screenshots 390 × 7168 px.
Device scale factor: 1 for both, with no source/implementation density mismatch. Full-page heights match at both sizes. Desktop comparison boards scale each panel to 720 px wide for overall review; mobile panels retain 390 px width. Focused work/contact boards preserve full resolution.

State: introduction dismissed, fonts loaded, motion paused, section reveal transitions completed, contact form initially empty. The kinetic word is paused at different animation phases because its motion is deliberately changed. Video progress and marquee phase differ slightly; those differences were not treated as layout drift.

Focused comparison evidence: `artifacts/comparison-desktop-work.png`, `artifacts/comparison-desktop-contact.png`, `artifacts/comparison-mobile-work.png`, `artifacts/comparison-mobile-contact.png`. Hero boards also provide focused portrait, branding, navigation, and headline comparisons. Additional interaction screenshots: `artifacts/mobile-menu.png`, `artifacts/desktop-contact.png`, `artifacts/mobile-contact.png`.

## Required fidelity surfaces

- Fonts/typography: local source Inter regular and black files retained. Hero, heading hierarchy, weights, wrapping, line height, and small interface labels visually match the source in combined desktop/mobile captures.
- Spacing/layout rhythm: header, portrait stage, centered hero copy, project grid, experience rows, capabilities, contact form, and footer align with the source. Mobile stacks and full-page heights match. Browser tests confirm no horizontal overflow at either viewport.
- Colors/tokens: original dark, paper, muted, red, and gold treatments preserved; combined comparison shows no actionable color drift.
- Asset quality: original portrait, films, posters, fonts, barcode, and arrow icon are local assets. Portrait crop, mask, and sharpness match. Actual playback of both films was verified.
- Copy/content: source sections, project names, roles, descriptions, labels, and external destinations preserved. Contact prepares a LinkedIn introduction; it does not send messages.

## Intentional changes

The JOPELO hero now moves vertically with subtle perspective rotation instead of horizontal drift, behind a stationary portrait. Tests sample its DOMMatrix to verify changing Y and zero X translation, plus pause/resume and reduced-motion support. Mobile service navigation now jumps immediately, as documented above; visual layout is unchanged. Added local favicon and build/test tooling.

## Comparison and verification history

1. Earlier QA was blocked because the integrated Browser tools were unavailable.
2. User explicitly requested standalone Playwright installation. Installed `@playwright/test` and Chromium; captured the live source and local desktop/mobile site.
3. Initial browser run exposed the menu test locator issue and a mobile renderer crash. Corrected the locator. Crash persisted with a single worker and full Chromium, so concurrency alone was not the cause. Diagnostic variants identified immediate service scrolling as a working correction.
4. Corrected mobile scrolling. A subsequent full Chromium run exposed the favicon 404; supplied the existing barcode SVG as favicon.
5. Final run: **12 passed, 0 failed**. Fresh implementation screenshots were recaptured and combined with the settled live reference screenshots for full-page and focused review. No outstanding actionable P0/P1/P2 mismatch.

## Functional evidence

`npm test` runs six tests in each of two projects (desktop/mobile). Passed: layout/assets, loaded portrait, section content, both videos playing, vertical hero movement, motion pause/resume, awards pause, section navigation, mobile menu/Escape, all service selections, form validation, introduction generation, real clipboard copying, intro replay/skip, focus restoration, and reduced-motion behavior. Console and uncaught runtime errors are checked in every test; none occurred in the final run.

`npm run build` and `node --check script.js` pass. Playwright HTML report is available in `playwright-report/` and screenshots in `artifacts/`.

## Implementation checklist

- [x] Install Playwright and Chromium.
- [x] Capture and compare live source and local implementation at both target sizes.
- [x] Fix mobile service navigation and favicon request.
- [x] Pass all 12 browser tests with zero console/runtime errors.
- [x] Save current screenshots and reusable test configuration.

## Remaining scope

Mobile uses Chromium emulation, not a physical device. Firefox and Safari were not tested. External destinations were preserved; no messages were sent or external services audited. No deployment or environment publication was performed.
