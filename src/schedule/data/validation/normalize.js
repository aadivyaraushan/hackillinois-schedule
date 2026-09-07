import { logger } from "../diagnostics/logger.js";
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
