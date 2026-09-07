import React from "react";
export default function ScheduleNotices({
  storageError,
  loading,
  events,
  error,
  refresh,
}) {
  return (
    <>
      {storageError && (
        <p role="status" className="notice">
          Your browser could not save your selections. They will last until you
          leave this page.
        </p>
      )}
      {loading && (
        <p role="status" className="notice">
          {events.length ? "Refreshing the schedule…" : "Loading the schedule…"}
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
    </>
  );
}
