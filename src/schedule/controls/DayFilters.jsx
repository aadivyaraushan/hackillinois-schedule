import React from "react";
import { typeLabel } from "../data/events.js";
export default function DayFilters({
  days,
  day,
  setSelectedDay,
  categories,
  kind,
  setKind,
  query,
  setQuery,
}) {
  return (
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
            <label className={`day ${date === day ? "active" : ""}`} key={date}>
              <input
                type="radio"
                name="schedule-day"
                value={date}
                checked={date === day}
                onChange={() => setSelectedDay(date)}
              />
              <span className="day-name">
                {new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
                  weekday: "long",
                  timeZone: "UTC",
                })}
              </span>
              <span className="day-date">
                {new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  timeZone: "UTC",
                })}
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
  );
}
