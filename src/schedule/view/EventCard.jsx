import { eventCalendar } from "../export/calendar.js";
import React from "react";
import { dayKey, formatTime, typeLabel } from "../data/events.js";
function safeUrl(value) {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}
function Description({ text }) {
  return text.split(/(https?:\/\/[^\s<>]+)/g).map((part, index) => {
    const url = safeUrl(part);
    return url ? (
      <a key={index} href={url} target="_blank" rel="noreferrer">
        {part}
      </a>
    ) : (
      part
    );
  });
}
function calendar(event) {
  const url = URL.createObjectURL(
    new Blob([eventCalendar(event)], {
      type: "text/calendar;charset=utf-8",
    }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "hackillinois-event.ics";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export default function EventCard({ event, saved, onToggle, now }) {
  const location =
    event.locations
      .map((item) => item.description)
      .filter(Boolean)
      .join(" · ") || "Location to be announced";
  const map = safeUrl(event.mapImageUrl);
  const ongoing = now >= event.startTime * 1000 && now < event.endTime * 1000;
  return (
    <article className="event">
      <div className="time">
        <time dateTime={new Date(event.startTime * 1000).toISOString()}>
          {formatTime(event.startTime)}
        </time>
        <p>
          <time dateTime={new Date(event.endTime * 1000).toISOString()}>
            {formatTime(event.endTime)}
          </time>
          {dayKey(event.endTime) !== dayKey(event.startTime) && (
            <span className="next-day">next day</span>
          )}
        </p>
      </div>
      <div className="event-body">
        <div className={`kind kind-${event.eventType.toLowerCase()}`}>
          {typeLabel(event.eventType)}
          {ongoing && <span className="live">Happening now</span>}
          {event.isAsync && <span>· Flexible timing</span>}
        </div>
        <details>
          <summary>
            <h2>{event.name}</h2>
            <span className="arrow" aria-hidden="true">
              ↗
            </span>
          </summary>
          <div className="description">
            <p>
              <Description
                text={
                  event.description ||
                  "No additional details have been published."
                }
              />
            </p>
            {event.sponsor && <p>Hosted by {event.sponsor}</p>}
            {event.points > 0 && <p>{event.points} points</p>}
            {event.menu?.length > 0 && <p>Menu: {event.menu.join(", ")}</p>}
            <div className="event-links">
              {map && (
                <a href={map} target="_blank" rel="noreferrer">
                  View venue map ↗
                </a>
              )}
              <button onClick={() => calendar(event)}>Add to calendar ↓</button>
            </div>
          </div>
        </details>
        <p className="location">{location}</p>
      </div>
      <button
        className="save"
        aria-label={`${saved ? "Unsave" : "Save"} ${event.name}`}
        aria-pressed={saved}
        onClick={() => onToggle(event.eventId)}
      >
        <span aria-hidden="true">{saved ? "★" : "☆"}</span>
      </button>
    </article>
  );
}
