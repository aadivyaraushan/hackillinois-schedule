# HackIllinois ocean schedule

A React schedule with a hand-drawn paper chart, independently animated ocean waves, and live HackIllinois events. The topbar follows the 2021 website: Home, Mentors, Prizes, Schedule.

## Run locally

Requires Node 22.12+ (tested with Node 22.23.1).

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. The original standalone design remains in `planning/ocean-schedule-plan.html`; it is a prototype, not the live app.

## Checks

```sh
npm test
npm run test:ui
npm run build
npm run preview
```

Data tests cover validation, sorting, Chicago timezone boundaries, public-event filtering and failed API responses. UI tests cover filters, saved selections, retry, empty results, failed refresh, storage failures and safe event descriptions. The API is mocked in automated tests; the live endpoint was also checked in a local browser.

## API and deployment

The browser requests `/api/events`. Vite forwards this to `https://adonix.hackillinois.org/event/` during development and preview. `vercel.json` provides the same route on Vercel. This is necessary because the upstream API does not send cross-origin access headers. No credentials or API keys are needed.

To deploy on Vercel, import this repository/branch as a Vite project with `npm run build` and output directory `dist`. No deployment has been created by this task. For another host, configure an equivalent same-origin route; uploading `dist` alone to a static host will not supply the API route.

Source: https://adonix.hackillinois.org/docs/ (GET /event/). Timestamps are Unix seconds; all event times and day grouping use America/Chicago. Dates and categories come from the returned data. As checked September 7, 2026, the API returns 41 events for February 27–March 1, 2026. The page displays that date range rather than pretending these are upcoming events.

## Features

- Day navigation, event-type filters and search across names, descriptions and locations.
- Saved events kept in local browser storage, without an account.
- Expandable descriptions, safe external links, venue maps and calendar downloads.
- Loading, timeout/retry, empty-data and no-match states; last-check time and manual refresh.
- Mobile navigation, keyboard focus outlines, skip link, reduced-motion support and an ocean pause control.

## Project layout

- `src/App.jsx`: schedule state and page composition.
- `src/schedule/data/`: documented API boundary, normalization, logging and data tests.
- `src/schedule/state/`: loading and saved-event state.
- `src/schedule/view/`: event display and paper styling.
- `src/schedule/testing/`: app-flow tests.
- `src/ocean/`: independent wave layers and artwork.
- `src/navigation/`: 2021 navigation and official logo.

Root build files and `src` follow the standard Vite layout. The approved prototype and its source artwork are kept for design history.

## Artwork and known limits

Official logo: https://2021.hackillinois.org/static/media/logo.fff5a98b.svg. Painted ocean artwork was generated for this project. Caveat Variable is bundled locally through @fontsource-variable/caveat (SIL Open Font License). It is used throughout the page and does not request fonts from Google at runtime. This is a student challenge project, not the official HackIllinois website. Home, Mentors and Prizes deliberately link to the 2021 archive.

Saved events are local to this browser, not synced. There is no offline event cache. Native dropdown menus follow the operating system. The live API and linked archive may change independently. No authentication is implemented.
