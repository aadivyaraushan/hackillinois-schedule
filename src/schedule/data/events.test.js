import assert from "node:assert/strict";
import test from "node:test";

import { API_URL, TIME_ZONE, normalizeEvents } from "./events.js";

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
