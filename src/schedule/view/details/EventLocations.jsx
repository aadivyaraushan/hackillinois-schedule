import React from "react";
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
export default function EventLocations({ event }) {
  return (
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
  );
}
