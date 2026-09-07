# Google Calendar setup

September 7, 2026. For the HackIllinois schedule app in `.worktrees/schedule-app`.

The dedicated web client is created and connected to the local preview. Mocked consent/export tests pass. The real calendar write check is awaiting authorization; no real calendar events have been created by this task yet.

## Current local configuration

- Existing project: Operator (`operator-504223`), explicitly selected by the user.
- New client: HackIllinois Schedule, Web application.
- Authorized JavaScript origins: `http://127.0.0.1:5173` and `http://localhost:5173`.
- Client ID configured in ignored `.env.local`; no client secret copied or saved.
- Google Calendar API was already enabled.
- Audience remains External / Testing. The signed-in user's account is already a test user. Existing test users and other app clients were preserved.
- Shared consent branding remains Operator. Google displayed an incomplete-configuration warning, although required name/support/developer-contact fields were present; real consent behavior still needs checking.
- Browser loaded the configured Google library and the export button is enabled.
- All events exports all 41 currently published events, not just the selected day; My schedule exports favorites. File-download export was removed at the user's request.

## Before making this public

Add the exact deployed HTTPS origin to the OAuth client. Set the same public client ID in the deployment environment and rebuild. Configure Google's required app branding, privacy information and publishing/verification requirements before expecting arbitrary attendees to authorize it. A testing-mode app only works for configured test users. This project has not been publicly deployed.

## Behavior and limitations

- Google permission is requested only when the attendee presses Export. Tokens stay in memory for that export, not in browser storage or repo files.
- Export is a snapshot: All events sends the whole published weekend; My schedule sends favorites.
- Repeated Google exports use stable event IDs and skip existing entries. This is **not ongoing sync**: later time/title edits do not update existing entries; unstarring does not delete them. Entries previously deleted in Google may retain reserved IDs and require manual re-adding.
- Partial failures list events that were not added. Retrying skips existing entries. Expired permission asks for sign-in again.
- Conflicts compare every saved event, regardless of the current day/search/type filter. They indicate overlapping published time windows, not travel time or required attendance duration. Export includes overlaps; it does not choose events for the attendee.
- No file-download buttons remain.

## Official references checked

- [Google token flow](https://developers.google.com/identity/oauth2/web/guides/use-token-model)
- [Get a web client ID](https://developers.google.com/identity/oauth2/web/guides/get-google-api-clientid)
- [Insert calendar events](https://developers.google.com/workspace/calendar/api/v3/reference/events/insert)
- [Import a calendar file](https://support.google.com/calendar/answer/37118)

## Live check — September 7, 2026
Chrome export of 10 saved events completed with “0 added; 10 already in Google Calendar.” Real duplicate detection verified. This check did not observe a fresh insertion. The in-app browser permission popup was unavailable earlier; Chrome completed the flow.

## Vercel origin — September 7, 2026
Production: https://hackillinois-schedule-five.vercel.app/
Added https://hackillinois-schedule-five.vercel.app to the existing HackIllinois Schedule web client authorized JavaScript origins; reopened settings and verified it persisted. Local origins retained. Public client ID configured as VITE_GOOGLE_CLIENT_ID in Vercel production. No client secret used. Google notes 5 minutes to a few hours propagation; hosted calendar write not yet tested.
