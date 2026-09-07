import { logger } from "../data/diagnostics/logger.js";
export const GOOGLE_SCOPE = "https://www.googleapis.com/auth/calendar.events";
export async function exportToGoogle(events, token) {
  const result = { added: 0, existing: 0, failed: [], authExpired: false };
  logger.info("Google export started", `count=${events.length}`);
  for (const event of events) {
    if (result.authExpired) {
      result.failed.push(event.name);
      continue;
    }
    try {
      const hash = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(`hackillinois-schedule:${event.eventId}`),
      );
      const id = [...new Uint8Array(hash)]
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
      const response = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events",
        {
          method: "POST",
          signal: AbortSignal.timeout(15000),
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id,
            summary: event.name,
            description: event.description,
            location: event.locations
              .map((item) => item.description)
              .join(", "),
            start: { dateTime: new Date(event.startTime * 1000).toISOString() },
            end: { dateTime: new Date(event.endTime * 1000).toISOString() },
          }),
        },
      );
      if (response.ok) result.added++;
      else if (response.status === 409) result.existing++;
      else {
        result.failed.push(event.name);
        result.authExpired = response.status === 401;
        logger.warn(
          "Google event export failed",
          `event=${event.eventId}; status=${response.status}`,
        );
      }
    } catch (error) {
      result.failed.push(event.name);
      logger.warn(
        "Google event export failed",
        `event=${event.eventId}; message=${error.message}`,
      );
    }
  }
  logger.info(
    "Google export finished",
    `added=${result.added}; existing=${result.existing}; failed=${result.failed.length}`,
  );
  return result;
}
