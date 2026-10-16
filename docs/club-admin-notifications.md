# Club Admin notifications: display-only Sprint 2 implementation

Route: `/club-admin/notifications` (US-22, Should). `ClubAdminNotificationsPage.tsx` loads the sample through `api/club-admin-notifications.ts` and renders one `components/club-admin/ClubAdminNotificationRow.tsx` per notice. No live API calls are made. "Mark as read" and "Mark all as read" update a shared in-memory read state (`data/club-admin-notification-reads.ts`) and reset on reload.

The sidebar badge and the dashboard's unread tile read the same state (`useClubAdminUnreadCount`), so all three update together.

## Sample data

`data/mock-club-admin-notifications.ts` holds five unread notices:

1. Four IN_APP notices from `backend/prisma/competition_data.xlsx` for fixtures involving Glen Waverley Tennis Club (CLB01): Match Reminder (Round 13), Venue Changed (Round 14), Match Postponed (Round 12) and Match Date Changed (Round 13). Type, details, fixture and date match the workbook. Titles and messages are reworded for the club administrator, because the workbook's text is written for a player.
2. One sample COMPETITION_UPDATE ("Summer 2026/27 Team Entries Open"). The workbook has no rows of this type yet.

## Backend API

Built in [`club-admin-notification.service.ts`](../backend/src/club-admin/club-admin-notification.service.ts),
tests in [`club-admin-notification.test.cjs`](../backend/test/club-admin-notification.test.cjs) (I-CLUBNOTE-*).
The frontend still uses the sample and the in-memory read state; connect it to these.

| Method | Endpoint | Notes |
| --- | --- | --- |
| GET | `/api/v1/club-admin/notifications` | `{ data: ClubAdminNotification[] }`, newest first. The admin's own IN_APP rows only; EMAIL rows are the same events sent by mail and are never listed. Not paged. |
| PATCH | `/api/v1/club-admin/notifications/:id/read` | Sets `readAt` and answers `{ data: ClubAdminNotification }`. A notice that is already read keeps its first read time. Someone else's notice, an EMAIL row or an unknown ID is 404 `NOTIFICATION_NOT_FOUND`; a non-UUID ID is 400. |
| PATCH | `/api/v1/club-admin/notifications/read-all` | For "Mark all as read". Marks every unread IN_APP notice and answers `{ data: { updated } }`. |

The admin is identified as on the other club admin routes (`?email=` for the local demo, a
CLUB_ADMIN role required, otherwise 403 `NOT_CLUB_ADMIN`). A database failure is a 503
`DATA_UNAVAILABLE`.

The response matches the `ClubAdminNotification` type in `api/club-admin-notifications.ts`.
`match` is built from `targetType`/`targetId` → `Fixture` → home and away `Team`: "Round 13 ·
Syndal A vs Glen Waverley A", or the round label for finals ("Grand Final · …"). It is null for
other targets, or when the fixture no longer exists. `targetType` can also be `RUBBER` or
`MATCH_RESULT`, which the frontend type does not list yet. IDs are database UUIDs, not the
sample's `GW-REMINDER-R13`.

The frontend can then drop the in-memory read state: after a PATCH, update the row from the
response. The unread count for the sidebar badge and the dashboard tile is the number of rows
with `readAt` null.

## Database gaps to discuss

1. **Club context (settled):** a user holds exactly one role, so every notice sent to a club
   admin's account is a club admin notice and needs no `clubId`. An admin's own player notices
   cannot arise. A general club notice, such as entries opening, is one row per club admin.
2. **No notices for club admins in the seed:** `generate-competition-data.js` only writes
   notices for players on the two teams' rosters, so a seeded club admin sees an empty page. Add
   rows for club admins (and DRAW_RELEASED / COMPETITION_UPDATE rows) to demonstrate it with
   real data.
3. **Title wording:** the seed uses "Start Venue Changed". The page shows "Venue Changed".
4. **Who receives fixture notices:** decide whether date and venue changes also create a row
   for the club administrators of both clubs, or only for players and team managers. Nothing
   creates notices at runtime yet; they only come from the seed.
