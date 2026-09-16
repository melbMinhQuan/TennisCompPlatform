# Dashboard: current data and missing data

Based on `backend/prisma/schema.prisma` and `backend/prisma/seed.ts`.
This is a schema review, not confirmation that the database contains these records.
The frontend contract is in [dashboardapi.md](dashboardapi.md).

## What is missing first

| Screen requirement | What exists now | What must be added or decided |
| --- | --- | --- |
| Profile photograph | Player name/contact/status fields | `Player.avatarUrl` and an image upload/storage process |
| Users linked to profiles | Optional `Player.userId` relationship | Seed/import actual Player rows and link them to User rows. The current seed creates only users. Birth date and gender are required by the schema but absent from the spreadsheet; do not invent them. |
| Singles/doubles UTR | One `UtrLink.utrRating` per player | Discipline on ratings; the existing value cannot automatically be called singles UTR |
| UTR history and three score tiles | Only the current rating and last sync time | Rating snapshots with player, discipline, rating, recorded time, source, and optional percentile/cohort |
| “Advanced” label | No classification | Agree category thresholds and source. Return `null` until defined. |
| Percentile bar / “Top 12%” | No comparison population or rank history | Define the comparison group and dated ranking snapshots. A rating of 7.85 does not establish percentile 78.5 or 88. |
| Notifications and header indicator | An audit log with free-text summaries | Recipient-specific notifications: type, payload, target, created time, read time; event/reminder generation |
| Venue and time zone | Club address; fixture date and time | Fixture venue reference or venue name/address, plus an IANA time zone. A home club is not guaranteed to be the actual venue. |
| “Rescheduled” and old/new dates | Fixture status is only SCHEDULED / COMPLETED / CANCELLED | Schedule-change records with previous/new date, time and venue; reschedule flag or timestamp; optional POSTPONED status |
| “Men’s singles — Round of 32”, draws | Competition, season, grade, numbered team fixture, singles/doubles rubber | Individual event, entries, draw/round and scheduled match structure. Numeric fixture round 5 is not “Round of 32”. |
| Confirmed upcoming individual opponents | Team rosters; RubberPlayer attached to a result’s rubber | Pre-match lineups/individual scheduling. Team membership alone does not prove the player will compete. |
| Complete result interpretation | Set game totals, rubber participants, fixture-level outcome string, incomplete reason | Explicit individual winner/outcome, actual played time, and tie-break point fields for complete results including retirements/walkovers |
| Career titles | No award or champion records | Player/team awards with competition, season, event, winner and date; agree which titles count |
| Best UTR rank and Rankings page | Current rating only | Cohort-based ranking history. Current ratings can be sorted for a local leaderboard, but that is not an official UTR ranking. |
| Messages and message badge | No conversations/messages | Conversation members, messages, read markers and sender/recipient authorization |
| Settings | No player preferences | User preferences for time zone and notifications; separately define editable profile fields |

## What can be read or calculated now

- Profile: `Player` name, status, date of birth, gender, email and phone.
  Age is calculated from birth date, not stored.
- Clubs/association: active `ClubMembership` and `AssociationMembership`, using
  `isPrimary` for the primary entries. If none is primary, return `null`.
  If multiple are primary, use earliest `createdAt`, then ID, until data is fixed.
- Teams: active `TeamPlayer` relationships, with `Team`, `Club`, and `SectionGrade`.
- Current rating: `UtrLink.utrRating` and `lastSyncedAt` (discipline unknown).
- Upcoming team fixtures: active team membership → home/away `Fixture` →
  section → season → competition. Label them **team fixtures**, not confirmed
  individual matches.
- Recent personal results: `RubberPlayer` → `Rubber` → `MatchResult` → `Fixture`;
  use only FINALISED results. Opponents are the participants on the other side.
- Match count: count the player's finalised individual rubbers, not every fixture
  their team played. Win/loss can be calculated for complete, unambiguous scores
  using `MatchFormat`; return unknown for unsupported/incomplete outcomes.
- Competitions, clubs, teams, fixtures and basic event-name search can use existing
  relationships; their API routes still need implementation.
- Brand image, navigation labels, icons, date formatting and static Help content
  are frontend resources and do not need database tables.

## Decisions used in the proposed API

1. The three “Single UTR Score” tiles mean the **latest three singles rating
   snapshots**, newest first. This is an assumption: the mockup does not explain
   them. Change their meaning before implementation if they represent something else.
2. The bar labelled “Percentile rank” uses **0–100%**. The mockup's 1/5/10 ticks
   are rating ticks and must not be used as percentile ticks. Rating and percentile
   are separate fields; no arbitrary UTR scale is assumed.
3. Career results count individual singles and doubles rubbers/matches once per
   player. Team fixture wins do not count as the player's wins.
4. “UTR Best Rank” means best observed percentile in the selected cohort and
   discipline. With percentile 88, display “Top 12%”. Display the cohort beside it;
   do not compare different populations as one all-time rank.
5. The header speech bubble opens Messages; its red dot reflects unread messages.
   Notifications have their own card and unread count.

## Practical order

1. Link real users to real player profiles and expose existing data.
2. Add venues/schedule changes, rating snapshots, and notifications.
3. Add explicit individual outcomes/awards and cohort-based rankings.
4. Add individual tournament draws, messaging and preferences when those features
   enter scope. Until then expose their unavailable state, not invented records.

The existing login returns only success/failure. Keep it unchanged for this work.
Email lookup can support a local demo, but it does not authenticate the dashboard
caller. Private messages/settings and read-state writes need a trusted caller
identity before being enabled on a shared deployment.
