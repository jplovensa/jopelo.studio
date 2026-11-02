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

The hero JOPELO word is split into six fixed horizontal letter modules. Each letter steps vertically between three rows with staggered timing, behind the stationary portrait. Mobile uses a smaller movement range. Pause motion stops the word and films; operating-system reduced-motion preferences disable animation. The studio opening plays on every page load and refresh, with no session-based suppression. It can be skipped or replayed, and recognition has its own pause control.

Project cards use 12-second live-site hero recordings captured from www.fjallgroup.com and www.sechahome.com after dismissing their opening intros. Both are local 1280 × 720 H.264 MP4 files with generated posters, silent playback, looping, and native controls. Existing motion controls and reduced-motion preferences also govern these previews. Videos start through the preference-aware script; reduced-motion visitors see posters without automatic video downloads.

Recognition includes The Women’s Tabloid Award, with the source-linked Emerging Woman CEO – Real Estate 2024 recognition for Josephine Petra Lovensa. Venture background includes the official Antler, Iterative, Startupbootcamp, and user-confirmed Startup Studio Indonesia logos. Source URLs and recording details are documented in `assets/media-sources.json`.

The “Styling your space” section uses the user-confirmed SECHA Studio+ portfolio: Warm Modern, Soft Contemporary, Earthy Retreat, and Urban Studio. Josephine’s “Purpose before everything” direction and considered-living palette are sourced from her designer panel. The images retain the source’s generated-concept attribution rather than being presented as completed client projects.

Each look opens an accessible native dialog with a larger image, material language, and source link. “Discuss this look” selects the styling service and carries the chosen direction into the contact brief, preserving existing text and replacing only a previous automatically added direction. The full portfolio and corresponding Studio+ playground remain linked. Styling also appears in navigation and Capabilities.

Capabilities keeps the featured-player and five-card layout, with text-only service trailers in a WhatsApp-inspired chat style. Five original 20-second films use lowercase deadpan exchanges, letter-by-letter typing, animated dots, settling bubbles and read receipts. Each finishes with concrete service value. The fictional conversations do not imply real client messages. The chats remain text-only; the final reveal uses existing portfolio footage and imagery, with Studio+ interiors labelled as concepts.

The service title stays prominent throughout every film, with a persistent deliverables strip (for example “web design / development / interactions”). The chat explains the work in first person, with dry asides and specific outputs.

The soundtrack now uses a real physical computer-keyboard recording by russiandoll, released into the public domain via PDSounds and hosted by Wikimedia Commons. Natural typing excerpts follow the chat bursts, with short fades and level adjustment; synthesized key clicks and message pops are removed. Original recording and provenance are in `assets/services/audio/`.

At 12–14 seconds, every trailer shows a two-second black movie-style title card: “JOPELO STUDIO” / “PRESENTS”, followed by the service name. The full 20-second MP4 is 1280 × 720, 24 fps, H.264 with AAC stereo sound. The chat retains its full 12 seconds, followed by the studio card and a six-second work reveal. Strategy shows SECHA’s live product story; Web shows Fjäll and SECHA; Brand shows JOPELO’s actual identity/site; Styling shows two Studio+ interior concepts; Ventures shows the Garuda Spark project reference from Fjäll’s portfolio. Project names and classifications are burned into the footage. Each selection also exposes a “View the work” source link and accessible reveal description. No new client results or project-ownership claims are added.

Visible previews play muted, respect motion preferences, and preserve a manual pause. “Play the chat” opens the full trailer with sound and native controls; Close, Escape, backdrop dismissal and enquiries immediately stop playback. Keyboard arrows, Home and End select cards. Each enquiry selects its matching contact option. “Read the chat” exposes the entire selected conversation as accessible HTML in both the service panel and full player.

Copy is shared between accessible transcripts and the renderer in `service-chat-content.js`. `tools/render-service-trailers.py` reproduces all five films with Python, Pillow, NumPy and FFmpeg, without network access; temporary renders and original WAVs go in ignored `.cache/service-chats/`. Source records and the play-icon license are in `assets/services/`.

Includes responsive navigation, section links, original external project links, service selection, and a contact form that prepares an introduction for copying to LinkedIn. The form does not send messages or store submissions.

## Browser verification

Playwright and Chromium are configured for desktop (1440 × 1000) and mobile (390 × 844) verification.

```sh
npm ci
npx playwright install chromium
npm test
```

The test runner starts the Vite server automatically, or reuses an existing development server on port 4173. To inspect the latest HTML report, run `npx playwright show-report`. Screenshots are saved in `artifacts/`, test reports and failure traces are ignored by Git.

All 30 Chromium tests passed: responsive layout without horizontal overflow, asset loading, 12-second hero preview dimensions and actual playback, award details/source link, all four venture logos, independent vertical-only letter motion, staggered timing, section/navigation ordering, pause/resume, awards, navigation, mobile menu/Escape, all five services, form validation, introduction generation, clipboard, intro on repeated refreshes (including previously seen sessions), replay/skip/focus, all four styling previews and dialog focus/close behavior, selected-style enquiries that preserve existing brief text, and reduced motion. No console or JavaScript runtime errors were detected. Production build and JavaScript syntax checks pass.

The original Renando reference guided the section sequence. The added styling service sits after Work: Work → Styling your space → Recognition → Principal → Capabilities → Experience → Contact. JOPELO’s original hero layout, assets, typography, and palette are preserved. Reference and implementation screenshots were compared at desktop and mobile sizes; see `design-qa.md`. Mobile service jumps use immediate scrolling to avoid a Chromium crash encountered with repeated smooth-scroll navigation. Desktop service navigation remains smooth. A local barcode SVG supplies the favicon.

Verification covers desktop Chromium and Chromium mobile emulation; real-device Safari and Firefox have not been tested. External project/LinkedIn destinations were preserved, but messages were not sent and external sites were not audited.

## Deployment

GitHub Pages deploys automatically when changes are pushed to `main`, using `.github/workflows/deploy-pages.yml`. The workflow installs from the lockfile, builds with the `/jopelo.studio/` base path, and publishes only `dist/` through GitHub's Pages artifact deployment.

Site: https://jplovensa.github.io/jopelo.studio/

For a local production-path check:

```sh
npm run build -- --base=/jopelo.studio/
npm run preview -- --host 0.0.0.0 --port 4174 --base=/jopelo.studio/
```
