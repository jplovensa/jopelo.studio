# Design QA

final result: passed

## Current scope

Replace Fjäll Group and SECHA title sequences with recordings of their real website heroes, rewrite Fjäll Group’s portfolio description, add The Women’s Tabloid Award, and add official Antler, Iterative, Startupbootcamp, and Startup Studio Indonesia logos. The user confirmed Startup Studio Indonesia. The previously approved hero composition, six-letter modular movement, section order, and contact flow are retained.

## Source evidence

- Live hero pages: https://www.fjallgroup.com/ and https://www.sechahome.com/.
- Source captures: `artifacts/source-fjall-hero.png` and `artifacts/source-secha-hero.png`, each 1280 × 720 px.
- Each site was opened in Chromium over the configured HTTPS proxy with TLS verification intact. Opening intros were dismissed. The actual hero background media was allowed to play, sound muted, and the viewport recorded. Intros and initial loading were trimmed away.
- Local videos: `assets/fjall-trailer.mp4` and `assets/secha-trailer.mp4`. Both are 12-second 1280 × 720 H.264, 24 fps, silent, yuv420p, with faststart metadata. `ffprobe` and browser decoding verify dimensions/duration.
- Recording frame evidence at 0, 6, and 11 seconds: `artifacts/recorded-hero-frames.jpg`.
- Source/recorded-preview comparison boards: `artifacts/comparison-fjall-hero-preview.jpg` and `artifacts/comparison-secha-hero-preview.jpg`. Each combines the source capture and encoded poster in the same image; panels scale equally to 720 × 405 px. Ambient video phases differ, while headline, navigation, framing, and page identity match.
- Official logo source URLs and capture metadata are saved in `assets/media-sources.json`. Antler’s original header SVG was copied verbatim; the other three assets were downloaded from the organizations’ official websites. No logos were redrawn or hotlinked.
- Award detail and recipient are cited by SECHA and linked to https://awards.womenstabloid.com/awards/leadership-awards-2024/ : Emerging Woman CEO – Real Estate 2024, Josephine Petra Lovensa. No additional award category or year was invented.

## Implementation evidence

Browser viewport: desktop 1440 × 1000 CSS px and mobile 390 × 844 CSS px, device scale factor 1. There is no density mismatch within comparisons. Native video controls are intentionally retained around the recorded website preview; they are not part of the recorded source website.

- Full implementation: `artifacts/desktop-full.png` (1440 × 7054), `artifacts/mobile-full.png` (390 × 7905).
- Focused project cards: `artifacts/work-desktop.png` (1440 × 1069), `artifacts/work-mobile.png` (390 × 1396).
- Focused recognition/logos: `artifacts/recognition-desktop.png` (1440 × 1052), `artifacts/recognition-mobile.png` (390 × 1012).
- Existing hero captures: `artifacts/desktop-hero.png`, `artifacts/mobile-hero.png`.

Full-page captures use normal motion, dismissed studio intro, loaded fonts, revealed headings and paused previews. Focused content captures use reduced motion to inspect the wrapped award and all venture logos. Ambient movie position and native control paint may differ by frame; the videos were also tested while playing, not accepted from posters alone.

## Findings and comparison history

No actionable P0/P1/P2 issue remains in the requested scope.

1. Initial recording inspection found the sites’ full-screen opening films. Final captures explicitly exclude these and record the actual hero views instead. A transient SECHA loading/play-toggle race was resolved by waiting for its hero media and recording it playing muted. Final frame comparisons show the intended websites, not intro films or loading pages.
2. Initial logo review identified a P2 contrast issue: Startup Studio Indonesia’s official horizontal wordmark is white and was hard to read on paper. Its tile now uses the existing dark token, retaining the white/red brand asset without recoloring it. Post-fix evidence: both focused Recognition captures. The other three marks remain on light tiles.
3. Updated old “opening sequence/title treatment” copy to describe website hero previews and rewrote Fjäll Group’s description from its current construction technology, design, EPS, and modular building content. The portfolio card no longer uses Josephine’s Chief Business Officer role as the project description.
4. Added the award to both marquee copies, its static details and source link, and Principal recognition copy. Reduced-motion text wraps so the longer name is not clipped.
5. Added opacity-based offscreen skip-link hiding while preserving keyboard focus visibility. Project autoplay is initiated by the existing preference-aware script rather than the HTML attribute, with deferred loading for reduced-motion visitors. Normal autoplay, pause/resume, actual video decoding, and reduced-motion behavior pass regression checks.
6. Final Chromium run: **16 passed, 0 failed**, with zero console or uncaught runtime errors. Supplemental desktop/mobile captures verified all four logos load and reduced-motion layouts have no horizontal overflow. Source/encoded-preview comparisons and the focused project/recognition views were inspected after the fixes.

## Required fidelity surfaces

- Fonts/typography: JOPELO’s existing local Inter fonts, heading sizes, and modular hero remain. The recorded heroes retain their own real source typography. New award details use the existing type hierarchy, and the long award name wraps under reduced motion.
- Spacing/layout: project cards retain the existing desktop two-column and mobile stacked layout, with 16:9 video viewports. Venture marks form four columns on desktop and two on mobile. Institutional background is retained below them. Existing section order and navigation remain unchanged.
- Colors/tokens: existing paper/dark/red/gold palette remains. Logos retain official colors; the white SSI mark uses a dark tile for contrast.
- Image/asset fidelity: actual live hero recordings, H.264 compression, generated source-frame posters, and official local logo assets replace the old title sequences/text-only venture strip. Both videos decode and play at the intended dimensions. No placeholder graphics or handmade brand marks are used.
- Copy/content: Fjäll Group is correctly accented in its project card and link; its description now explains the website and construction technology proposition. The Women’s Tabloid recognition includes its verified recipient/category/year and source link. “Venture background” avoids claiming every organization directly invested capital. Existing UNHCR background remains.

## Validation

`npm test`: 16 desktop/mobile Chromium checks passed. Includes actual playback of both clips, 12-second duration and 1280 × 720 resolution, all four image assets, source-linked award details, rewritten copy, preserved section/nav sequence, six-letter hero motion/pause/reduced motion, keyboard skip link, menu/Escape, all service choices, form validation, clipboard, and studio intro focus restoration.

`npm run build -- --base=/jopelo.studio/` and `node --check script.js` pass. The module entry is relative so it also resolves correctly under project subpaths.

## Checklist and limits

- [x] Actual hero recordings and matching posters.
- [x] Rewritten Fjäll Group card.
- [x] The Women’s Tabloid Award and source-linked details.
- [x] Four official venture logos, including user-confirmed Startup Studio Indonesia.
- [x] Final browser checks and visual review after fixes.
- [x] Asset provenance recorded.

Coverage is Chromium desktop and mobile emulation. Physical devices, Safari, and Firefox were not tested. Historical ordering/hero-preservation boards in `artifacts/` document the earlier revision; use the new media comparisons and focused views for this update. External award and organization pages were linked, not modified.
