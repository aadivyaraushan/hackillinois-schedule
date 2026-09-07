import { logger } from "./logger.js";

// Same-site route avoids the upstream API’s missing cross-origin headers.
export const API_URL = "/api/events";
export const TIME_ZONE = "America/Chicago";

const DATE_PARTS = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const TYPE_LABELS = {
  CEREMONY: "Ceremony",
  MEAL: "Meal",
  MEETING: "Meeting",
  MINIEVENT: "Mini Event",
  OTHER: "Other",
  QNA: "Q&A",
  SIDEQUEST: "Side Quest",
  SOCIAL: "Social",
  SPEAKER: "Speaker Event",
  STAFFSHIFT: "Staff Shift",
  WORKSHOP: "Workshop",
};

const MAX_DATE_SECONDS = 8_640_000_000_000;

function nonEmptyString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function safeString(value) {
  return typeof value === "string" ? value : "";
}

function safeNumber(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

function isValidUnixSeconds(value) {
  return Number.isFinite(value) && value >= 0 && value <= MAX_DATE_SECONDS;
}

function normalizeLocations(locations) {
  if (!Array.isArray(locations)) return [];

  return locations.flatMap((location) => {
    if (!location || typeof location !== "object") return [];
    const description = safeString(location.description);
    const latitude = safeNumber(location.latitude, null);
    const longitude = safeNumber(location.longitude, null);
    if (!description) return [];
    if (latitude === null || longitude === null) return [{ description }];
    return [{ description, latitude, longitude }];
  });
}

function normalizeEvent(event) {
  if (!event || typeof event !== "object") return null;

  const eventId = nonEmptyString(event.eventId);
  const name = nonEmptyString(event.name);
  const startTime = safeNumber(event.startTime, null);
  const endTime = safeNumber(event.endTime, null);

  if (
    !eventId ||
    !name ||
    !isValidUnixSeconds(startTime) ||
    !isValidUnixSeconds(endTime) ||
    endTime < startTime
  ) {
    return null;
  }

  return {
    eventId,
    name,
    description: safeString(event.description),
    startTime,
    endTime,
    eventType: nonEmptyString(event.eventType) || "OTHER",
    locations: normalizeLocations(event.locations),
    sponsor: safeString(event.sponsor),
    points: safeNumber(event.points),
    isAsync: event.isAsync === true,
    menu: Array.isArray(event.menu)
      ? event.menu.filter((item) => typeof item === "string")
      : [],
    mapImageUrl: safeString(event.mapImageUrl),
  };
}

export function normalizeEvents(payload) {
  if (
    !payload ||
    typeof payload !== "object" ||
    !Array.isArray(payload.events)
  ) {
    throw new TypeError("Expected an event payload with an events array");
  }

  const eventIds = new Set();
  const normalized = [];
  let publicRows = 0;

  for (const event of payload.events) {
    if (event?.isStaff === true || event?.isPrivate === true) continue;
    publicRows += 1;

    const safeEvent = normalizeEvent(event);
    if (!safeEvent) {
      logger.warn("Skipped invalid public event");
      continue;
    }
    if (eventIds.has(safeEvent.eventId)) {
      logger.warn("Skipped duplicate public event", safeEvent.eventId);
      continue;
    }

    eventIds.add(safeEvent.eventId);
    normalized.push(safeEvent);
  }

  if (publicRows > 0 && normalized.length === 0) {
    throw new TypeError("Event payload contained no valid public events");
  }

  return normalized.sort(
    (first, second) =>
      first.startTime - second.startTime ||
      first.endTime - second.endTime ||
      first.eventId.localeCompare(second.eventId),
  );
}

export function dayKey(seconds) {
  const parts = Object.fromEntries(
    DATE_PARTS.formatToParts(new Date(seconds * 1000))
      .filter(({ type }) => type !== "literal")
      .map(({ type, value }) => [type, value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function getDays(events) {
  return [
    ...new Set(
      events
        .filter((event) => Number.isFinite(event?.startTime))
        .map((event) => dayKey(event.startTime)),
    ),
  ].sort();
}

export function formatDay(
  key,
  options = { weekday: "long", month: "long", day: "numeric" },
) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return "";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    ...options,
  }).format(new Date(`${key}T12:00:00.000Z`));
}

export function formatTime(seconds) {
  return TIME_FORMATTER.format(new Date(seconds * 1000));
}

export function typeLabel(type) {
  const normalized = nonEmptyString(type);
  if (!normalized) return "Event";
  if (TYPE_LABELS[normalized]) return TYPE_LABELS[normalized];
  return (
    normalized
      .toLowerCase()
      .split(/[_\s-]+/)
      .filter(Boolean)
      .map((word) => word[0].toUpperCase() + word.slice(1))
      .join(" ") || "Event"
  );
}

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
