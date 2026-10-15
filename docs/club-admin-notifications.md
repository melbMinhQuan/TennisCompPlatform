# Club Admin notifications: display-only Sprint 2 implementation

Route: `/club-admin/notifications` (US-22, Should). `ClubAdminNotificationsPage.tsx` loads the sample through `api/club-admin-notifications.ts` and renders one `components/club-admin/ClubAdminNotificationRow.tsx` per notice. No live API calls are made. "Mark as read" and "Mark all as read" update a shared in-memory read state (`data/club-admin-notification-reads.ts`) and reset on reload.

The sidebar badge and the dashboard's unread tile read the same state (`useClubAdminUnreadCount`), so all three update together.

## Sample data

`data/mock-club-admin-notifications.ts` holds five unread notices:

1. Four IN_APP notices from `backend/prisma/competition_data.xlsx` for fixtures involving Glen Waverley Tennis Club (CLB01): Match Reminder (Round 13), Venue Changed (Round 14), Match Postponed (Round 12) and Match Date Changed (Round 13). Type, details, fixture and date match the workbook. Titles and messages are reworded for the club administrator, because the workbook's text is written for a player.
2. One sample COMPETITION_UPDATE ("Summer 2026/27 Team Entries Open"). The workbook has no rows of this type yet.

## Planned API (for the API team)

| Method | Endpoint | Notes |
| --- | --- | --- |
| GET | `/api/v1/club-admin/notifications` | Returns `{ data: ClubAdminNotification[] }`, newest first. IN_APP rows only, for the signed in admin's own club. |
| PATCH | `/api/v1/club-admin/notifications/:id/read` | Sets `readAt`. Only the recipient may mark a notice as read. |

The response shape is the `ClubAdminNotification` type in `api/club-admin-notifications.ts`. `match` ("Round 13 · Syndal A vs Glen Waverley A") is built on the server from `targetType`/`targetId` → `Fixture` → home and away `Team`. On an error the page shows the error state and never falls back to the sample.

## Database gaps to discuss

1. **Club context:** `Notification` is per user with no `clubId`. Fixture notices can be scoped through the fixture's home and away clubs, but general club notices (for example entries opening) need a nullable `clubId` or a recipient context. Do not show the admin's own player notices on the club page.
2. **Missing types in the seed:** there are no DRAW_RELEASED or COMPETITION_UPDATE rows. Add a few to the workbook so the page can be demonstrated with real data.
3. **Title wording:** the seed uses "Start Venue Changed". The page shows "Venue Changed".
4. **Who receives fixture notices:** decide whether date and venue changes create a row for the club administrators of both clubs, or only for players and team managers.
