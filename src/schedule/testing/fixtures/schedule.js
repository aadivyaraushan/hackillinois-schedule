import { beforeEach, afterEach, vi } from "vitest";
export const events = [
  {
    eventId: "meal",
    name: "Dinner",
    description: "Fresh food",
    startTime: 1772233200,
    endTime: 1772236800,
    eventType: "MEAL",
    locations: [{ description: "Dining room" }],
  },
  {
    eventId: "code",
    name: "Build a website",
    description: "Learn React",
    startTime: 1772236800,
    endTime: 1772240400,
    eventType: "WORKSHOP",
    locations: [{ description: "Siebel" }],
  },
];
beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, json: async () => ({ events }) }),
  );
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
