import { useEffect, useState } from "react";
import { fetchEvents } from "../data/events.js";
import { logger } from "../data/logger.js";
const SAVED_KEY = "hackillinois:saved-events";
export function useSavedEvents() {
  const [storageError, setStorageError] = useState(false);
  const [saved, setSaved] = useState(() => {
    try {
      const value = JSON.parse(localStorage.getItem(SAVED_KEY) || "[]");
      return new Set(
        Array.isArray(value)
          ? value.filter((id) => typeof id === "string")
          : [],
      );
    } catch (error) {
      logger.warn("Could not read saved events", error.message);
      return new Set();
    }
  });
  function toggle(id) {
    const next = new Set(saved);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSaved(next);
    try {
      localStorage.setItem(SAVED_KEY, JSON.stringify([...next]));
      setStorageError(false);
    } catch (error) {
      logger.warn("Could not persist saved events", error.message);
      setStorageError(true);
    }
  }
  return { saved, toggle, storageError };
}
export function useSchedule() {
  const [state, setState] = useState({
    events: [],
    loading: true,
    error: "",
    updatedAt: null,
  });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timeout = setTimeout(() => controller.abort(), 15000);
    setState((previous) => ({ ...previous, loading: true, error: "" }));
    fetchEvents({ signal: controller.signal })
      .then((events) => {
        if (active)
          setState({
            events,
            loading: false,
            error: "",
            updatedAt: new Date(),
          });
      })
      .catch(() => {
        if (active)
          setState((previous) => ({
            ...previous,
            loading: false,
            error:
              "Could not load the schedule. Check your connection and try again.",
          }));
      })
      .finally(() => clearTimeout(timeout));
    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [attempt]);
  return { ...state, refresh: () => setAttempt((value) => value + 1) };
}
