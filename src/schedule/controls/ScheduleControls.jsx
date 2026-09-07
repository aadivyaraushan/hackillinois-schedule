import React from "react";
import GoogleExport from "../google/GoogleExport.jsx";
import { formatDay } from "../data/events.js";
import DayFilters from "./DayFilters.jsx";
export default function ScheduleControls({
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
}) {
  return (
    <>
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
            <DayFilters
              {...{
                days,
                day,
                setSelectedDay,
                categories,
                kind,
                setKind,
                query,
                setQuery,
              }}
            />
          )}
        </>
      )}
    </>
  );
}
