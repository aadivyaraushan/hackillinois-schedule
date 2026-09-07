import assert from "node:assert/strict";
import test from "node:test";

import {
  API_URL,
  TIME_ZONE,
  dayKey,
  fetchEvents,
  formatDay,
  formatTime,
  getDays,
  normalizeEvents,
  typeLabel,
} from "./events.js";

const publicEvent = (overrides = {}) => ({
  eventId: "event-a",
  name: "Welcome",
  description: "Say hello",
  startTime: 1772222400,
  endTime: 1772226000,
  eventType: "WORKSHOP",
  locations: [{ description: "Siebel", latitude: 40.1, longitude: -88.2 }],
  sponsor: "HackIllinois",
  points: 10,
  isAsync: false,
  menu: ["Pizza"],
  mapImageUrl: "https://example.test/map.png",
  ...overrides,
});

test("exports the same-site API endpoint and Chicago timezone", () => {
  assert.equal(API_URL, "/api/events");
  assert.equal(TIME_ZONE, "America/Chicago");
});

test("normalizes public events, sorts them, and omits non-public fields", () => {
  const events = normalizeEvents({
    events: [
      publicEvent({
        eventId: "later",
        startTime: 200,
        endTime: 300,
        isStaff: false,
        isPrivate: false,
      }),
      publicEvent({
        eventId: "first",
        startTime: 100,
        endTime: 200,
        isStaff: false,
        isPrivate: false,
        internalNotes: "nope",
      }),
    ],
  });

  assert.deepEqual(
    events.map((event) => event.eventId),
    ["first", "later"],
  );
  assert.deepEqual(Object.keys(events[0]).sort(), [
    "description",
    "endTime",
    "eventId",
    "eventType",
    "isAsync",
    "locations",
    "mapImageUrl",
    "menu",
    "name",
    "points",
    "sponsor",
    "startTime",
  ]);
  assert.equal(events[0].isStaff, undefined);
  assert.equal(events[0].isPrivate, undefined);
  assert.equal(events[0].internalNotes, undefined);
});

test("filters staff and private events, drops invalid critical rows, and deduplicates ids", () => {
  const events = normalizeEvents({
    events: [
      publicEvent({ eventId: "keep" }),
      publicEvent({ eventId: "keep", name: "Duplicate" }),
      publicEvent({ eventId: "staff", isStaff: true }),
      publicEvent({ eventId: "private", isPrivate: true }),
      publicEvent({ eventId: "", name: "Missing id" }),
      publicEvent({ eventId: "bad-times", startTime: "noon" }),
      publicEvent({ eventId: "negative-time", startTime: -1 }),
      publicEvent({ eventId: "huge-time", startTime: 9e15, endTime: 9e15 }),
    ],
  });

  assert.equal(events.length, 1);
  assert.equal(events[0].eventId, "keep");
});

test("keeps a description-only location when map coordinates are unavailable", () => {
  const [event] = normalizeEvents({
    events: [
      publicEvent({ locations: [{ description: "Online on Discord" }] }),
    ],
  });

  assert.deepEqual(event.locations, [{ description: "Online on Discord" }]);
});

test("rejects malformed top-level payloads and public input with no valid rows", () => {
  assert.throws(() => normalizeEvents(null), /events array/);
  assert.throws(() => normalizeEvents({ events: {} }), /events array/);
  assert.throws(
    () => normalizeEvents({ events: [publicEvent({ eventId: "" })] }),
    /no valid public events/,
  );
});

test("allows an empty response", () => {
  assert.deepEqual(normalizeEvents({ events: [] }), []);
});

test("uses Chicago calendar days around midnight and formats dates and times", () => {
  assert.equal(dayKey(1772323200), "2026-02-28");
  assert.deepEqual(
    getDays([{ startTime: 1772341200 }, { startTime: 1772344800 }]),
    ["2026-02-28", "2026-03-01"],
  );
  assert.equal(
    formatDay("2026-02-28", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }),
    "Sat, Feb 28",
  );
  assert.equal(formatTime(1772344800), "12:00 AM");
});

test("gives known event types friendly labels and safely humanizes unknown types", () => {
  assert.equal(typeLabel("MINIEVENT"), "Mini Event");
  assert.equal(typeLabel("WORKSHOP"), "Workshop");
  assert.equal(typeLabel("SIDEQUEST"), "Side Quest");
  assert.equal(typeLabel("QNA"), "Q&A");
  assert.equal(typeLabel("MEETING"), "Meeting");
  assert.equal(typeLabel("STAFFSHIFT"), "Staff Shift");
  assert.equal(typeLabel("COMMUNITY_BUILD"), "Community Build");
  assert.equal(typeLabel("MYSTERY_MODE"), "Mystery Mode");
  assert.equal(typeLabel(), "Event");
});

test("fetchEvents rejects unsuccessful responses and malformed successful payloads", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => ({ ok: false, status: 503 });
    await assert.rejects(fetchEvents(), /503/);

    globalThis.fetch = async () => ({
      ok: true,
      json: async () => ({ events: null }),
    });
    await assert.rejects(fetchEvents(), /events array/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("fetchEvents requests the public endpoint without credentials and normalizes its response", async () => {
  let request;
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url, options) => {
      request = { url, options };
      return { ok: true, json: async () => ({ events: [publicEvent()] }) };
    };
    const events = await fetchEvents();

    assert.equal(request.url, API_URL);
    assert.equal(request.options.credentials, "omit");
    assert.equal(events[0].eventId, "event-a");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
