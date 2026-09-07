import React, { useEffect, useState } from "react";
import Navigation from "./navigation/Navigation.jsx";
import Ocean from "./ocean/Ocean.jsx";
import {
  dayKey,
  getDays,
  formatDay,
  typeLabel,
} from "./schedule/data/events.js";
import { useSavedEvents, useSchedule } from "./schedule/state/useSchedule.js";
import EventCard from "./schedule/view/EventCard.jsx";
function Boat() {
  return (
    <svg className="route-boat" viewBox="0 0 40 45" aria-hidden="true">
      <path
        d="M20 3 7 28h11zm4 0v25h12zM5 32l7 8h19l6-8zM22 1v31M5 44q7-5 14 0t16 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path d="m5 32 7 8h19l6-8z" fill="#cba577" opacity=".7" />
    </svg>
  );
}
export default function App() {
  const { events, loading, error, refresh, updatedAt } = useSchedule();
  const { saved, toggle, storageError } = useSavedEvents();
  const [selectedDay, setSelectedDay] = useState("");
  const [kind, setKind] = useState("all");
  const [query, setQuery] = useState("");
  const [savedOnly, setSavedOnly] = useState(false);
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
  const visible = events.filter(
    (event) =>
      dayKey(event.startTime) === day &&
      (kind === "all" || event.eventType === kind) &&
      (!savedOnly || saved.has(event.eventId)) &&
      `${event.name} ${event.description} ${event.locations.map((item) => item.description).join(" ")}`
        .toLowerCase()
        .includes(needle),
  );
  const activeIndex = Math.max(0, days.indexOf(day));
  function clearFilters() {
    setKind("all");
    setQuery("");
    setSavedOnly(false);
  }
  return (
    <>
      <a className="skip-link" href="#schedule">
        Skip to schedule
      </a>
      <Navigation />
      <main className="page" id="schedule">
        <div className="title-row">
          <h1>Schedule</h1>
          <label className="pause">
            <input
              type="checkbox"
              checked={paused}
              onChange={(event) => setPaused(event.target.checked)}
            />
            Pause ocean
          </label>
        </div>
        {days.length > 0 && (
          <>
            <p className="edition">
              {formatDay(days[0], {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
              {days.length > 1
                ? ` — ${formatDay(days.at(-1), { month: "long", day: "numeric", year: "numeric" })}`
                : ""}
            </p>
            <div className="days-scroll">
              <div
                className="days"
                role="group"
                aria-label="Schedule day"
                style={{
                  "--day-count": days.length,
                  "--boat-position": `${(100 * (activeIndex + 0.5)) / days.length}%`,
                }}
              >
                <svg
                  className="route"
                  viewBox="0 0 800 48"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path
                    d="M12 25C180 34 150 13 320 24S570 18 788 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeDasharray="5 7"
                  />
                </svg>
                <Boat />
                {days.map((date) => (
                  <label
                    className={`day ${date === day ? "active" : ""}`}
                    key={date}
                  >
                    <input
                      type="radio"
                      name="schedule-day"
                      value={date}
                      checked={date === day}
                      onChange={() => setSelectedDay(date)}
                    />
                    <span className="day-name">
                      {new Date(`${date}T12:00:00Z`).toLocaleDateString(
                        "en-US",
                        { weekday: "long", timeZone: "UTC" },
                      )}
                    </span>
                    <span className="day-date">
                      {new Date(`${date}T12:00:00Z`).toLocaleDateString(
                        "en-US",
                        { month: "short", day: "numeric", timeZone: "UTC" },
                      )}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div className="toolbar">
              <label className="select-wrap">
                <select
                  aria-label="Event type"
                  value={kind}
                  onChange={(event) => setKind(event.target.value)}
                >
                  <option value="all">All event types</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {typeLabel(category)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="saved-filter">
                <input
                  type="checkbox"
                  checked={savedOnly}
                  onChange={(event) => setSavedOnly(event.target.checked)}
                />
                Saved events
              </label>
            </div>
            <div className="search-row">
              <input
                type="search"
                aria-label="Search events"
                placeholder="Find an event or place…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <span className="timezone">
                Chicago time ·{" "}
                {
                  new Intl.DateTimeFormat("en-US", {
                    timeZone: "America/Chicago",
                    timeZoneName: "short",
                  })
                    .formatToParts(new Date(`${day}T12:00:00Z`))
                    .find((part) => part.type === "timeZoneName")?.value
                }
              </span>
            </div>
          </>
        )}
        {storageError && (
          <p role="status" className="notice">
            Your browser could not save your selections. They will last until
            you leave this page.
          </p>
        )}
        {loading && (
          <p role="status" className="notice">
            {events.length
              ? "Refreshing the schedule…"
              : "Loading the schedule…"}
          </p>
        )}
        {error && (
          <div role="alert" className="notice error">
            <p>{error}</p>
            {events.length > 0 && (
              <p>Previously loaded events are still shown below.</p>
            )}
            <button onClick={refresh}>Try again</button>
          </div>
        )}
        {!loading && !error && !events.length && (
          <div className="notice">
            <p>No events have been published yet.</p>
            <button onClick={refresh}>Refresh schedule</button>
          </div>
        )}
        {events.length > 0 && (
          <>
            <div className="day-heading">
              <h2>{formatDay(day)}</h2>
              <span aria-live="polite">
                {visible.length} {visible.length === 1 ? "event" : "events"}
              </span>
            </div>
            <section aria-label="Schedule events">
              {visible.map((event) => (
                <EventCard
                  key={event.eventId}
                  event={event}
                  saved={saved.has(event.eventId)}
                  onToggle={toggle}
                  now={now}
                />
              ))}
            </section>
            {!visible.length && (
              <div className="notice">
                <p>No events match your filters.</p>
                <button onClick={clearFilters}>Clear filters</button>
              </div>
            )}
          </>
        )}
        <footer className="schedule-footer">
          <p>
            Events from <a href="https://hackillinois.org/">HackIllinois</a>.
            Saved events stay on this browser.
          </p>
          {updatedAt && (
            <p>
              Last checked{" "}
              {updatedAt.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })}
              .{" "}
              <button onClick={refresh} disabled={loading}>
                Refresh
              </button>
            </p>
          )}
          <p className="archive-note">
            Home, Mentors and Prizes link to the 2021 site.
          </p>
        </footer>
      </main>
      <Ocean dayIndex={activeIndex} dayCount={days.length} paused={paused} />
    </>
  );
}
