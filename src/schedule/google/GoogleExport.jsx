import React, { useEffect, useRef, useState } from "react";
import { exportToGoogle, GOOGLE_SCOPE } from "./calendar.js";
import { logger } from "../data/diagnostics/logger.js";
let scriptPromise;
function loadGoogle() {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (!scriptPromise)
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      const timer = setTimeout(() => {
        script.remove();
        scriptPromise = null;
        reject(new Error("Google sign-in timed out. Reload to retry."));
      }, 15000);
      script.onload = () => {
        clearTimeout(timer);
        resolve();
      };
      script.onerror = () => {
        clearTimeout(timer);
        script.remove();
        scriptPromise = null;
        reject(new Error("Google sign-in could not load. Reload to retry."));
      };
      document.head.append(script);
    });
  return scriptPromise;
}
export default function GoogleExport({ events }) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const mounted = useRef(true),
    running = useRef(false);
  useEffect(() => {
    mounted.current = true;
    if (clientId)
      loadGoogle()
        .then(() => {
          if (mounted.current) setReady(true);
        })
        .catch((error) => {
          logger.warn("Google sign-in load failed", error.message);
          if (mounted.current) setMessage(error.message);
        });
    return () => {
      mounted.current = false;
    };
  }, [clientId]);
  function exportSchedule() {
    if (running.current || !events.length) return;
    const snapshot = [...events];
    running.current = true;
    setBusy(true);
    setMessage("Waiting for Google permission…");
    function finish(text) {
      running.current = false;
      if (mounted.current) {
        setBusy(false);
        setMessage(text);
      }
    }
    try {
      const oauth = window.google.accounts.oauth2;
      const client = oauth.initTokenClient({
        client_id: clientId,
        scope: GOOGLE_SCOPE,
        include_granted_scopes: false,
        error_callback: () =>
          finish("Google sign-in was closed or blocked. You can try again."),
        callback: async (response) => {
          if (
            response.error ||
            !response.access_token ||
            !oauth.hasGrantedAllScopes(response, GOOGLE_SCOPE)
          ) {
            finish(
              "Calendar permission was not granted. Nothing was exported.",
            );
            return;
          }
          if (mounted.current)
            setMessage(`Exporting ${snapshot.length} events…`);
          try {
            const result = await exportToGoogle(
              snapshot,
              response.access_token,
            );
            finish(
              `${result.added} added; ${result.existing} already in Google Calendar.${result.failed.length ? ` ${result.failed.length} not exported: ${result.failed.join(", ")}. ${result.authExpired ? "Sign in again and retry." : "Retry to add the remaining events."}` : ""}`,
            );
          } catch (error) {
            logger.warn("Google export stopped", error.message);
            finish(
              "Export could not finish. Retry safely; existing events will be skipped.",
            );
          }
        },
      });
      client.requestAccessToken({ prompt: "select_account" });
    } catch (error) {
      logger.warn("Google sign-in failed", error.message);
      finish("Google sign-in could not open. Reload and try again.");
    }
  }
  return (
    <div className="google-export">
      <button
        onClick={exportSchedule}
        disabled={!clientId || !ready || busy || !events.length}
      >
        {busy ? "Exporting…" : "Export to Google Calendar"}
      </button>
      {!clientId && <p>Google Calendar export is not available yet.</p>}
      {message && <p role="status">{message}</p>}
    </div>
  );
}
