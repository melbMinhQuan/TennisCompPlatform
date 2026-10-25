# Club Admin notifications

Route: `/club-admin/notifications` (US-22, Should). `ClubAdminNotificationsPage.tsx` renders one
`components/club-admin/ClubAdminNotificationRow.tsx` per notice. The notices are loaded once per
visit by `context/ClubAdminNotifications.tsx`, which wraps every club admin page: the
Notifications page, the sidebar badge and the dashboard's unread tile all read that one list, so
they always agree. "Mark as read" and "Mark all as read" are saved with the PATCH routes below,
and the list is then updated from the answer, so a reload shows the same state. A failed save
shows an error and leaves the notice unread. "View fixture ›" opens the fixture the notice is about.

There is no sample data. The seed has no notices for club administrators yet (gap 2 below), so a
seeded club admin sees "You're all caught up" (E2E-015); the page's behaviour with notices is
tested against a fake backend (I-UI-007).

## Backend API

Built in [`club-admin-notification.service.ts`](../../backend/src/club-admin/club-admin-notification.service.ts),
tests in [`club-admin-notification.test.cjs`](../../backend/test/club-admin-notification.test.cjs) (I-CLUBNOTE-*).
The frontend uses all three.

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
`MATCH_RESULT`. IDs are database UUIDs.

The unread count for the sidebar badge and the dashboard tile is the number of rows with
`readAt` null.

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
