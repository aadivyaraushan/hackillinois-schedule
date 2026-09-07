import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { test, expect, vi, afterEach } from "vitest";
import { webcrypto } from "node:crypto";
import GoogleExport from "../google/GoogleExport.jsx";
const events = [
  {
    eventId: "one",
    name: "Workshop",
    description: "",
    startTime: 1772233200,
    endTime: 1772236800,
    locations: [],
  },
];
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
function setup(response, granted = true) {
  vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "test.apps.googleusercontent.com");
  vi.stubGlobal("crypto", webcrypto);
  const request = vi.fn();
  vi.stubGlobal("google", {
    accounts: {
      oauth2: {
        hasGrantedAllScopes: () => granted,
        initTokenClient: vi.fn((config) => ({
          requestAccessToken: () => {
            request();
            config.callback(response);
          },
        })),
      },
    },
  });
  return request;
}
test("permission denial never sends calendar writes", async () => {
  const user = userEvent.setup();
  setup({ error: "access_denied" }, false);
  vi.stubGlobal("fetch", vi.fn());
  render(<GoogleExport events={events} />);
  const button = screen.getByRole("button", {
    name: "Export to Google Calendar",
  });
  await waitFor(() => expect(button).toBeEnabled());
  await user.click(button);
  expect(screen.getByRole("status")).toHaveTextContent("Nothing was exported");
  expect(fetch).not.toHaveBeenCalled();
});
test("explicit consent exports saved events and reports completion", async () => {
  const user = userEvent.setup();
  setup({ access_token: "temporary-test-token" });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200 }));
  render(<GoogleExport events={events} />);
  const button = screen.getByRole("button", {
    name: "Export to Google Calendar",
  });
  await waitFor(() => expect(button).toBeEnabled());
  expect(fetch).not.toHaveBeenCalled();
  await user.click(button);
  await waitFor(() =>
    expect(screen.getByRole("status")).toHaveTextContent("1 added; 0 already"),
  );
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(localStorage.getItem("access_token")).toBeNull();
});
test("missing Google configuration explains the unavailable export", () => {
  vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "");
  render(<GoogleExport events={events} />);
  expect(
    screen.getByRole("button", { name: "Export to Google Calendar" }),
  ).toBeDisabled();
  expect(
    screen.getByText(/Google Calendar export is not available yet/),
  ).toBeInTheDocument();
});
