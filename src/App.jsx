import ScheduleControls from "./schedule/controls/ScheduleControls.jsx";
import ScheduleNotices from "./schedule/status/ScheduleNotices.jsx";
import ScheduleFooter from "./schedule/status/ScheduleFooter.jsx";
import EventList from "./schedule/plan-view/EventList.jsx";
import React, { useEffect, useState } from "react";
import "./schedule/plan-view/plan.css";
import Navigation from "./navigation/Navigation.jsx";
import Ocean from "./ocean/Ocean.jsx";
import { dayKey, getDays, typeLabel } from "./schedule/data/events.js";
import { useSavedEvents, useSchedule } from "./schedule/state/useSchedule.js";
export default function App() {
  const { events, loading, error, refresh, updatedAt } = useSchedule();
  const { saved, toggle, storageError } = useSavedEvents();
  const [selectedDay, setSelectedDay] = useState("");
  const [kind, setKind] = useState("all");
  const [query, setQuery] = useState("");
  const [mySchedule, setMySchedule] = useState(false);
  const [routeProgress, setRouteProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);
  const days = getDays(events);
  const today = dayKey(now / 1000);
  const day = days.includes(selectedDay)
    ? selectedDay
    : days.includes(today)
      ? today
      : days[0];
  const categories = [...new Set(events.map((event) => event.eventType))].sort(
    (a, b) => typeLabel(a).localeCompare(typeLabel(b)),
  );
  const needle = query.trim().toLowerCase();
  const savedEvents = events.filter((event) => saved.has(event.eventId));
  const visible = mySchedule
    ? savedEvents
    : events.filter(
        (event) =>
          dayKey(event.startTime) === day &&
          (kind === "all" || event.eventType === kind) &&
          `${event.name} ${event.description} ${event.locations.map((item) => item.description).join(" ")}`
            .toLowerCase()
            .includes(needle),
      );
  const activeIndex = Math.max(0, days.indexOf(day));
  function clearFilters() {
    setKind("all");
    setQuery("");
    setMySchedule(false);
  }
  return (
    <>
      <a className="skip-link" href="#schedule">
        Skip to schedule
      </a>
      <Navigation />
      <main className="page" id="schedule">
        <div className="title-row">
          <h1>{mySchedule ? "My schedule" : "Schedule"}</h1>
          <label className="pause">
            <input
              type="checkbox"
              checked={paused}
              onChange={(event) => setPaused(event.target.checked)}
            />
            Pause ocean
          </label>
        </div>
        <ScheduleControls
          {...{
            days,
            day,
            setSelectedDay,
            mySchedule,
            setMySchedule,
            events,
            savedEvents,
            categories,
            kind,
            setKind,
            query,
            setQuery,
          }}
        />
        <ScheduleNotices
          {...{ storageError, loading, events, error, refresh }}
        />
        <EventList
          {...{
            events,
            visible,
            savedEvents,
            saved,
            toggle,
            now,
            mySchedule,
            day,
            paused,
            setRouteProgress,
            clearFilters,
          }}
        />
        <ScheduleFooter {...{ updatedAt, refresh, loading }} />
      </main>
      <Ocean
        dayIndex={activeIndex}
        dayCount={days.length}
        paused={paused}
        progress={routeProgress}
      />
    </>
  );
}
