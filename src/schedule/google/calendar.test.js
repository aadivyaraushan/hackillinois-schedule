import { test } from "node:test";
import assert from "node:assert/strict";
import { exportToGoogle } from "./calendar.js";
const events = [
  {
    eventId: "one",
    name: "Workshop",
    description: "Details",
    startTime: 1772233200,
    endTime: 1772236800,
    locations: [{ description: "Siebel" }],
  },
];
test("Google export uses stable IDs, exact UTC times and reports existing events", async () => {
  const requests = [];
  const old = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    requests.push({ url, options });
    return {
      ok: requests.length === 1,
      status: requests.length === 1 ? 200 : 409,
    };
  };
  try {
    assert.deepEqual(await exportToGoogle(events, "test-token"), {
      added: 1,
      existing: 0,
      failed: [],
      authExpired: false,
    });
    assert.equal((await exportToGoogle(events, "test-token")).existing, 1);
    const first = JSON.parse(requests[0].options.body),
      second = JSON.parse(requests[1].options.body);
    assert.equal(first.id, second.id);
    assert.match(first.id, /^[a-f0-9]{64}$/);
    assert.equal(first.start.dateTime, "2026-02-27T23:00:00.000Z");
    assert.equal(first.location, "Siebel");
    assert.equal(first.attendees, undefined);
    assert.equal(
      requests[0].options.headers.Authorization,
      "Bearer test-token",
    );
  } finally {
    globalThis.fetch = old;
  }
});
test("Google export reports partial failure and safely stops after expired authorization", async () => {
  const old = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => ({
    ok: ++calls === 1,
    status: calls === 1 ? 200 : 401,
  });
  try {
    const result = await exportToGoogle(
      [
        ...events,
        { ...events[0], eventId: "two" },
        { ...events[0], eventId: "three" },
      ],
      "test-token",
    );
    assert.equal(result.added, 1);
    assert.equal(result.failed.length, 2);
    assert.equal(result.authExpired, true);
    assert.equal(calls, 2);
  } finally {
    globalThis.fetch = old;
  }
});
