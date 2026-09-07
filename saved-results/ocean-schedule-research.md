# Ocean schedule: initial direction and API notes

Date: September 7, 2026

## Purpose and result

Prepare a rough navigation sketch before implementing the HackIllinois systems challenge in React. Current direction after correction: schedule-first, deep blue, official HackIllinois logo, no introductory section or promotional copy. Keep day/search/saved controls. Use layered scalloped waves and heavily textured blue inspired by the user-supplied Flapjack image. The earlier opening and jump link were explicitly rejected and removed.

The visual sketch and living plan are in `planning/ocean-schedule-plan.html`. It contains clearly labeled sample events and does not fetch live events. More detailed features in that file are proposals, not additional confirmed user preferences.

## Verified references

- https://2025.hackillinois.org/schedule — search results exposed day selection, event types, times, locations, descriptions, and points. A subsequent page text read exposed only navigation. Full visual and interactive behavior has not been checked.
- https://2024.hackillinois.org/ — event introduction, FAQs, and sponsors. These are outside the chosen schedule scope.
- https://hackillinoisschedule.vercel.app/ — readable page references Atlantis background, sunrays, submarine, treasure chest, and fish images. Animations and interactive controls are not verified.
- https://2021.hackillinois.org/schedule — subsequently checked in the browser: official logo, date selection, category guide, and event list appear without promotional introduction. The logo SVG was retrieved unchanged from https://2021.hackillinois.org/static/media/logo.fff5a98b.svg and embedded into the standalone sketch.

## API documentation

Fetched https://adonix.hackillinois.org/docs/ and its referenced `swagger-ui-init.js`, which identifies https://adonix.hackillinois.org/docs/json as the specification. Read that JSON and inspected the event GET route and Event/Events schemas.

- `GET /event/`: "Required role: null"; the server filters based on access.
- Response: `{ events: Event[] }`.
- Event fields include eventId, name, description, startTime, endTime, locations, eventType, points, isAsync, and access flags.
- Optional details include sponsor, mapImageUrl, and menu.
- Event types: MEAL, SPEAKER, WORKSHOP, MINIEVENT, SIDEQUEST, QNA, MEETING, STAFFSHIFT, OTHER.
- `GET /event/{id}/` also documents required role null.
- Do not use attendance or server-side following for local favorites.

Still unverified: live event contents, timestamp semantics beyond numeric examples, browser cross-origin access, event-year coverage, and production availability. A request temporarily failed DNS resolution and succeeded on retry. Treat API errors as a real UI state.

To reproduce: download the official JSON and inspect `paths['/event/'].get`, `components.schemas.Event`, and `components.schemas.Events`. Then independently check the live public route and browser behavior during implementation.

## Workspace and next step

`ls -la` initially showed an empty project folder. `git rev-parse --show-toplevel` exited 128 with "not a git repository". Git has not been initialized. Project instructions require asking the user before initialization. No application code or dependencies have been created.

The design artifact uses inline CSS, SVG, native anchor links, and native details elements. Automated application tests are not applicable at this design-only stage. React implementation will follow the required failing-test, implementation, passing-test sequence for meaningful behavior.

## Revised sketch checks

- Inspected the desktop page with Computer Use: logo and schedule render, with no introductory scene.
- Official logo reports natural width 149 in the browser.
- Opened the first Details disclosure; its paragraph appeared.
- Pause control changed the wave animation state to paused. Its transform stayed exactly `matrix(1, 0, 0, 1, -18.9237, -2.94244)` across two separate observations. Unpausing restored running and a different transform.
- Requested a 390 by 844 viewport; the browser actually reported 487 CSS pixels wide. Page scroll width also measured 487, so no horizontal overflow at that observed width. Exact 390-pixel behavior is not verified. Temporary viewport override reset.
- Reduced-motion CSS is present; a simulated reduced-motion browser run was not performed.
- Day/search/category/save remain placement-only sketch elements, labeled as such. No live API integration claimed.
- Local file reload was blocked by the browser tool policy. Served this project on loopback for checking; HTTP readiness returned 200.
- SVG wave texture is an approximation, not final painted artwork. No image generation or paid calls used.

## Quieter ocean revision

The user found the repeated bright blue distracting and asked for more natural integration. Replaced the full-screen blue field with muted ink and slate surfaces, reduced ten wave layers to four, placed waves only along the lower edge, faded them upward, and reduced saturation and opacity. Event cards now have opaque backgrounds. The official logo, direct schedule layout, and motion pause remain. This supersedes the full-height wave treatment.

Verified revised desktop appearance with Computer Use: main schedule has a quiet slate background; waves appear only near the bottom, and card backgrounds conceal the moving artwork. Preview returned HTTP 200. No new application tests were applicable to this design-only styling revision. Phone appearance was not rechecked in this revision.

## Painted-ocean remake

September 7, 2026. User requested a new schedule sketch because previous examples and wave treatments were too subtle. Remade the existing HTML sketch as a bold cream timetable beside a prominent, originally generated crayon/gouache ocean. Retained the official logo unchanged. This supersedes the muted-slate/four-wave version.

Artwork: planning/artwork/ocean-crayon.png. Generated through the built-in image tool, no API credential or paid external API call used. Embedded twice in the standalone HTML for two moving layers. File is roughly 10 MB, appropriate only as a self-contained design preview; optimize asset loading in the React build.

Browser evidence: Friday initially exposes six sample rows. Selecting Saturday and Workshops exposes Designing Your First Prototype alone. Saving it, choosing All event types, then enabling Saved events leaves that single row. Opening its details exposes the sample description. Pause checkbox toggles. Desktop screenshot confirms the painted ocean renders beside the cream schedule. Narrow-screen screenshot confirms a paper sheet surrounded by ocean edges; exact viewport geometry evaluation timed out, so no precise pixel-width assertion is made. Viewport override reset.

Limitations: live API and React implementation are still pending; sample schedule content is illustrative; saved state does not persist; reduced-motion behavior was not simulated; native filtering has only a generic saved-view message rather than a complete empty-results state; search is pending. Computed-style checks timed out with the large standalone image document, so pause animation state was not independently measured in this revision.

PASS: unique IDs; 13 sample events; labeled native controls; reduced-motion CSS; both embedded images exactly match the saved artwork.

## Fresh field-chart prototype

The user chose a freshly pencil-drawn field chart, allowing handwritten typography. Updated the existing sketch: centered paper sheet surrounded by the ocean, fibrous texture, subtle grid and fold shading, rough outer edges, Bradley Hand headings with fallbacks, monospace times, and a small drawn boat on a dashed route connecting native day radio controls. Removed the separate ocean column and day stamp. Existing original artwork and official logo reused unchanged.

Verified in this session: Sunday selection shows three Sunday events; screenshot after the transition shows the boat at the Sunday marker. Food filter plus saved Breakfast plus Saved events shows one Breakfast event. Desktop and narrow-screen screenshots show the paper chart and event rows. Requested narrow viewport 390 x 844; exact runtime dimensions not measured because evaluation had timed out on this embedded-image document in prior checks. Viewport restored. Structural check passes unique IDs, 13 sample events, one route boat, reduced-motion style, removal of old day stamp. Preview server HTTP 200.

No application tests or build: disposable HTML/CSS prototype only. No new artwork generated, app dependency changes, API calls, or Git initialization. Font verified locally at /System/Library/Fonts/Supplemental/Bradley Hand Bold.ttf; different systems may use fallback fonts. Existing live API, persistent favorites, search, and detailed empty-state limitations remain.

## Stronger day-to-day travel and star removal

The user requested more noticeable movement between days, then asked to remove the meaningless top-right decorative star. Removed that SVG and all its styles. Replaced day-specific object-position crops with two larger travel layers: Friday +12vw, Saturday 0, Sunday -12vw; foreground uses +15vw/0/-15vw. Transition is 1.8 seconds; on narrow screens offsets are 20vw and 24vw. Pause ocean and reduced-motion rules disable travel transitions. The paper is outside these moving layers.

Browser screenshots before and after selecting Sunday confirm visibly different ocean positions, Sunday content, and removal of the decorative star. Returning to Friday updates the selected day. HTTP readiness 200. Structural assertions confirmed no drawn-star remains and two travel layers are present. Mobile movement and simulated reduced-motion behavior were not rechecked for this change. No new images or application code were added.


## September 7, 2026 — Individual waves and readable times
Replaced whole-image travel with eight independently bobbing SVG rows sharing a new transparent three-band painted wave asset. Day selection changes row travel distance and starts staggered swells. Changed times to Arial/Helvetica sans-serif, weight 600, with darker end labels. Browser verified Sunday events, eight distinct wave transforms and positions (−80 to −248 pixels), all eight paused states, and time font weight 600. Narrow screenshot inspected; exact device sizing and reduced-motion emulation not verified. HTML structural assertions passed. No live API or React changes. Full evidence and manual steps: ocean-schedule-review.html.

### Wave proportions follow-up
Removed fixed-height wave sizing and vertical animation scaling. SVG crop ratios now determine row heights; trimmed transparent space from displayed crops and placed first row at 24px over #071725 sky. Desktop computed sizes match artwork ratios; desktop/narrow screenshots and Sunday selection checked. Original artwork unchanged. Structural assertions passed; no application test suite added for this visual adjustment.

### Higher waves and handwritten times
Raised all waves 36px. Changed start/end times and AM/PM to Bradley Hand with handwriting fallbacks, weight 600. Desktop/narrow screenshots checked; Saturday selection works. Computed mobile time 18px, first-row top −12px verified. Focused CSS assertions passed. Other metadata unchanged.

### Handwritten toolbar filters
Restyled event type and Saved events with handwriting, sketched CSS arrow/checkbox and focus outlines. Native controls retained. Browser verified Food + saved Dinner + Saved events yields one row; resetting restores events. Desktop/narrow screenshots checked. Expanded dropdown menu remains OS controlled.

## September 7, 2026 — Working React schedule
Implemented in .worktrees/schedule-app on branch schedule-app. Copied 2021 topbar labels/order/destinations from the live archive. Public API returned 41 events for Feb 27–Mar 1, 2026; browser confirmed Friday 19 events and Saturday 3 workshops. Direct cross-origin fetch failed: HTTP 200 lacked Access-Control-Allow-Origin. Added Vite /api/events forwarding and matching Vercel rewrite. No deployment performed. Caveat requested by user, bundled with Fontsource and verified across page via computed styles. Persistent saves, search, filters, safe details, calendar export, retry/empty/stale refresh messages added. Tests: 12 data/calendar and 7 integrated UI passed; production build, formatting and diff checks passed. Browser mobile menu/save/reload/pause checks passed. See HTML review for all files, excerpts and limits.

## Requested comparison with official schedules
September 7, 2026: inspected local app, 2021 and 2026 schedules in browser. hackillinois.org points to 2027 hype, so 2026 used for latest schedule. 2026 initially showed empty state, then loaded real events; verified tag/time-range filters and building direction links. Qualitative judgment: our design is distinctive but not 10x better. Main limits: tall pre-event control stack, ocean remains peripheral scenery, insufficient type hierarchy with Caveat everywhere, ambiguous expansion arrows, hidden check-in instructions, and missing practical tools such as time-range filtering/direct directions/conflict-aware saved plans. Recommended prioritizing density and attendee tasks before more decorative motion. Full assessment in existing HTML review. No app code changed.

## Event interaction refinements
September 7, 2026: downward hand-drawn SVG disclosures reverse when expanded; stronger green hover/focus highlight; per-venue Google Maps links prefer coordinates with name fallback; Caveat names/start times bold and secondary hierarchy lighter. Tests 9 UI + 12 data/calendar pass; build/format/diff pass. Browser validates coordinates, expanded arrow transform, highlight and bold weights. Pointer hover helper unsupported; shared focus rule checked. Separate planning/implementation/planning-ideas.html proposes saved-route navigation, overlap forks, boat time navigation and free-time filtering without implementing them.


## September 7, 2026 — schedule comparison refresh
Fresh Computer Use checks of 2021.hackillinois.org/schedule and 2026.hackillinois.org/schedule: 2026 includes maps, tag/points filters and time-range controls; 2021 uses conventional typography and expanded descriptions. Main hackillinois.org now redirects to the upcoming-edition teaser. Judgment: our ocean design is distinctive, but a 10x usability claim is unsupported without attendee task tests. Main remaining opportunities are scanning clarity and a complete saved itinerary. Full evidence and caveats are in ocean-schedule-review.html.
