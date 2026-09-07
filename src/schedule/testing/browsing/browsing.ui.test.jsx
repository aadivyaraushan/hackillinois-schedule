import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { test, expect } from "vitest";
import App from "../../../App.jsx";
import { events } from "../fixtures/schedule.js";
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
