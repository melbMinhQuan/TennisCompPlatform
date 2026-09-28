import type { NotificationItem } from "../api/dashboard";

// Shown on the Profile page when no one is logged in: Chloe Cooper's (PLR005) three in-app
// notifications from competition_data.xlsx, newest first. Targets point at workbook codes,
// so they are informational only here.
export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "SAMPLE-NOTIFICATION-3",
    type: "MATCH_REMINDER",
    title: "Match Reminder",
    message: "Mount Waverley A play on 2026-09-27 at 13:00.",
    createdAt: "2026-09-20T22:00:00.000Z",
    readAt: null,
    details: { timeZone: "Australia/Melbourne", scheduledDate: "2026-09-27", scheduledTime: "13:00" },
    target: null,
  },
  {
    id: "SAMPLE-NOTIFICATION-2",
    type: "VENUE_CHANGED",
    title: "Start Venue Changed",
    message: "Your Mount Waverley A match has moved to a different venue.",
    createdAt: "2026-09-19T06:40:00.000Z",
    readAt: null,
    details: { previousVenue: "Mount Waverley Tennis Centre", newVenue: "Waverley Tennis Regional Centre", timeZone: "Australia/Melbourne" },
    target: null,
  },
  {
    id: "SAMPLE-NOTIFICATION-1",
    type: "MATCH_DATE_CHANGED",
    title: "Match Date Changed",
    message: "Your Mount Waverley A match has been rescheduled.",
    createdAt: "2026-09-17T23:15:00.000Z",
    readAt: null,
    details: { previousDate: "2026-09-26", newDate: "2026-09-27", previousTime: "13:00", newTime: "13:00", timeZone: "Australia/Melbourne" },
    target: null,
  },
];
