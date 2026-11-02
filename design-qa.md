# Design QA

final result: passed

## Current scope: cinematic service catalogue

Implemented user-selected Style 2, revised to use existing project media and restrained studio typography. Target: `artifacts/capabilities-selected-target.png` (1487 × 1058). The selected composition is a featured landscape player, service details and two actions, with five landscape cards below. Mobile places a horizontally scrolling card rail between the player and service details.

The five authored films cover Strategy & storytelling, Web experiences, Brand worlds, Styling your space, and Ventures & real estate. Each is 12 seconds, 1280 × 720, 24fps H.264 with original AAC stereo sound design. Actual Fjäll/SECHA footage, site recordings, logos and existing portfolio imagery replace generated decorative props. Studio+ interiors retain their classification as concepts. Provenance: `assets/services/sources.json`; renderer: `tools/render-service-trailers.py`.

## Visual evidence

Opened and compared target and browser output in `artifacts/comparison-capabilities.png`, normalized to 720 px per panel. The hierarchy, dark palette, large left player, right details and five-card rail match the selected direction. Native controls, scope text and video-safe 16:9 geometry are deliberate functional adaptations.

- Desktop section: `artifacts/capabilities-desktop.png` (1440 × 1032).
- Mobile section: `artifacts/capabilities-mobile.png` (390 × 873).
- Full player: `artifacts/service-trailer-dialog-desktop.png` and `artifacts/service-trailer-dialog-mobile.png`.
- Film review: `artifacts/service-film-contact-sheet.jpg`, showing four frames from each of the five films.
- Full page regression: `artifacts/desktop-full.png` and `artifacts/mobile-full.png`.

Captures use Chromium at 1440 × 1000 and 390 × 844, device scale factor 1. Section comparison uses reduced motion and loaded media. Intermediate widths 641, 768, 900, 901, 1024 and 1180 px passed overflow and action-bound checks.

## Findings and fixes

No actionable P0/P1/P2 findings remain.

1. P1: image height attributes overrode thumbnail geometry. Added explicit automatic image height; final screenshots and landscape-ratio regression confirm the fix. Before evidence: `artifacts/capabilities-initial-desktop.png` and `artifacts/capabilities-initial-mobile.png`.
2. P1: Escape could hide the full player before its audio stopped. Pause now occurs synchronously on Escape, Close, backdrop and enquiry; desktop/mobile tests confirm immediate stop.
3. P2: an unrelated body mutation could restart a manually paused preview. Eligibility-transition tracking preserves manual pause; interaction regression confirms it remains paused through other page controls.

## Five fidelity surfaces

- Typography: existing local Inter, strong display hierarchy and small editorial labels match the selected direction; service titles wrap without clipping.
- Spacing: desktop split and five equal landscape cards preserve the target rhythm; mobile uses a scrollable rail and stacked details with visible actions.
- Colors: existing charcoal, warm white and orange tokens; selected card uses the accent underline.
- Assets: locally hosted footage and original portfolio images, proper 16:9 framing, original type edits, licensed Bootstrap play icon. No newly generated photographic scenes.
- Copy: original service names, descriptions, scopes and enquiry mapping; no invented client results or claims of completed interiors.

## Verification

Latest Playwright result: **30 passed, 0 failed**, covering desktop/mobile, all five trailers, real playback and metadata, sound on explicit Watch, dismissal and enquiry handoff, keyboard selection, reduced motion/global pause/manual pause, and existing site features. Supplemental hover/backdrop checks and responsive review passed. Production build with `/jopelo.studio/` and JavaScript/Python syntax checks pass.

Browser coverage is Chromium desktop/mobile emulation. Safari, Firefox and physical devices were not tested. Original sound is heard only after explicit Watch. Contact still prepares an introduction without sending it.

---

# Previous addition: styling portfolio

final result: passed

## Scope

Add a “Styling your space” service and bring the user’s design portfolio and taste into JOPELO. The user explicitly confirmed SECHA Studio+ as the portfolio source. This is a scoped addition in JOPELO’s existing visual language, not a full restyling of the website or a pixel clone of Studio+.

The section follows Work, before Recognition. Navigation and section numbering are updated. Capabilities and the contact form now include the styling service. Existing hero, modular lettering, preloader-on-refresh, project recordings, awards and venture logos are preserved.

## Source truth

Source page: https://www.sechahome.com/studio/ . Inspected its full portfolio and opened Josephine’s designer-direction panel in Chromium.

- Signature direction: “Purpose before everything.” Start with the life the room needs to support, plan around daily routines, give each element a purpose, and carry the concept through to its finish.
- Source style card: “Considered living,” with warm timber, earthy surfaces and soft textiles. The palette is sampled from the rendered source panel: `#79634b`, `#c9b494`, `#ebe4d7`.
- Four downloaded source concepts: Warm Modern, Soft Contemporary, Earthy Retreat, and Urban Studio. Their original WebP images, names, material language, and generated-concept attribution are retained. They are not presented as completed client projects.
- Source URLs and image provenance: `assets/media-sources.json` → `styling_portfolio`.

Source screenshot: `artifacts/source-josephine-design-direction.png` (1440 × 1000 px). Original room images are in `assets/styling/`.

## Comparison evidence

Both source and implementation were opened and compared in combined images:

- `artifacts/comparison-styling-direction.png`: the source’s personal direction/palette next to the adapted JOPELO direction panel. The source content region is cropped and normalized to the same 520 px panel width as the implementation. The heading intentionally uses JOPELO’s established display weight, not Studio+’s lighter body treatment.
- `artifacts/comparison-styling-images.jpg`: each original source image next to its browser-rendered JOPELO preview. Both panels normalize to 360 × 240 px; the source crop, subject, colors and aspect ratio are preserved. JOPELO’s “View concept” overlay is an intentional interaction affordance.

Implementation screenshots:

| State | Desktop | Mobile |
| --- | --- | --- |
| Styling section | `artifacts/styling-desktop.png` (1440 × 1600) | `artifacts/styling-mobile.png` (390 × 2514) |
| Open Warm Modern dialog | `artifacts/styling-dialog-desktop.png` (960 × 744) | `artifacts/styling-dialog-mobile.png` (356 × 552) |
| Full page | `artifacts/desktop-full.png` (1440 × 8897) | `artifacts/mobile-full.png` (390 × 10738) |

Focused direction: `artifacts/styling-direction.png`. Individual preview evidence: `artifacts/styling-warm-modern.png`, `artifacts/styling-soft-contemporary.png`, `artifacts/styling-earthy-retreat.png`, `artifacts/styling-urban-studio.png`.

Browser viewports: 1440 × 1000 desktop and 390 × 844 mobile, deviceScaleFactor 1. No image-density mismatch. Section captures use reduced motion and loaded images/fonts; dialog captures use normal motion after the studio opening is dismissed. The source palette panel was captured at the same desktop density. New layout proportions intentionally differ from the source because the portfolio is adapted to JOPELO’s design.

## Findings

No actionable P0/P1/P2 findings remain.

- The featured Warm Modern interior and personal material palette provide a clear design direction. Three additional looks complete the four-style portfolio.
- Every concept opens a native, labelled modal with a larger image, material language, description, a style-specific Studio+ link, and “Discuss this look.”
- The enquiry selects “Styling your space,” carries over the chosen look, and preserves existing brief text. Changing looks replaces only the previous automatically added style note.
- Native dialog focus, Escape, Close, backdrop dismissal and focus restoration work. Closing the dialog before navigating allows the contact form to receive focus normally.
- The seven-link navigation switches to a menu at tablet widths to prevent collisions. Checks at 641, 768, 900, 901, 1024 and 1180 px pass; the styling destination works through the tablet menu.
- Section numbering is sequential: Work 01, Styling 02, Recognition 03, Principal 04, Capabilities 05, Experience 06, Contact 07.

## Five fidelity surfaces

- Fonts/typography: existing local Inter files, large display headings, small editorial labels and body hierarchy remain. Material labels and captions are readable at the target sizes, with no clipped headlines. Studio+’s personal direction is adapted to JOPELO’s display hierarchy intentionally.
- Spacing/layout rhythm: new section uses the existing paper palette, 4% outer gutters, section labels, heading rhythm and divider rules. Featured image/direction form a desktop split; mobile stacks cleanly. The three smaller concepts become full-width mobile cards. Dialog fits within the viewport and scrolls internally when needed.
- Colors/tokens: JOPELO’s dark, paper, muted and accent tokens remain. Josephine’s three palette colors are taken from her actual Studio+ direction panel. No new site-wide theme is introduced.
- Image quality: original local Studio+ WebPs are used with descriptive alt text and preserved 3:2 composition. Larger dialog previews use those same images. No stock substitutes, hotlinks, fabricated finished-project imagery or redrawn assets are used.
- Copy/content: the source-backed purpose-led approach and material preferences are retained in first-person site copy. Concept titles/materials match the source. Generated-concept attribution and Studio+ links remain visible. No invented fees, delivery promises, completed-project credits or client claims are added.

## Comparison history

1. Inspected the public Studio+ portfolio, asked for the source preference, and received user confirmation to use Studio+.
2. Opened Josephine’s design-direction panel rather than inferring personal taste from the full studio gallery. Captured its copy and material palette.
3. Added the section, original concept images, enlarged previews, service option, capability entry and brief handoff.
4. First browser run: **22 passed, 0 failed**. Focused desktop/mobile review and combined source/implementation comparisons found no actionable P0/P1/P2 visual issue, so no visual-fix iteration was required.
5. Supplemental responsive checks passed at six tablet/desktop boundary widths; all styling images loaded and no horizontal overflow occurred.

## Validation

`npm run build -- --base=/jopelo.studio/` and `node --check script.js` pass.

`npm test`: **22 passed, 0 failed**. New checks cover all four dialogs, images, close-button focus, Escape/focus restoration, Close/backdrop dismissal, selected-style enquiries, preserving typed text and replacing an older auto-generated style note. Existing checks cover the main hero, all sections/navigation, recordings, awards/logos, refresh preloader, reduced motion, keyboard skip link, services and contact/clipboard. No browser console or uncaught runtime errors occurred.

## Checklist and limits

- [x] User-confirmed portfolio and personal taste sourced directly.
- [x] Four original images hosted locally and source attribution retained.
- [x] New service connected to Capabilities and contact brief.
- [x] Accessible preview interactions tested on desktop/mobile Chromium.
- [x] Combined source/implementation and focused visual review.
- [x] Production build, 22 browser tests and six breakpoint checks passed.

Coverage is Chromium desktop and mobile emulation. Physical devices, Safari and Firefox were not tested. The contact form still prepares an introduction; it does not send messages automatically. Earlier artifacts document prior revisions; use the styling evidence listed here for this addition.
