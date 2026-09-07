import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, test, expect } from "vitest";
import App from "../../../App.jsx";
import { events } from "../fixtures/schedule.js";
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
