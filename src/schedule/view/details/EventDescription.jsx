import React from "react";
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
export default function EventDescription({ event }) {
  const map = safeUrl(event.mapImageUrl);
  return (
    <div className="description">
      <p>
        <Description
          text={
            event.description || "No additional details have been published."
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
  );
}
