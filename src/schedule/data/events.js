import { logger } from "./diagnostics/logger.js";
import { normalizeEvents } from "./validation/normalize.js";
export { normalizeEvents } from "./validation/normalize.js";
export {
  TIME_ZONE,
  dayKey,
  getDays,
  formatDay,
  formatTime,
  typeLabel,
} from "./formatting/format.js";
// Same-site route avoids the upstream API’s missing cross-origin headers.
export const API_URL = "/api/events";

function responseDetails(payload) {
  if (!payload || typeof payload !== "object")
    return `payload=${typeof payload}`;
  if (!Array.isArray(payload.events)) return `events=${typeof payload.events}`;
  return `events=array,count=${payload.events.length}`;
}

function errorDetails(error, context) {
  const message = error instanceof Error ? error.message : String(error);
  return `${context}; message=${message}`;
}

export async function fetchEvents({ signal } = {}) {
  let response;
  try {
    response = await fetch(API_URL, { credentials: "omit", signal });
  } catch (error) {
    logger.error("Event request failed", errorDetails(error, `url=${API_URL}`));
    throw error;
  }

  if (!response.ok) {
    logger.error(
      "Event request returned an unsuccessful status",
      String(response.status),
    );
    throw new Error(`Event request failed with status ${response.status}`);
  }

  let payload;
  try {
    payload = await response.json();
  } catch (error) {
    logger.error(
      "Event response was not valid JSON",
      errorDetails(error, `url=${API_URL}`),
    );
    throw new TypeError("Event response was not valid JSON");
  }

  logger.debug("Received event response", responseDetails(payload));
  try {
    const events = normalizeEvents(payload);
    logger.debug("Normalized public events", `count=${events.length}`);
    return events;
  } catch (error) {
    logger.error(
      "Event response normalization failed",
      errorDetails(error, responseDetails(payload)),
    );
    throw error;
  }
}
