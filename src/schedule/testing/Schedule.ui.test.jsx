import React from "react";
import { render, screen } from "@testing-library/react";
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
afterEach(() => vi.unstubAllGlobals());
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
  await user.click(screen.getByRole("checkbox", { name: "Saved events" }));
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
