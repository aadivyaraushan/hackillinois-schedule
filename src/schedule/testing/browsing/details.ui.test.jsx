import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { test, expect } from "vitest";
import App from "../../../App.jsx";
import { events } from "../fixtures/schedule.js";
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
