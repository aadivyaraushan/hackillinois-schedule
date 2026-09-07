import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, test, expect } from "vitest";
import App from "../../../App.jsx";
import { events } from "../fixtures/schedule.js";
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
