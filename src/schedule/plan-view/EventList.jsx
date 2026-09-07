import React from "react";
import { dayKey, formatDay } from "../data/events.js";
import EventCard from "../view/EventCard.jsx";
import EventRoute from "../route/EventRoute.jsx";
export default function EventList({
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
}) {
  return (
    <>
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
    </>
  );
}
