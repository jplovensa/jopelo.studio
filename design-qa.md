# Design QA

final result: passed

## Scope and source truth

Requested change: rearrange JOPELO sections using https://renando.duingzcreative.site/ as the ordering reference, preserve the JOPELO hero, and replace whole-word drift with vertical modular letter movement. This is a scoped arrangement/motion update, not a request to copy Renando's palette, identity, content, or components.

Captured source: `artifacts/reference-renando-desktop.png` and `artifacts/reference-renando-mobile.png`. Inspected the live reference in Chromium on desktop and mobile, including progressive scroll captures and heading text. Its relevant flow is selected work → recognition → about/skills → journey → contact. Its 3D process breakdown has no existing JOPELO counterpart and was not fabricated.

JOPELO mapping: hero unchanged in position → Work → Recognition → Principal → Capabilities → Experience → Contact. Recognition and the institutional-background strip were moved out of Experience. Existing content, assets, project links, form, videos, and motion controls remain.

## Evidence and normalization

| Evidence | Paths |
| --- | --- |
| Desktop order comparison, both sources in one image | `artifacts/comparison-section-order-desktop.png` |
| Mobile order comparison, both sources in one image | `artifacts/comparison-section-order-mobile.png` |
| Existing versus updated hero | `artifacts/comparison-hero-preservation-desktop.png`, `artifacts/comparison-hero-preservation-mobile.png` |
| Latest implementation full views | `artifacts/desktop-full.png`, `artifacts/mobile-full.png` |
| Latest hero views | `artifacts/desktop-hero.png`, `artifacts/mobile-hero.png` |
| Focused relocated recognition | `artifacts/recognition-desktop.png`, `artifacts/recognition-mobile.png` |
| Interaction states | `artifacts/mobile-menu.png`, `artifacts/desktop-contact.png`, `artifacts/mobile-contact.png` |

Desktop viewport is 1440 × 1000 CSS px at deviceScaleFactor 1. Source full page is 1440 × 5239 px; updated JOPELO full page is 1440 × 6698 px. Mobile viewport is 390 × 844 CSS px at density 1; source full page is 390 × 5952 px and updated JOPELO is 390 × 7460 px. There is no density mismatch. Full-page heights intentionally differ because JOPELO retains its own hero, content, and typography. Desktop comparison panels are scaled to 720 px wide; mobile panels remain 390 px wide. Hero panels compare matching viewport dimensions.

Source order screenshots use reduced motion for stable capture. Implementation hero/full screenshots dismiss the opening, load local fonts, pause motion, and reveal section headings. Letter positions vary by animation phase; that is the requested motion change. Project video frames and recognition marquee phases are not used for precise pixel matching.

## Findings

No actionable P0/P1/P2 findings remain within the requested scope.

- Section order now follows the reference's relevant progression. Navigation follows the same order, and section numbering is sequential from 01 through 06. Principal and Capabilities together map to the reference's about/skills region, before Experience.
- The hero keeps its portrait framing, crop, gradient mask, headline, copy, CTA, principal credit, and barcode. Only the large JOPELO text animation changes. Each of six letters occupies a fixed horizontal module and moves between three vertical positions with staggered timing and held intervals. No horizontal translation is introduced.
- The expanded navigation remains within the viewport at 641, 768, and 1000 px; the auxiliary location label is hidden at tablet widths to provide space.
- Recognition is now independently navigable, with its pause control and existing LinkedIn credentials link retained. Its reduced-motion mobile layout was inspected at full resolution.

## Required fidelity surfaces

- Fonts and typography: existing local Inter regular/black files, heading hierarchy, wrapping, and interface weights are preserved. New Recognition heading uses the existing section heading system. Hero baseline comparison confirms its text wrapping is preserved.
- Spacing/layout rhythm: preserved hero stage and copy placement; existing section spacing and grid treatment retained while moving sections in actual DOM order. New Recognition uses existing section spacing. No horizontal overflow at desktop/mobile or checked tablet widths.
- Colors/tokens: JOPELO's existing paper, dark, muted, red, and gold palette is preserved. Renando's colors are outside this scoped request.
- Asset fidelity: existing portrait, films, posters, barcode, icon, and fonts are retained without replacements or hotlinks. Video playback remains functional. The reference contributes ordering only.
- Copy/content: existing JOPELO content is preserved. Recognition gets a heading and a short introduction drawn from existing claims; no new awards, statistics, timelines, or affiliations were invented. Section labels and navigation now match the new flow.

## Iteration history

1. Previous browser-verified site passed 12 tests. Its hero screenshots form the preservation baseline.
2. Captured Renando desktop/mobile reference and mapped the existing content without adding an unsupported 3D breakdown.
3. Reordered sections and navigation, separated Recognition, and added modular letter keyframes. Updated the motion test to inspect the individual animated letters rather than the now-stationary outer wrapper.
4. First scoped verification: 14 tests passed; captured and inspected desktop/mobile hero and whole-page sequence boards.
5. Strengthened checks for all-letter pause/reduced-motion behavior, staggered delays, zero horizontal movement, and distinct simultaneous vertical offsets. Final run: **14 passed, 0 failed**, with no browser console or uncaught runtime errors. No visual P0/P1/P2 fixes were necessary after comparison. Supplemental tablet width checks passed at 641, 768, and 1000 px.

Earlier mobile smooth-scroll and favicon fixes remain in place and were covered by the regression suite.

## Validation and implementation checklist

- [x] Reference desktop/mobile capture and DOM section inspection.
- [x] Combined source/implementation ordering comparisons and hero baseline comparisons.
- [x] Focused Recognition review.
- [x] 14 passing Chromium tests, including actual film playback, navigation/menu/Escape, contact form/clipboard, intro replay/skip/focus restoration, all-letter pause/reduced motion, and section order.
- [x] Tablet header and horizontal-width checks.
- [x] Production build and JavaScript syntax checks.

Browser coverage is desktop Chromium and mobile emulation; physical-device Safari and Firefox remain untested. The contact form prepares an introduction and does not send messages. Historical original-clone comparison PNGs remain in `artifacts/`; use the section-order and hero-preservation boards listed above for this revision.
