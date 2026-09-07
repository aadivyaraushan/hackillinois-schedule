import React from "react";
import { dayKey, formatDay, formatTime, typeLabel } from "../data/events.js";
function safeUrl(value) {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}
function locationUrl(location) {
  const hasCoordinates =
    Number.isFinite(location.latitude) &&
    Math.abs(location.latitude) <= 90 &&
    Number.isFinite(location.longitude) &&
    Math.abs(location.longitude) <= 180;
  const query = hasCoordinates
    ? `${location.latitude},${location.longitude}`
    : location.description;
  return `https://www.google.com/maps/search/?${new URLSearchParams({ api: "1", query })}`;
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
export default function EventCard({
  event,
  saved,
  onToggle,
  now,
  conflicts = [],
}) {
  const map = safeUrl(event.mapImageUrl);
  const ongoing = now >= event.startTime * 1000 && now < event.endTime * 1000;
  return (
    <article className="event" id={`event-${event.eventId}`}>
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
          {conflicts.length > 0 && (
            <span className="overlap-note">Overlaps a saved event</span>
          )}
          {event.isAsync && <span>· Flexible timing</span>}
        </div>
        <details>
          <summary>
            <h2>{event.name}</h2>
            <svg
              className="arrow"
              viewBox="0 0 32 38"
              aria-hidden="true"
              focusable="false"
            >
              <path
                d="M16 4c-2 8 2 16-1 27M6 23l9 9 10-11"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M18 6c-1 8 1 15-1 22M8 24l7 7"
                fill="none"
                stroke="currentColor"
                strokeWidth=".7"
                opacity=".5"
                strokeLinecap="round"
              />
            </svg>
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
            </div>
          </div>
        </details>
        {conflicts.map((other) => {
          const overlapStart = Math.max(event.startTime, other.startTime);
          const overlapEnd = Math.min(event.endTime, other.endTime);
          const startDay = dayKey(overlapStart);
          const endDay = dayKey(overlapEnd);
          const dateOptions = { month: "short", day: "numeric" };
          return (
            <p className="conflict-detail" key={other.eventId}>
              Conflict with {other.name} from {formatTime(overlapStart)} to{" "}
              {formatTime(overlapEnd)} · {formatDay(startDay, dateOptions)}
              {startDay !== endDay && `–${formatDay(endDay, dateOptions)}`}
            </p>
          );
        })}
        <div className="locations">
          {event.locations.length ? (
            event.locations.map((location, index) => (
              <p className="location" key={`${location.description}-${index}`}>
                <span>{location.description}</span>
                <a
                  className="open-location"
                  href={locationUrl(location)}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Open location: ${location.description}`}
                >
                  Open location <span aria-hidden="true">↗</span>
                </a>
              </p>
            ))
          ) : (
            <p className="location">Location to be announced</p>
          )}
        </div>
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
