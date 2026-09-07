const escapeText = (value) =>
  String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
const timestamp = (seconds) =>
  new Date(seconds * 1000)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
// Calendar lines are limited in bytes, not characters; preserve complete emoji.
function foldLine(line) {
  const encoder = new TextEncoder();
  const lines = [];
  let current = "";
  let size = 0;
  for (const character of line) {
    const bytes = encoder.encode(character).length;
    if (size + bytes > 75) {
      lines.push(current);
      current = " ";
      size = 1;
    }
    current += character;
    size += bytes;
  }
  return [...lines, current].join("\r\n");
}
export function eventCalendar(event, createdAt = Date.now() / 1000) {
  return (
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//HackIllinois Schedule//EN",
      "BEGIN:VEVENT",
      `UID:${escapeText(event.eventId)}@hackillinois-schedule`,
      `DTSTAMP:${timestamp(createdAt)}`,
      `DTSTART:${timestamp(event.startTime)}`,
      `DTEND:${timestamp(event.endTime)}`,
      `SUMMARY:${escapeText(event.name)}`,
      `DESCRIPTION:${escapeText(event.description)}`,
      `LOCATION:${escapeText(event.locations.map((location) => location.description).join(", "))}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ]
      .map(foldLine)
      .join("\r\n") + "\r\n"
  );
}
