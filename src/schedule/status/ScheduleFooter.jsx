import React from "react";
export default function ScheduleFooter({ updatedAt, refresh, loading }) {
  return (
    <footer className="schedule-footer">
      <p>
        Events from <a href="https://hackillinois.org/">HackIllinois</a>. Saved
        events stay on this browser.
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
  );
}
