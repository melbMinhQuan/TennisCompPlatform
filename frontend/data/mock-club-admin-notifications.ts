import type { ClubAdminNotification } from "../api/club-admin-notifications";

// Hardcoded until the club admin notifications API exists (see docs/club-admin-notifications.md).
// The first four are the IN_APP notices in competition_data.xlsx for fixtures involving
// Glen Waverley Tennis Club (CLB01): same type, details, fixture and date, all unread.
// Titles and messages are written for the club administrator (the workbook's are written for a
// player, e.g. "Your Syndal A match…"), and "Start Venue Changed" is shown as "Venue Changed".
// The last notice is a sample: the workbook has the upcoming Summer 2026/27 season (SEA05) but no
// COMPETITION_UPDATE rows yet.
export const mockClubAdminNotifications: ClubAdminNotification[] = [
  {
    id: "SAMPLE-ENTRIES-OPEN",
    type: "COMPETITION_UPDATE",
    title: "Summer 2026/27 Team Entries Open",
    message: "Weekend Senior Summer 2026/27 starts on 31 October. Sections 1 and 2 have places for new teams.",
    match: null,
    details: null,
    targetType: "COMPETITION",
    targetId: "COMP01",
    readAt: null,
    createdAt: "2026-10-12T22:00:00Z",
  },
  {
    id: "GW-REMINDER-R13",
    type: "MATCH_REMINDER",
    title: "Match Reminder",
    message: "Glen Waverley A play Syndal A this weekend.",
    match: "Round 13 · Syndal A vs Glen Waverley A",
    details: { scheduledDate: "2026-09-27", scheduledTime: "13:00", venue: "Syndal Tennis Centre", timeZone: "Australia/Melbourne" },
    targetType: "FIXTURE",
    targetId: "R13-SYNA-GWA",
    readAt: null,
    createdAt: "2026-09-20T22:00:00Z",
  },
  {
    id: "GW-VENUE-R14",
    type: "VENUE_CHANGED",
    title: "Venue Changed",
    message: "Glen Waverley A’s match against Mount Waverley A has moved to a different venue.",
    match: "Round 14 · Mount Waverley A vs Glen Waverley A",
    details: { previousVenue: "Mount Waverley Tennis Centre", newVenue: "Waverley Tennis Regional Centre", timeZone: "Australia/Melbourne" },
    targetType: "FIXTURE",
    targetId: "R14-MWA-GWA",
    readAt: null,
    createdAt: "2026-09-19T06:40:00Z",
  },
  {
    id: "GW-POSTPONED-R12",
    type: "MATCH_DATE_CHANGED",
    title: "Match Postponed",
    message: "Glen Waverley A’s match against Pinewood A has been postponed. A new date will be confirmed.",
    match: "Round 12 · Pinewood A vs Glen Waverley A",
    details: { previousDate: "2026-09-19", previousTime: "13:00", newDate: null, newTime: null, timeZone: "Australia/Melbourne" },
    targetType: "FIXTURE",
    targetId: "R12-PWA-GWA",
    readAt: null,
    createdAt: "2026-09-19T03:20:00Z",
  },
  {
    id: "GW-DATE-R13",
    type: "MATCH_DATE_CHANGED",
    title: "Match Date Changed",
    message: "Glen Waverley A’s match against Syndal A has been rescheduled.",
    match: "Round 13 · Syndal A vs Glen Waverley A",
    details: { previousDate: "2026-09-26", previousTime: "13:00", newDate: "2026-09-27", newTime: "13:00", timeZone: "Australia/Melbourne" },
    targetType: "FIXTURE",
    targetId: "R13-SYNA-GWA",
    readAt: null,
    createdAt: "2026-09-17T23:15:00Z",
  },
];
