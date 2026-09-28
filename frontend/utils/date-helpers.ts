// Dates arrive as YYYY-MM-DD and times as HH:mm (local to the venue), the same as the API.
// Formatting happens here so the data stays in its raw form.
// Fixed 3-letter names: the en-AU locale would give "SEPT" and "JUNE".
const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

export function dateParts(date: string | null) {
  if (!date) return { weekday: "", day: "—", month: "TBC" };
  const [year, month, day] = date.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return { weekday: WEEKDAYS[weekday], day: String(day), month: MONTHS[month - 1], year: String(year) };
}

/** "SUN 27 SEP", or "Date to be confirmed" for a postponed fixture. */
export function formatFixtureDate(date: string | null) {
  if (!date) return "Date to be confirmed";
  const { weekday, day, month } = dateParts(date);
  return `${weekday} ${day.padStart(2, "0")} ${month}`;
}

/** "29 AUG 2026" */
export function formatResultDate(date: string) {
  const { day, month, year } = dateParts(date);
  return `${day.padStart(2, "0")} ${month} ${year}`;
}

/** "1:00 PM", or "Time to be confirmed". */
export function formatTime(time: string | null) {
  if (!time) return "Time to be confirmed";
  const [hours, minutes] = time.split(":").map(Number);
  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${hours < 12 ? "AM" : "PM"}`;
}
