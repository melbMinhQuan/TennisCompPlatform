# Database

What the database holds, how its tables connect, and which of its data is test data. For how to
connect to it, see [README → Database access](../README.md#database-access).

- **Engine.** PostgreSQL 16 on your computer (Docker, [docker-compose.yml](../docker-compose.yml)) and
  Azure Database for PostgreSQL Flexible Server on the live site (`tennis-db`).
- **Where it is defined.** [backend/prisma/schema.prisma](../backend/prisma/schema.prisma) describes
  every table. The database is only ever changed through the migrations in
  [backend/prisma/migrations/](../backend/prisma/migrations) (13 so far), and the live site
  applies new ones automatically when it starts.
- **Names.** 33 tables. In the database, tables and columns are snake_case (`club_membership.is_primary`).
  The backend code calls the same things by camelCase names (`ClubMembership.isPrimary`).
- **Keys.** Every table has a UUID `id` primary key. Players and clubs also have a short readable
  code (`PLR005`, `CLB01`), given automatically by a database trigger.
- **Common columns.** Most tables also have `created_at` and `updated_at`; the diagrams leave them out.
- **Data.** Everything in the database today is made-up test data. See
  [Data in the database](#data-in-the-database).

## Reading the diagrams

The diagrams are entity relationship diagrams (ERDs) in crow's foot notation. GitHub draws them
from the text; in VS Code, install a Mermaid preview extension.

| Symbol | Meaning |
| --- | --- |
| `\|\|` | exactly one |
| `o\|` | zero or one |
| `o{` | zero or more |
| solid line | a foreign key: the database refuses a row that points at nothing |
| dashed line | a column that holds another table's ID with no foreign key; the code keeps it right |

For example, `club ||--o{ team` reads "a club has zero or more teams; each team has exactly one club".

## Overview

The main tables and how they connect. The sections below cover every table.

```mermaid
erDiagram
    association ||--o{ club : "has"
    association ||--o{ competition : "runs"
    competition ||--o{ season : "has"
    season ||--o{ section_grade : "is split into"
    section_grade ||--o{ team : "contains"
    club ||--o{ team : "enters"
    team ||--o{ team_player : "squad"
    player ||--o{ team_player : "plays in"
    player ||--o{ club_membership : "member of"
    club ||--o{ club_membership : "has members"
    user |o--o| player : "profile"
    user ||--o| user_role : "holds"
    section_grade ||--o{ fixture : "schedules"
    team ||--o{ fixture : "plays home or away"
    fixture ||--o| match_result : "has result"
    match_result ||--o{ rubber : "is made of"
    rubber ||--o{ rubber_set : "has sets"
    rubber ||--o{ rubber_player : "played by"
    player ||--o{ rubber_player : "plays"
```

In words: an **association** (Waverley Tennis) has **clubs** and runs **competitions**. Each
competition has **seasons**, each season is split into **sections** (grades), and clubs enter
**teams** into sections. A team's squad is its **team players**. **Fixtures** are matches between
two teams in a section; a fixture's **match result** is made of **rubbers** (single singles or
doubles matches), each with its **sets** and the **players** who played it. A **user** is a login;
most logins have a **player** profile and one **role**.

## 1. Accounts and people

```mermaid
erDiagram
    user ||--o| user_role : "holds one role"
    user |o--o| player : "profile"
    user ||--o{ notification : "receives"
    player ||--o| utr_link : "UTR account"
    player |o--o{ player : "duplicate merged into"
    player ||..o{ profile_merge_request : "player_a_id, player_b_id"

    user {
        uuid id PK
        text email UK
        text password_hash "bcrypt hash, never the password"
        enum status "PENDING, ACTIVE, SUSPENDED"
        timestamp last_login_at
    }
    user_role {
        uuid id PK
        uuid user_id FK, UK
        enum role_type "ADMINISTRATOR, RECORDS_SECRETARY, CLUB_ADMIN, TEAM_MANAGER, PLAYER, PUBLIC"
        enum context_type "ASSOCIATION, CLUB, TEAM, COMPETITION, GLOBAL"
        uuid association_id "no FK"
        uuid club_id "no FK"
        uuid team_id "no FK"
        uuid competition_id "no FK"
        timestamp granted_at
        timestamp revoked_at
    }
    player {
        uuid id PK
        text code UK "e.g. PLR005"
        text first_name
        text last_name
        date date_of_birth
        enum gender "MALE, FEMALE, OTHER"
        text phone
        bool is_junior "under 18"
        text guardian_name
        text guardian_email
        text guardian_phone
        enum status "ACTIVE, INACTIVE, SUSPENDED"
        uuid user_id FK, UK
        uuid merge_into_id FK
    }
    utr_link {
        uuid id PK
        uuid player_id FK, UK
        text utr_account_id
        decimal utr_rating
        timestamp last_synced_at
    }
    profile_merge_request {
        uuid id PK
        uuid player_a_id "no FK"
        uuid player_b_id "no FK"
        uuid requesting_association_id "no FK"
        enum status "PENDING, APPROVED, REJECTED"
    }
    notification {
        uuid id PK
        uuid user_id FK
        enum type "MATCH_DATE_CHANGED, VENUE_CHANGED, RESULT_ENTERED ..."
        text title
        text message
        json details
        enum target_type "FIXTURE, RUBBER, MATCH_RESULT, COMPETITION"
        uuid target_id "no FK"
        enum channel "IN_APP, EMAIL"
        timestamp read_at "null = unread"
    }
    audit_log {
        uuid id PK
        text entity_type
        uuid entity_id "no FK"
        text action
        text change_summary
        text changed_by "no FK"
        timestamp changed_at
    }
```

| Table | What one row is |
| --- | --- |
| `user` | A login: email, bcrypt password hash and status. Only `ACTIVE` accounts can log in. |
| `user_role` | The single role a login holds, and where it applies: `CLUB_ADMIN` of a club, `TEAM_MANAGER` of a team, `ADMINISTRATOR` of an association, and so on. Setting `revoked_at` ends it. |
| `player` | A person's profile: name, date of birth, gender, phone and readable code. `is_junior` marks under-18s, who also have a parent or guardian contact. `user_id` links the profile to its login; a player a club adds has no login. |
| `utr_link` | The player's Universal Tennis Rating account and latest rating. |
| `profile_merge_request` | Two profiles that are probably one person registered twice, waiting for a decision. |
| `notification` | One message to one login, in the app or by email, with what it links to and when it was read. |
| `audit_log` | A record of an important change: what changed, who changed it and when. |

## 2. Associations, clubs and venues

```mermaid
erDiagram
    association ||--o{ club : "has"
    association ||--o{ association_membership : "has members"
    player ||--o{ association_membership : "belongs to"
    club ||--o{ club_membership : "has members"
    player ||--o{ club_membership : "belongs to"
    club |o--o{ venue : "owns"

    association {
        uuid id PK
        text name
        text email
        text phone
        text address
        enum status "ACTIVE, INACTIVE"
    }
    club {
        uuid id PK
        text code UK "e.g. CLB01"
        uuid association_id FK
        text name
        text address
        text email
        text phone
        enum status "ACTIVE, INACTIVE"
    }
    venue {
        uuid id PK
        text name
        text address
        text time_zone "e.g. Australia/Melbourne"
        int court_count
        uuid club_id FK "null for neutral courts"
        enum status
    }
    club_membership {
        uuid id PK
        uuid player_id FK
        uuid club_id FK
        bool is_primary
        date start_date
        date end_date
        enum status "ACTIVE, INACTIVE"
    }
    association_membership {
        uuid id PK
        uuid player_id FK
        uuid association_id FK
        bool is_primary
        enum status "ACTIVE, INACTIVE"
    }
```

| Table | What one row is |
| --- | --- |
| `association` | A tennis association, such as Waverley Tennis, with its contact details. |
| `club` | A club, which belongs to one association. |
| `venue` | Courts where fixtures are played, with their time zone and number of courts. Owned by a club, or by no one (neutral or hired courts). |
| `club_membership` | A player's membership of a club. One per player and club; `is_primary` marks the club that looks after the player's record. |
| `association_membership` | A player's membership of an association. One per player and association. |

## 3. Competitions, seasons and teams

```mermaid
erDiagram
    association ||--o{ competition : "runs"
    competition ||--o{ match_format : "match rules"
    competition ||--o{ eligibility_rule : "who may play"
    competition ||--o{ season : "has"
    season ||--o{ section_grade : "is split into"
    section_grade ||--o{ team : "contains"
    club ||--o{ team : "enters"
    venue |o--o{ team : "home courts"
    team ||--o{ team_player : "squad"
    player ||--o{ team_player : "plays in"

    competition {
        uuid id PK
        uuid association_id FK
        text name "e.g. Weekend Senior"
        text type
        enum status "ACTIVE, ARCHIVED"
    }
    match_format {
        uuid id PK
        uuid competition_id FK
        text name
        int rubber_count
        int singles_count
        int doubles_count
        text set_format
        int set_to_win
        text tiebreak_rule
        text match_tiebreak
        bool allow_draw
    }
    eligibility_rule {
        uuid id PK
        uuid competition_id FK
        text rule_type
        text scope
        int min_matches_played
        text grade_restriction
        text description
    }
    season {
        uuid id PK
        uuid competition_id FK
        int year
        text season_type "e.g. Summer"
        date start_date
        date end_date
        enum status "UPCOMING, ACTIVE, COMPLETED, ARCHIVED"
    }
    section_grade {
        uuid id PK
        uuid season_id FK
        text name
        enum gender
        text age_group
        int min_age
        int max_age
        int team_count
    }
    team {
        uuid id PK
        uuid club_id FK
        uuid section_id FK
        uuid season_id FK "copy of the section's season"
        uuid home_venue_id FK
        uuid contact_user_id "no FK"
        text name "unique within a season"
    }
    team_player {
        uuid id PK
        uuid team_id FK
        uuid player_id FK
        enum status "ACTIVE, EMERGENCY, INACTIVE"
        timestamp register_at
    }
```

| Table | What one row is |
| --- | --- |
| `competition` | A competition run by an association, such as Weekend Senior or Mid-Week Ladies. |
| `match_format` | The rules for matches in a competition: how many rubbers, singles and doubles, sets and tiebreaks. |
| `eligibility_rule` | A rule about who may play, such as the minimum matches needed to play in finals. |
| `season` | One season of a competition, with its dates and status. |
| `section_grade` | A section (grade or division) of a season, with its gender and age limits. |
| `team` | A club's team in one section. No two teams in a season share a name, ignoring capitals and spaces. |
| `team_player` | One player in a team's squad: a regular, an emergency or no longer active. One per team and player. |

## 4. Fixtures and results

```mermaid
erDiagram
    section_grade ||--o{ fixture : "schedules"
    team ||--o{ fixture : "home team"
    team ||--o{ fixture : "away team"
    venue |o--o{ fixture : "played at"
    fixture ||--o{ fixture_schedule_change : "rescheduled"
    venue |o--o{ fixture_schedule_change : "previous or new venue"
    fixture ||--o| match_result : "has result"
    match_result ||--o{ result_confirmation : "confirmed by"
    match_result ||--o{ correction_request : "corrections"
    match_result ||--o{ rubber : "is made of"
    match_format |o--o{ rubber : "format"
    rubber ||--o{ rubber_set : "has sets"
    rubber ||--o{ rubber_player : "played by"
    player ||--o{ rubber_player : "plays"

    fixture {
        uuid id PK
        uuid section_id FK
        uuid home_team_id FK
        uuid away_team_id FK
        uuid venue_id FK
        int round_number
        text round_label "e.g. Semi Final"
        date schedule_date
        time schedule_time
        enum status "SCHEDULED, COMPLETED, CANCELLED, POSTPONED"
        bool is_finals
    }
    fixture_schedule_change {
        uuid id PK
        uuid fixture_id FK
        enum change_type "DATE_TIME_CHANGED, VENUE_CHANGED, POSTPONED, CANCELLED"
        date previous_date
        date new_date
        uuid previous_venue_id FK
        uuid new_venue_id FK
        text reason
    }
    match_result {
        uuid id PK
        uuid fixture_id FK, UK
        int home_rubbers
        int away_rubbers
        enum status "DRAFT, PENDING_CONFIRMATION, FINALISED, UNDER_CORRECTION"
        text outcome
        text entered_by "no FK"
        text finalised_by "no FK"
    }
    result_confirmation {
        uuid id PK
        uuid match_result_id FK
        enum status "PENDING, CONFIRMED, DISPUTED"
        text dispute_reason
    }
    correction_request {
        uuid id PK
        uuid match_result_id FK
        text reason
        enum status "PENDING, APPROVED, REJECTED"
        text reviewed_notes
    }
    rubber {
        uuid id PK
        uuid match_result_id FK
        uuid match_format_id FK
        int rubber_number
        enum rubber_type "SINGLES, DOUBLES"
        enum winner_side "HOME, AWAY"
        enum outcome_type "COMPLETED, RETIRED, WALKOVER, FORFEIT, ABANDONED"
        timestamp played_at
    }
    rubber_set {
        uuid id PK
        uuid rubber_id FK
        int set_number "one per number"
        int home_games
        int away_games
        int home_tiebreak_points
        int away_tiebreak_points
    }
    rubber_player {
        uuid id PK
        uuid rubber_id FK
        uuid player_id FK
        enum side "HOME, AWAY"
        bool is_emergency
        int player_order
    }
```

| Table | What one row is |
| --- | --- |
| `fixture` | A match between two teams in a section: round, date, time, venue and status. |
| `fixture_schedule_change` | One reschedule or venue change of a fixture, keeping the old and new values. The club administrator's fixture list marks a fixture as changed when it has one. |
| `match_result` | A fixture's result: rubbers won by each side, and its status from draft to finalised. |
| `result_confirmation` | The other team confirming or disputing a result. |
| `correction_request` | A request to correct a result, and its review. |
| `rubber` | One singles or doubles match within a fixture. Its winner comes from the set scores, except after a retirement, walkover or forfeit, when `winner_side` records it. |
| `rubber_set` | One set of a rubber: games each side, plus tiebreak points for a 7-6 set. |
| `rubber_player` | A player who played a rubber, on which side, and whether as an emergency. |

## 5. Ladders, standings, ratings and awards

```mermaid
erDiagram
    section_grade ||--o{ ladder_entry : "team ladder"
    team ||--o{ ladder_entry : "ladder row"
    section_grade ||--o{ player_standing : "player standings"
    player ||--o{ player_standing : "standing"
    player ||--o{ utr_rating_snapshot : "rating history"
    association |o--o{ ranking_cohort : "ranking group"
    ranking_cohort ||--o{ ranking_entry : "positions"
    player ||--o{ ranking_entry : "is ranked"
    player ||--o{ player_award : "wins"
    competition |o--o{ player_award : "won in"
    season |o--o{ player_award : "won in"
    team |o--o{ player_award : "won with"

    ladder_entry {
        uuid id PK
        uuid section_id FK
        uuid team_id FK
        int position
        int played
        int won
        int lost
        int drawn
        int points
        timestamp calculated_at
    }
    player_standing {
        uuid id PK
        uuid section_id FK
        uuid player_id FK
        int position
        int rubbers_won
        int rubbers_lost
        decimal win_percentage
        timestamp calculated_at
    }
    utr_rating_snapshot {
        uuid id PK
        uuid player_id FK
        enum discipline "SINGLES, DOUBLES"
        decimal rating
        timestamp recorded_at
        text source
    }
    ranking_cohort {
        uuid id PK
        text name
        uuid association_id FK "null = everyone"
        enum discipline
    }
    ranking_entry {
        uuid id PK
        uuid cohort_id FK
        uuid player_id FK
        int rank
        decimal rating
        decimal percentile_rank "0 to 100"
        timestamp as_of
    }
    player_award {
        uuid id PK
        uuid player_id FK
        enum award_type "COMPETITION_WINNER, SECTION_WINNER, RUNNER_UP, OTHER"
        text title
        uuid competition_id FK
        uuid season_id FK
        uuid team_id FK
        date awarded_on
    }
```

| Table | What one row is |
| --- | --- |
| `ladder_entry` | One team's row in its section's ladder: played, won, lost, drawn, rubbers, sets, games and points. One per section and team. |
| `player_standing` | One player's individual record in a section, counted from finalised rubbers. One per section and player. |
| `utr_rating_snapshot` | One dated UTR rating of a player, singles or doubles. The platform stores ratings; it does not calculate them. |
| `ranking_cohort` | A group of players compared with each other, such as one association's singles players. |
| `ranking_entry` | A player's dated rank and percentile within one ranking group. |
| `player_award` | A title or award a player won, alone or with a team. |

## Columns that are not foreign keys

These columns point at other rows, but the database does not check them (the dashed lines above):

- `user_role.association_id`, `club_id`, `team_id` and `competition_id`: where the role applies.
- `profile_merge_request.player_a_id`, `player_b_id` and `requesting_association_id`.
- `notification.target_id`: a fixture, rubber, match result or competition, as `target_type` says.
- `audit_log.entity_id`: the row that changed, in the table `entity_type` names.
- `team.contact_user_id`: not used yet.
- Columns ending in `_by` record who did something. Most hold the person's player ID;
  `match_result.entered_by`, `match_result.finalised_by` and `fixture_schedule_change.changed_by`
  hold their readable code instead (for example `PLR006`). `audit_log.changed_by` holds a club
  administrator's login ID for changes made in the app.

## Data in the database

### Everything is test data

All of it comes from one spreadsheet, [backend/prisma/competition_data.xlsx](../backend/prisma/competition_data.xlsx),
which `backend/prisma/generate-competition-data.js` writes and `npm run seed:competition` loads.
It has one sheet per table, and its `README` sheet explains the rules it follows. The live database
was filled from the same workbook. So both databases hold made-up people and contact details; only
the competition rules and match formats come from a real source, the Waverley Tennis competition
match formats document.

- Every email address uses a reserved `.example` domain (`players.example`, `admin.example`,
  `juniors.example`, `families.example`), so no message can reach a real person.
- Phone numbers, dates of birth, ratings and addresses are made up.
- All 124 logins share the password `WaverleyDev#2026`; the workbook stores only its bcrypt hash.
- Two names, Hiro Mitchell and Amelia Lee, each belong to two different people on purpose, to test
  that look-alikes are never mixed up.
- Ten juniors (under 18) play in Weekend Junior's coming season, each with a parent or guardian on
  record. Who may see their details is in [junior-privacy.md](junior-privacy.md).

| Area | Rows in the workbook |
| --- | --- |
| Accounts and people | `user` 124, `user_role` 124, `player` 124, `utr_link` 100, `profile_merge_request` 1, `notification` 264, `audit_log` 479 |
| Associations, clubs and venues | `association` 2, `club` 12, `venue` 13, `club_membership` 257, `association_membership` 160 |
| Competitions, seasons and teams | `competition` 5, `match_format` 13, `eligibility_rule` 11, `season` 6, `section_grade` 9, `team` 43, `team_player` 250 |
| Fixtures and results | `fixture` 292, `fixture_schedule_change` 7, `match_result` 274, `result_confirmation` 274, `correction_request` 111, `rubber` 822, `rubber_set` 1,685, `rubber_player` 2,192 |
| Ladders, standings, ratings and awards | `ladder_entry` 40, `player_standing` 245, `utr_rating_snapshot` 800, `ranking_cohort` 2, `ranking_entry` 200, `player_award` 36 |
| **Total** | **8,977** |

The 124 logins are 92 players, 18 team managers, 12 club administrators (one per club), one
association administrator and one records secretary. [README → Test accounts](../README.md#test-accounts)
lists the ones to try.

### What the app changes

Only the club administrator pages write to the database: entering a team, choosing its squad and
manager, registering a player, adding a player to the club and marking notifications as read. They
change `team`, `team_player`, `user_role`, `player`, `club_membership` and `notification`, and
every change except marking notifications as read is also recorded in `audit_log`. The only other writer is
`npm run players:duplicates -- --create-requests`, which adds `profile_merge_request` rows. Every
other table is read-only in the app today: fixtures, results, ladders, standings, rankings and
awards come only from the workbook, because no page enters results yet.

So after people have used a database, it can differ from the workbook in those tables.
`npm run seed:competition -- --sync` (in `backend/`) makes it match the workbook again; run it with
`--dry-run` first to see what it would change.

### Personal information

The database can hold these personal details: names, dates of birth, gender, phone numbers, login
emails, password hashes (never passwords), and juniors' parent or guardian names, emails and phone
numbers. Who may see a junior's details is set out in [junior-privacy.md](junior-privacy.md).
Until real authentication exists, the live site must hold test data only
([deployment.md → Security](deployment.md#security)).

### Starting with real data

1. Create an empty database and run `npx prisma migrate deploy` in `backend/`. This makes the
   tables; it adds no data.
2. Load the real associations, clubs, competitions, players and logins. The seed always reads
   `backend/prisma/competition_data.xlsx`, so the simplest way is to put a workbook of real data in
   the same layout there, on the computer that runs the seed only. **Never commit it**: the
   repository is public. Logins can only be created this way today, because the app has no sign-up
   page.
3. Never load the test workbook into a database with real people in it: `--sync` deletes rows the
   workbook does not have.
