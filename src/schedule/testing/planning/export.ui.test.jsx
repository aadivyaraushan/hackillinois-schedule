import React from "react";
import { webcrypto } from "node:crypto";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, test, expect } from "vitest";
import App from "../../../App.jsx";
import { events } from "../fixtures/schedule.js";
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
