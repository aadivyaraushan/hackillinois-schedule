import assert from "node:assert/strict";
import test from "node:test";

import {
  API_URL,
  dayKey,
  fetchEvents,
  formatDay,
  formatTime,
  getDays,
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
