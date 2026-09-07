import EventDescription from "./details/EventDescription.jsx";
import EventLocations from "./details/EventLocations.jsx";
import React from "react";
import { dayKey, formatDay, formatTime, typeLabel } from "../data/events.js";
export default function EventCard({
  event,
  saved,
  onToggle,
  now,
  conflicts = [],
}) {
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
          <EventDescription event={event} />
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
        <EventLocations event={event} />
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
