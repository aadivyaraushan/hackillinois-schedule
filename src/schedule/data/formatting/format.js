export const TIME_ZONE = "America/Chicago";

const DATE_PARTS = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const TYPE_LABELS = {
  CEREMONY: "Ceremony",
  MEAL: "Meal",
  MEETING: "Meeting",
  MINIEVENT: "Mini Event",
  OTHER: "Other",
  QNA: "Q&A",
  SIDEQUEST: "Side Quest",
  SOCIAL: "Social",
  SPEAKER: "Speaker Event",
  STAFFSHIFT: "Staff Shift",
  WORKSHOP: "Workshop",
};

export function dayKey(seconds) {
  const parts = Object.fromEntries(
    DATE_PARTS.formatToParts(new Date(seconds * 1000))
      .filter(({ type }) => type !== "literal")
      .map(({ type, value }) => [type, value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function getDays(events) {
  return [
    ...new Set(
      events
        .filter((event) => Number.isFinite(event?.startTime))
        .map((event) => dayKey(event.startTime)),
    ),
  ].sort();
}

export function formatDay(
  key,
  options = { weekday: "long", month: "long", day: "numeric" },
) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return "";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    ...options,
  }).format(new Date(`${key}T12:00:00.000Z`));
}

export function formatTime(seconds) {
  return TIME_FORMATTER.format(new Date(seconds * 1000));
}

export function typeLabel(type) {
  const normalized = typeof type === "string" ? type.trim() : "";
  if (!normalized) return "Event";
  if (TYPE_LABELS[normalized]) return TYPE_LABELS[normalized];
  return (
    normalized
      .toLowerCase()
      .split(/[_\s-]+/)
      .filter(Boolean)
      .map((word) => word[0].toUpperCase() + word.slice(1))
      .join(" ") || "Event"
  );
}
