import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { test, expect } from "vitest";
import App from "../../../App.jsx";
import { events } from "../fixtures/schedule.js";
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
