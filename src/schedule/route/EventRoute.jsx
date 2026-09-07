import React, { useEffect, useState } from "react";
import { logger } from "../data/diagnostics/logger.js";
import "./route.css";

export default function EventRoute({ events, paused, onProgress }) {
  const [position, setPosition] = useState(0);
  const [anchors, setAnchors] = useState([]);
  // Depend on identities rather than the filter's newly allocated array.
  const ids = JSON.stringify(events.map((event) => event.eventId));
  useEffect(() => {
    const eventIds = JSON.parse(ids);
    let frame;
    function measure() {
      const tops = eventIds.map(
        (id) =>
          document.getElementById(`event-${id}`)?.getBoundingClientRect().top ??
          Infinity,
      );
      const cards = eventIds.map((id) =>
        document.getElementById(`event-${id}`),
      );
      // offsetTop stays in the paper's coordinate system even when it is rotated.
      setAnchors(cards.map((card) => (card?.offsetTop ?? 0) + 48));
      const readingLine = Math.min(window.innerHeight * 0.3, 220);
      const maxScroll = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      const finalStretch = Math.min(window.innerHeight, maxScroll);
      const remaining = Math.max(0, maxScroll - window.scrollY);
      const blend =
        finalStretch > 0 ? Math.max(0, 1 - remaining / finalStretch) : 0;
      // Move the reading line gradually toward the last stop, never snap at the bottom.
      const lastTopAtBottom =
        (tops.at(-1) ?? readingLine) + window.scrollY - maxScroll;
      const line =
        readingLine + Math.max(0, lastTopAtBottom - readingLine) * blend;
      let index = 0;
      while (index < tops.length - 1 && tops[index + 1] <= line) index++;
      const gap = tops[index + 1] - tops[index];
      const fraction =
        Number.isFinite(gap) && gap > 0
          ? Math.max(0, Math.min(1, (line - tops[index]) / gap))
          : 0;
      const next = index + fraction;
      setPosition(next);
      onProgress(eventIds.length > 1 ? next / (eventIds.length - 1) : 0);
    }
    function schedule() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    }
    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    // Expanded descriptions can change heights without a window resize.
    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(schedule)
        : null;
    const section = document.querySelector('[aria-label="Schedule events"]');
    if (section) observer?.observe(section);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      observer?.disconnect();
    };
  }, [ids, onProgress]);
  const active = Math.min(Math.floor(position), events.length - 1);
  function go(event) {
    const card = document.getElementById(`event-${event.eventId}`);
    if (!card) {
      logger.warn("Route target missing", event.eventId);
      return;
    }
    logger.debug("Route stop selected", event.eventId);
    card.querySelector("details").open = true;
    card.querySelector("summary").focus({ preventScroll: true });
    card.scrollIntoView({
      block: "start",
      behavior:
        paused ||
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
    });
  }
  if (!events.length) return null;
  const start = anchors[Math.max(0, active)] ?? 48;
  const end = anchors[active + 1] ?? start;
  const boatTop = start + (end - start) * (position - Math.floor(position));
  // Match the repeating quadratic wave: each bend is 72px tall.
  const waveY = Math.max(0, boatTop - 26);
  const bend = Math.floor(waveY / 72);
  const t = (waveY % 72) / 72;
  const direction = bend % 2 ? 1 : -1;
  const drift = direction * 36 * t * (1 - t);
  const slope = (direction * (1 - 2 * t)) / 2;
  const tilt = -90 - (Math.atan(slope) * 180) / Math.PI;
  return (
    <nav className="event-route" aria-label="Event route">
      <div className="drawn-current" aria-hidden="true" />
      <svg
        className="sailing-boat"
        viewBox="0 0 40 45"
        aria-hidden="true"
        style={{
          top: boatTop,
          left: `calc(50% + ${drift}px)`,
          transform: `translate(-50%, -80%) rotate(${tilt}deg)`,
        }}
      >
        <path
          d="M20 3 7 28h11zm4 0v25h12zM5 32l7 8h19l6-8zM22 1v31M5 44q7-5 14 0t16 0"
          fill="#f3f0df"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <path d="m5 32 7 8h19l6-8z" fill="#cba577" />
      </svg>
      {events.map((event, index) => (
        <button
          key={event.eventId}
          className="route-stop"
          style={{ top: (anchors[index] ?? 48) - 22 }}
          aria-label={`Go to ${event.name}`}
          aria-current={index === active ? "step" : undefined}
          onClick={() => go(event)}
          title={event.name}
        ></button>
      ))}
    </nav>
  );
}
