import React from "react";
import { webcrypto } from "node:crypto";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, afterEach, vi, test, expect } from "vitest";
import App from "../../App.jsx";
const events = [
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
test("renders original navigation and filters live-shaped data; saved events survive remount", async () => {
  const user = userEvent.setup();
  const first = render(<App />);
  expect(
    await screen.findByRole("heading", { name: "Dinner" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Mentors" })).toHaveAttribute(
    "href",
    "https://2021.hackillinois.org/mentors",
  );
  await user.click(screen.getByRole("button", { name: "Save Dinner" }));
  await user.click(screen.getByRole("button", { name: "My schedule" }));
  expect(
    screen.queryByRole("heading", { name: "Build a website" }),
  ).not.toBeInTheDocument();
  first.unmount();
  render(<App />);
  expect(
    await screen.findByRole("button", { name: "Unsave Dinner" }),
  ).toBeInTheDocument();
  await user.selectOptions(
    screen.getByRole("combobox", { name: "Event type" }),
    "WORKSHOP",
  );
  expect(
    screen.getByRole("heading", { name: "Build a website" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("heading", { name: "Dinner" }),
  ).not.toBeInTheDocument();
  await user.type(
    screen.getByRole("searchbox", { name: "Search events" }),
    "no matches",
  );
  expect(screen.getByText("No events match your filters.")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Clear filters" }));
  expect(screen.getByRole("heading", { name: "Dinner" })).toBeInTheDocument();
});
test("reports a failed request and retries successfully", async () => {
  fetch.mockRejectedValueOnce(new Error("Network unavailable"));
  const user = userEvent.setup();
  render(<App />);
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Could not load the schedule",
  );
  await user.click(screen.getByRole("button", { name: "Try again" }));
  expect(
    await screen.findByRole("heading", { name: "Dinner" }),
  ).toBeInTheDocument();
});
test("empty API data shows an honest empty state", async () => {
  fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ events: [] }) });
  render(<App />);
  expect(
    await screen.findByText("No events have been published yet."),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("heading", { name: "Dinner" }),
  ).not.toBeInTheDocument();
});
test("malformed saved data does not prevent loading", async () => {
  localStorage.setItem("hackillinois:saved-events", "not json");
  render(<App />);
  expect(
    await screen.findByRole("heading", { name: "Dinner" }),
  ).toBeInTheDocument();
});
test("a failed refresh keeps previously loaded events visible", async () => {
  const user = userEvent.setup();
  render(<App />);
  await screen.findByRole("heading", { name: "Dinner" });
  fetch.mockRejectedValueOnce(new Error("Offline"));
  await user.click(
    screen.getByRole("button", { name: "Refresh", exact: true }),
  );
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Previously loaded events",
  );
  expect(screen.getByRole("heading", { name: "Dinner" })).toBeInTheDocument();
});
test("storage failure keeps the save action usable and explains its limit", async () => {
  const user = userEvent.setup();
  render(<App />);
  await screen.findByRole("heading", { name: "Dinner" });
  const blocked = vi
    .spyOn(Storage.prototype, "setItem")
    .mockImplementation(() => {
      throw new Error("Storage unavailable");
    });
  await user.click(screen.getByRole("button", { name: "Save Dinner" }));
  expect(
    screen.getByRole("button", { name: "Unsave Dinner" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent(
    "could not save your selections",
  );
  blocked.mockRestore();
});
test("event details render API text without interpreting HTML", async () => {
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      events: [
        {
          ...events[0],
          description: "<script>bad()</script> https://example.com/info",
          mapImageUrl: "javascript:bad()",
        },
      ],
    }),
  });
  const user = userEvent.setup();
  render(<App />);
  await user.click(await screen.findByRole("heading", { name: "Dinner" }));
  expect(screen.getByText(/<script>bad\(\)<\/script>/)).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "https://example.com/info" }),
  ).toHaveAttribute("href", "https://example.com/info");
  expect(
    screen.queryByRole("link", { name: /View venue map/ }),
  ).not.toBeInTheDocument();
});

test("location actions use each venue's coordinates and stay outside the expandable details", async () => {
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      events: [
        {
          ...events[0],
          locations: [
            {
              description: "Siebel CS Lobby",
              latitude: 40.113812,
              longitude: -88.224937,
            },
            { description: "Second venue", latitude: 40.1, longitude: -88.3 },
          ],
        },
      ],
    }),
  });
  render(<App />);
  const first = await screen.findByRole("link", {
    name: "Open location: Siebel CS Lobby",
  });
  expect(new URL(first.href).searchParams.get("query")).toBe(
    "40.113812,-88.224937",
  );
  expect(new URL(first.href).searchParams.get("api")).toBe("1");
  expect(first.closest("details")).toBeNull();
  expect(first).toHaveAttribute("target", "_blank");
  const second = screen.getByRole("link", {
    name: "Open location: Second venue",
  });
  expect(new URL(second.href).searchParams.get("query")).toBe("40.1,-88.3");
});
test("location links fall back to a name search and missing locations do not get a fake link", async () => {
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      events: [events[0], { ...events[1], locations: [] }],
    }),
  });
  render(<App />);
  const link = await screen.findByRole("link", {
    name: "Open location: Dining room",
  });
  expect(new URL(link.href).searchParams.get("query")).toBe("Dining room");
  expect(screen.getAllByRole("link", { name: /Open location:/ })).toHaveLength(
    1,
  );
  expect(screen.getByText("Location to be announced")).toBeInTheDocument();
});

test("scroll moves the route boat and choosing a stop opens that event", async () => {
  const geometry = vi
    .spyOn(HTMLElement.prototype, "getBoundingClientRect")
    .mockReturnValue({ top: 500 });
  const user = userEvent.setup();
  render(<App />);
  await screen.findByRole("heading", { name: "Dinner" });
  const first = screen.getByRole("button", { name: "Go to Dinner" });
  const second = screen.getByRole("button", { name: "Go to Build a website" });
  expect(first).toHaveAttribute("aria-current", "step");
  expect(first.closest('section[aria-label="Schedule events"]')).not.toBeNull();
  expect(
    screen.queryByRole("button", { name: /Open route/ }),
  ).not.toBeInTheDocument();
  expect(screen.getAllByText("Dinner", { exact: true })).toHaveLength(1);
  geometry.mockRestore();
  const cards = document.querySelectorAll("article.event");
  vi.spyOn(cards[0], "getBoundingClientRect").mockReturnValue({ top: -300 });
  vi.spyOn(cards[1], "getBoundingClientRect").mockReturnValue({ top: 150 });
  fireEvent.scroll(window);
  await waitFor(() => expect(second).toHaveAttribute("aria-current", "step"));
  const scroll = vi.fn();
  cards[0].scrollIntoView = scroll;
  await user.click(first);
  expect(scroll).toHaveBeenCalled();
  expect(cards[0].querySelector("details")).toHaveAttribute("open");
  await user.type(screen.getByRole("searchbox"), "nothing matches");
  expect(
    screen.queryByRole("navigation", { name: "Event route" }),
  ).not.toBeInTheDocument();
});

test("saved overlaps are labeled and changing days replaces route stops", async () => {
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      events: [
        events[0],
        { ...events[1], startTime: events[0].startTime + 60 },
        {
          ...events[0],
          eventId: "next",
          name: "Next day meal",
          startTime: events[0].startTime + 86400,
          endTime: events[0].endTime + 86400,
        },
      ],
    }),
  });
  const user = userEvent.setup();
  render(<App />);
  await screen.findByRole("heading", { name: "Dinner" });
  await user.click(screen.getByRole("button", { name: "Save Dinner" }));
  await user.click(
    screen.getByRole("button", { name: "Save Build a website" }),
  );
  expect(screen.getAllByText("Overlaps a saved event")).toHaveLength(2);
  await user.click(screen.getByRole("radio", { name: /Saturday/ }));
  expect(
    screen.getByRole("button", { name: "Go to Next day meal" }),
  ).toHaveAttribute("aria-current", "step");
  expect(
    screen.queryByRole("button", { name: "Go to Dinner" }),
  ).not.toBeInTheDocument();
});

test("the final scroll pixels do not teleport the boat past the penultimate event", async () => {
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      events: [
        ...events,
        {
          ...events[1],
          eventId: "last",
          name: "Last event",
          startTime: events[1].startTime + 3600,
          endTime: events[1].endTime + 3600,
        },
      ],
    }),
  });
  render(<App />);
  await screen.findByRole("heading", { name: "Last event" });
  vi.stubGlobal("innerHeight", 600);
  vi.stubGlobal("scrollY", 797);
  const height = vi
    .spyOn(document.documentElement, "scrollHeight", "get")
    .mockReturnValue(1400);
  document.querySelectorAll("article.event").forEach((card, index) => {
    Object.defineProperty(card, "offsetTop", {
      configurable: true,
      value: index * 300,
    });
    vi.spyOn(card, "getBoundingClientRect").mockImplementation(() => ({
      top: 400 + index * 300 - window.scrollY,
    }));
  });
  fireEvent.scroll(window);
  const boat = document.querySelector(".sailing-boat");
  await waitFor(() => expect(parseFloat(boat.style.top)).toBeGreaterThan(300));
  const before = parseFloat(boat.style.top);
  vi.stubGlobal("scrollY", 798);
  fireEvent.scroll(window);
  await act(async () => {
    await new Promise((resolve) => requestAnimationFrame(resolve));
  });
  expect(Math.abs(parseFloat(boat.style.top) - before)).toBeLessThan(10);
  vi.stubGlobal("scrollY", 800);
  fireEvent.scroll(window);
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Go to Last event" }),
    ).toHaveAttribute("aria-current", "step"),
  );
  height.mockRestore();
});

test("My schedule shows all starred days and explains an empty plan", async () => {
  const tomorrow = {
    ...events[1],
    eventId: "tomorrow",
    name: "Tomorrow workshop",
    startTime: events[1].startTime + 86400,
    endTime: events[1].endTime + 86400,
  };
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ events: [...events, tomorrow] }),
  });
  const user = userEvent.setup();
  render(<App />);
  await screen.findByRole("heading", { name: "Dinner" });
  await user.click(screen.getByRole("button", { name: "My schedule" }));
  expect(
    screen.getByText("Star events to start building your schedule."),
  ).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "All events" }));
  await user.click(screen.getByRole("button", { name: "Save Dinner" }));
  await user.click(screen.getByRole("radio", { name: /Saturday/ }));
  await user.click(
    screen.getByRole("button", { name: "Save Tomorrow workshop" }),
  );
  await user.click(screen.getByRole("button", { name: "My schedule" }));
  expect(screen.getByRole("heading", { name: "Dinner" })).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: "Tomorrow workshop" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Export to Google Calendar" }),
  ).toBeInTheDocument();
});
test("a hidden saved event still produces a named conflict warning", async () => {
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      events: [
        events[0],
        { ...events[1], startTime: events[0].startTime + 60 },
      ],
    }),
  });
  const user = userEvent.setup();
  render(<App />);
  await screen.findByRole("heading", { name: "Dinner" });
  await user.click(screen.getByRole("button", { name: "Save Dinner" }));
  await user.click(
    screen.getByRole("button", { name: "Save Build a website" }),
  );
  await user.selectOptions(
    screen.getByRole("combobox", { name: "Event type" }),
    "MEAL",
  );
  expect(
    screen.queryByRole("heading", { name: "Build a website" }),
  ).not.toBeInTheDocument();
  expect(screen.getByText(/Conflict with Build a website/)).toHaveTextContent(
    "Conflict with Build a website from 5:01 PM to 6:00 PM · Feb 27",
  );
});

test("Google export includes the whole weekend regardless of filters, or only favorites", async () => {
  const tomorrow = {
    ...events[1],
    eventId: "tomorrow",
    name: "Tomorrow workshop",
    startTime: events[1].startTime + 86400,
    endTime: events[1].endTime + 86400,
  };
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ events: [...events, tomorrow] }),
  });
  fetch.mockResolvedValue({ ok: true, status: 200 });
  vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "test.apps.googleusercontent.com");
  vi.stubGlobal("crypto", webcrypto);
  vi.stubGlobal("google", {
    accounts: {
      oauth2: {
        hasGrantedAllScopes: () => true,
        initTokenClient: (config) => ({
          requestAccessToken: () =>
            config.callback({ access_token: "temporary-test-token" }),
        }),
      },
    },
  });
  const user = userEvent.setup();
  render(<App />);
  await screen.findByRole("heading", { name: "Dinner" });
  await user.click(screen.getByRole("button", { name: "Save Dinner" }));
  await user.selectOptions(
    screen.getByRole("combobox", { name: "Event type" }),
    "MEAL",
  );
  const button = screen.getByRole("button", {
    name: "Export to Google Calendar",
  });
  expect(
    button.compareDocumentPosition(
      screen.getByRole("group", { name: "Schedule day" }),
    ) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  expect(
    screen.queryByText(/Adds these events to your primary calendar/),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByText(/Exports all .* across the weekend/),
  ).not.toBeInTheDocument();
  await waitFor(() => expect(button).toBeEnabled());
  await user.click(button);
  await waitFor(() =>
    expect(screen.getByRole("status")).toHaveTextContent("3 added"),
  );
  await user.click(screen.getByRole("button", { name: "My schedule" }));
  await user.click(
    screen.getByRole("button", { name: "Export to Google Calendar" }),
  );
  await waitFor(() =>
    expect(screen.getByRole("status")).toHaveTextContent("1 added"),
  );
  const writes = fetch.mock.calls.filter(
    ([, options]) => options?.method === "POST",
  );
  expect(writes).toHaveLength(4);
  expect(
    writes.slice(0, 3).map(([, options]) => JSON.parse(options.body).summary),
  ).toEqual(["Dinner", "Build a website", "Tomorrow workshop"]);
  expect(JSON.parse(writes[3][1].body).summary).toBe("Dinner");
  expect(
    screen.queryByRole("button", { name: /Download/ }),
  ).not.toBeInTheDocument();
  expect(
    [...document.querySelectorAll(".route-stop")].every(
      (node) => node.textContent.trim() === "",
    ),
  ).toBe(true);
});
