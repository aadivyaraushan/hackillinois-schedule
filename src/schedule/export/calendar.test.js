import { test } from "node:test";
import assert from "node:assert/strict";
import { eventCalendar } from "./calendar.js";
test("exports UTC dates and escapes event text instead of creating extra calendar fields", () => {
  const result = eventCalendar(
    {
      eventId: "test",
      name: "Dinner, friends; welcome",
      description: "First line\nSecond line",
      startTime: 1772233200,
      endTime: 1772236800,
      locations: [{ description: "Siebel" }],
    },
    0,
  );
  assert.ok(result.includes("DTSTART:20260227T230000Z\r\n"));
  assert.ok(result.includes("SUMMARY:Dinner\\, friends\\; welcome\r\n"));
  assert.ok(result.includes("DESCRIPTION:First line\\nSecond line\r\n"));
  assert.ok(result.endsWith("END:VCALENDAR\r\n"));
});
test("folds long UTF-8 text without losing its content", () => {
  const name = "Ocean 🌊 ".repeat(30);
  const result = eventCalendar(
    {
      eventId: "test",
      name,
      description: "",
      startTime: 0,
      endTime: 1,
      locations: [],
    },
    0,
  );
  assert.ok(
    result.split("\r\n").every((line) => Buffer.byteLength(line) <= 75),
  );
  assert.ok(result.replace(/\r\n /g, "").includes(`SUMMARY:${name}`));
});
