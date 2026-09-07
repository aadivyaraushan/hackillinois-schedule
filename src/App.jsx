import React, { useEffect, useState } from "react";
import GoogleExport from "./schedule/google/GoogleExport.jsx";
import "./schedule/plan-view/plan.css";
import Navigation from "./navigation/Navigation.jsx";
import EventRoute from "./schedule/route/EventRoute.jsx";
import Ocean from "./ocean/Ocean.jsx";
import {
  dayKey,
  getDays,
  formatDay,
  typeLabel,
} from "./schedule/data/events.js";
import { useSavedEvents, useSchedule } from "./schedule/state/useSchedule.js";
import EventCard from "./schedule/view/EventCard.jsx";
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
            <div className="schedule-controls">
              <nav className="schedule-views" aria-label="Schedule view">
                <button
                  aria-pressed={!mySchedule}
                  onClick={() => setMySchedule(false)}
                >
                  All events
                </button>
                <button
                  aria-pressed={mySchedule}
                  onClick={() => setMySchedule(true)}
                >
                  My schedule
                </button>
              </nav>
              <div className="plan-actions">
                <GoogleExport
                  key={mySchedule ? "saved" : "all"}
                  events={mySchedule ? savedEvents : events}
                />
              </div>
            </div>
            {!mySchedule && (
              <>
                <div className="days-scroll">
                  <div
                    className="days"
                    role="group"
                    aria-label="Schedule day"
                    style={{
                      "--day-count": days.length,
                    }}
                  >
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
                </div>
                <div className="search-row">
                  <input
                    type="search"
                    aria-label="Search events"
                    placeholder="Find an event or place…"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </div>
              </>
            )}
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
              <h2>{mySchedule ? "Your starred events" : formatDay(day)}</h2>
              <span aria-live="polite">
                {visible.length} {visible.length === 1 ? "event" : "events"}
              </span>
            </div>
            <section className="event-list" aria-label="Schedule events">
              <EventRoute
                events={visible}
                paused={paused}
                onProgress={setRouteProgress}
              />

              {visible.map((event, index) => (
                <React.Fragment key={event.eventId}>
                  {mySchedule &&
                    (index === 0 ||
                      dayKey(event.startTime) !==
                        dayKey(visible[index - 1].startTime)) && (
                      <h3 className="plan-day">
                        {formatDay(dayKey(event.startTime))}
                      </h3>
                    )}
                  <EventCard
                    event={event}
                    saved={saved.has(event.eventId)}
                    onToggle={toggle}
                    now={now}
                    conflicts={
                      saved.has(event.eventId)
                        ? savedEvents.filter(
                            (other) =>
                              other.eventId !== event.eventId &&
                              other.startTime < event.endTime &&
                              event.startTime < other.endTime,
                          )
                        : []
                    }
                  />
                </React.Fragment>
              ))}
            </section>
            {!visible.length && (
              <div className="notice">
                <p>
                  {mySchedule
                    ? "Star events to start building your schedule."
                    : "No events match your filters."}
                </p>
                <button onClick={clearFilters}>
                  {mySchedule ? "Browse events" : "Clear filters"}
                </button>
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
      <Ocean
        dayIndex={activeIndex}
        dayCount={days.length}
        paused={paused}
        progress={routeProgress}
      />
    </>
  );
}
