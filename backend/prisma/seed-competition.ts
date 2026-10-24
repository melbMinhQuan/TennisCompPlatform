/**
 * Seeds the local database from prisma/competition_data.xlsx.
 *
 * Each developer runs this against their own local database - nothing here is
 * shared or remote. Until you run it, every table except `user` is empty.
 *
 *   From the repository root:
 *     npm run seed:competition --workspace=backend            # fill the database
 *     npm run seed:competition --workspace=backend -- --dry-run # report only, write nothing
 *     npm run seed:competition --workspace=backend -- --sync    # make the database match the workbook
 *
 *   Prerequisites:
 *     docker compose up -d                 (in backend/, starts postgres)
 *     npx prisma migrate deploy            (in backend/, creates the tables)
 *
 * Safe to run more than once. Row ids are derived from the spreadsheet codes,
 * so a second run inserts nothing new rather than creating duplicates. It only
 * ever inserts: no row is updated or deleted, so hand-edited records survive.
 * The one exception is a club or player seeded before the `code` column
 * existed: its empty code is filled in, and nothing else on the row changes.
 *
 * That insert-only contract holds while the workbook only grows. It does NOT
 * hold after `npm run data:generate`, which renumbers the sequential codes: a
 * row inserted in the middle shifts every later code onto different data, and
 * a plain run then silently skips the shifted rows and leaves the stale ones
 * behind. Use `--sync` after regenerating. It updates rows whose contents
 * changed and deletes rows the workbook no longer defines, so the database
 * ends up matching the workbook exactly - which also means hand-edited and
 * hand-added rows do not survive it.
 *
 * The workbook carries its own login accounts, so this is the only seed needed.
 * Every account uses the development password documented on the README sheet,
 * and every address is on a reserved .example domain - no real mailbox, and no
 * real person's contact details, reach a development database.
 */
import { Prisma, PrismaClient } from '@prisma/client'
import { createHash } from 'node:crypto'
import * as path from 'node:path'
import * as XLSX from 'xlsx'

const WORKBOOK = path.resolve(__dirname, 'competition_data.xlsx')
const NAMESPACE = 'tenniscomp:competition-data:v1'

/** Stable UUID per spreadsheet code, so reruns reuse the same rows. */
function uuidFor(code: string): string {
  const hex = createHash('sha256').update(`${NAMESPACE}:${code}`).digest('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-8${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`
}

type Row = Record<string, string | number | boolean>

/** A blank cell means NULL, never an empty string. */
const nul = (value: unknown) => (value === '' || value === undefined || value === null ? null : value)
const str = (value: unknown) => (nul(value) === null ? null : String(value))
const int = (value: unknown) => (nul(value) === null ? null : Number(value))
const bool = (value: unknown) => value === true || value === 'true' || value === 1
/** Calendar date (@db.Date) - kept at UTC midnight so the day never shifts. */
const date = (value: unknown) => (nul(value) === null ? null : new Date(`${value}T00:00:00Z`))
/** Local clock time (@db.Time), stored on the epoch date Prisma expects. */
const time = (value: unknown) => (nul(value) === null ? null : new Date(`1970-01-01T${value}:00Z`))
const ts = (value: unknown) => (nul(value) === null ? null : new Date(String(value)))
/** Foreign key: spreadsheet code -> UUID. */
const ref = (value: unknown) => (nul(value) === null ? null : uuidFor(String(value)))

function readSheets(file: string): Record<string, Row[]> {
  const book = XLSX.readFile(file)
  const sheets: Record<string, Row[]> = {}
  for (const name of book.SheetNames) {
    sheets[name] = XLSX.utils.sheet_to_json<Row>(book.Sheets[name], { defval: '' })
  }
  return sheets
}

/** Login email -> user UUID, because the workbook cannot know the UUIDs. */
type Users = Map<string, string>
type Built = Record<string, unknown> & { id: string }

/**
 * One table each, in foreign-key order: parents first. Inserts and updates walk
 * this order, deletes walk it backwards so children go before their parents.
 */
interface Table {
  name: string
  /**
   * True when rows here can come from somewhere other than this workbook, so a
   * sync must never delete what it does not recognise. `user` is the only one:
   * the login seed writes accounts this workbook knows nothing about.
   */
  shared?: boolean
  /**
   * True when the table has a DEFERRABLE unique constraint. Postgres refuses
   * ON CONFLICT (what skipDuplicates sends) against one, so a plain seed has to
   * look up which ids already exist and insert only the rest.
   */
  deferredUnique?: boolean
  /**
   * A column under an immediately checked unique index. When a sync finds a row
   * whose value here changed, it deletes that row before writing anything and
   * then inserts it afresh: updating in place could briefly give two rows the
   * same value and fail the index. `userRole.userId` is one; its role codes were
   * once a running count, so a database seeded then has rows on the wrong user.
   */
  uniqueOwner?: string
  /**
   * True when the table stores the workbook's readable ID in `code`, beside the
   * UUID derived from it. Rows seeded before that column existed have it empty,
   * and a plain seed fills it in: the only write it makes to an existing row.
   */
  coded?: boolean
  of: (tx: Prisma.TransactionClient) => {
    createMany(args: unknown): Promise<{ count: number }>
    deleteMany(args: unknown): Promise<{ count: number }>
    findMany(args?: unknown): Promise<Record<string, unknown>[]>
    update(args: unknown): Promise<unknown>
    upsert(args: unknown): Promise<unknown>
  }
  rows: (sheets: Record<string, Row[]>, users: Users) => Built[]
}

const TABLES: Table[] = [
  { name: 'user', shared: true, of: tx => tx.user as never, rows: sheets => sheets.User.map(user => ({
      id: uuidFor(String(user.id)), email: String(user.email), passwordHash: String(user.password_hash),
      status: String(user.status) as never, lastLoginAt: ts(user.last_login_at),
    })) },

  { name: 'association', of: tx => tx.association as never, rows: sheets => sheets.Association.map(association => ({
      id: uuidFor(String(association.id)), name: String(association.name), email: str(association.email), address: str(association.address),
      phone: str(association.phone), status: String(association.status) as never,
    })) },

  { name: 'club', coded: true, of: tx => tx.club as never, rows: sheets => sheets.Club.map(club => ({
      id: uuidFor(String(club.id)), code: String(club.id), associationId: ref(club.association_id)!, name: String(club.name),
      address: str(club.address), email: str(club.email), phone: str(club.phone), status: String(club.status) as never,
    })) },

  { name: 'venue', of: tx => tx.venue as never, rows: sheets => sheets.Venue.map(venue => ({
      id: uuidFor(String(venue.id)), clubId: ref(venue.club_id), name: String(venue.name), address: str(venue.address),
      timeZone: String(venue.time_zone), courtCount: int(venue.court_count), status: String(venue.status) as never,
    })) },

  { name: 'competition', of: tx => tx.competition as never, rows: sheets => sheets.Competition.map(competition => ({
      id: uuidFor(String(competition.id)), associationId: ref(competition.association_id)!, name: String(competition.name),
      type: str(competition.type), status: String(competition.status) as never,
    })) },

  { name: 'matchFormat', of: tx => tx.matchFormat as never, rows: sheets => sheets.MatchFormat.map(matchFormat => ({
      id: uuidFor(String(matchFormat.id)), competitionId: ref(matchFormat.competition_id)!, name: String(matchFormat.name),
      rubberCount: int(matchFormat.rubber_count), setFormat: str(matchFormat.set_format), setToWin: int(matchFormat.set_to_win),
      tiebreakRule: str(matchFormat.tiebreak_rule), matchTiebreak: str(matchFormat.match_tiebreak),
      winnerDeterminedBy: str(matchFormat.winner_determined_by), allowDraw: bool(matchFormat.allow_draw),
      singlesCount: int(matchFormat.singles_count), doublesCount: int(matchFormat.doubles_count),
    })) },

  { name: 'eligibilityRule', of: tx => tx.eligibilityRule as never, rows: sheets => sheets.EligibilityRule.map(eligibilityRule => ({
      id: uuidFor(String(eligibilityRule.id)), competitionId: ref(eligibilityRule.competition_id)!, ruleType: String(eligibilityRule.rule_type),
      scope: str(eligibilityRule.scope), minMatchesPlayed: int(eligibilityRule.min_matches_played),
      gradeRestriction: str(eligibilityRule.grade_restriction), description: str(eligibilityRule.description),
    })) },

  { name: 'season', of: tx => tx.season as never, rows: sheets => sheets.Season.map(season => ({
      id: uuidFor(String(season.id)), competitionId: ref(season.competition_id)!, year: int(season.year),
      seasonType: str(season.season_type), startDate: date(season.start_date), endDate: date(season.end_date),
      status: String(season.status) as never,
    })) },

  { name: 'sectionGrade', of: tx => tx.sectionGrade as never, rows: sheets => sheets.SectionGrade.map(sectionGrade => ({
      id: uuidFor(String(sectionGrade.id)), seasonId: ref(sectionGrade.season_id)!, name: String(sectionGrade.name),
      gender: (str(sectionGrade.gender) ?? undefined) as never, ageGroup: str(sectionGrade.age_group),
      minAge: int(sectionGrade.min_age), maxAge: int(sectionGrade.max_age), teamCount: int(sectionGrade.team_count),
    })) },

  // The workbook has no season column on Team: the season is the section's.
  { name: 'team', of: tx => tx.team as never, rows: sheets => {
    const seasonOf = new Map(sheets.SectionGrade.map(sectionGrade => [String(sectionGrade.id), String(sectionGrade.season_id)]))
    return sheets.Team.map(team => ({
      id: uuidFor(String(team.id)), clubId: ref(team.club_id)!, sectionId: ref(team.section_id)!,
      seasonId: ref(seasonOf.get(String(team.section_id)))!,
      homeVenueId: ref(team.home_venue_id), name: String(team.name),
    }))
  } },

  { name: 'player', coded: true, of: tx => tx.player as never, rows: (sheets, users) => sheets.Player.map(player => ({
      id: uuidFor(String(player.id)), code: String(player.id),
      userId: users.get(String(player._lookup_user_email)) ?? null,
      firstName: String(player.first_name), lastName: String(player.last_name),
      dateOfBirth: date(player.date_of_birth)!, gender: String(player.gender) as never,
      phone: str(player.phone), avatarUrl: str(player.avatar_url),
      isJunior: bool(player.is_junior), status: String(player.status) as never,
      guardianName: str(player.guardian_name), guardianEmail: str(player.guardian_email), guardianPhone: str(player.guardian_phone),
    })) },

  { name: 'clubMembership', of: tx => tx.clubMembership as never, rows: sheets => sheets.ClubMembership.map(clubMembership => ({
      id: uuidFor(String(clubMembership.id)), playerId: ref(clubMembership.player_id)!, clubId: ref(clubMembership.club_id)!,
      isPrimary: bool(clubMembership.is_primary), startDate: date(clubMembership.start_date), endDate: date(clubMembership.end_date),
      status: String(clubMembership.status) as never,
    })) },

  { name: 'associationMembership', of: tx => tx.associationMembership as never, rows: sheets => sheets.AssociationMembership.map(associationMembership => ({
      id: uuidFor(String(associationMembership.id)), playerId: ref(associationMembership.player_id)!, associationId: ref(associationMembership.association_id)!,
      isPrimary: bool(associationMembership.is_primary), status: String(associationMembership.status) as never,
    })) },

  { name: 'teamPlayer', of: tx => tx.teamPlayer as never, rows: sheets => sheets.TeamPlayer.map(teamPlayer => ({
      id: uuidFor(String(teamPlayer.id)), teamId: ref(teamPlayer.team_id)!, playerId: ref(teamPlayer.player_id)!,
      status: String(teamPlayer.status) as never, registerAt: ts(teamPlayer.register_at),
    })) },

  { name: 'utrLink', of: tx => tx.utrLink as never, rows: sheets => sheets.UtrLink.map(utrLink => ({
      id: uuidFor(String(utrLink.id)), playerId: ref(utrLink.player_id)!, utrAccountId: str(utrLink.utr_account_id),
      utrRating: str(utrLink.utr_rating), lastSyncedAt: ts(utrLink.last_synced_at), status: String(utrLink.status) as never,
    })) },

  { name: 'utrRatingSnapshot', of: tx => tx.utrRatingSnapshot as never, rows: sheets => sheets.UtrRatingSnapshot.map(utrRatingSnapshot => ({
      id: uuidFor(String(utrRatingSnapshot.id)), playerId: ref(utrRatingSnapshot.player_id)!,
      discipline: (str(utrRatingSnapshot.discipline) ?? undefined) as never,
      rating: String(utrRatingSnapshot.rating), recordedAt: ts(utrRatingSnapshot.recorded_at)!, source: str(utrRatingSnapshot.source),
    })) },

  { name: 'rankingCohort', of: tx => tx.rankingCohort as never, rows: sheets => sheets.RankingCohort.map(rankingCohort => ({
      id: uuidFor(String(rankingCohort.id)), name: String(rankingCohort.name), description: str(rankingCohort.description),
      associationId: ref(rankingCohort.association_id), discipline: (str(rankingCohort.discipline) ?? undefined) as never,
    })) },

  { name: 'rankingEntry', of: tx => tx.rankingEntry as never, rows: sheets => sheets.RankingEntry.map(rankingEntry => ({
      id: uuidFor(String(rankingEntry.id)), cohortId: ref(rankingEntry.cohort_id)!, playerId: ref(rankingEntry.player_id)!,
      rank: Number(rankingEntry.rank), rating: str(rankingEntry.rating), percentileRank: str(rankingEntry.percentile_rank),
      asOf: ts(rankingEntry.as_of)!,
    })) },

  { name: 'fixture', of: tx => tx.fixture as never, rows: sheets => sheets.Fixture.map(fixture => ({
      id: uuidFor(String(fixture.id)), sectionId: ref(fixture.section_id)!,
      homeTeamId: ref(fixture.home_team_id)!, awayTeamId: ref(fixture.away_team_id)!, venueId: ref(fixture.venue_id),
      roundNumber: int(fixture.round_number), roundLabel: str(fixture.round_label),
      scheduleDate: date(fixture.schedule_date), scheduleTime: time(fixture.schedule_time),
      status: String(fixture.status) as never, isFinals: bool(fixture.is_finals),
    })) },

  { name: 'fixtureScheduleChange', of: tx => tx.fixtureScheduleChange as never, rows: sheets => sheets.FixtureScheduleChange.map(fixtureScheduleChange => ({
      id: uuidFor(String(fixtureScheduleChange.id)), fixtureId: ref(fixtureScheduleChange.fixture_id)!, changeType: String(fixtureScheduleChange.change_type) as never,
      previousDate: date(fixtureScheduleChange.previous_date), previousTime: time(fixtureScheduleChange.previous_time),
      newDate: date(fixtureScheduleChange.new_date), newTime: time(fixtureScheduleChange.new_time),
      previousVenueId: ref(fixtureScheduleChange.previous_venue_id), newVenueId: ref(fixtureScheduleChange.new_venue_id),
      reason: str(fixtureScheduleChange.reason), changedBy: str(fixtureScheduleChange.changed_by), changedAt: ts(fixtureScheduleChange.changed_at)!,
    })) },

  { name: 'matchResult', of: tx => tx.matchResult as never, rows: sheets => sheets.MatchResult.map(matchResult => ({
      id: uuidFor(String(matchResult.id)), fixtureId: ref(matchResult.fixture_id)!,
      homeRubbers: int(matchResult.home_rubbers), awayRubbers: int(matchResult.away_rubbers),
      status: String(matchResult.status) as never, outcome: str(matchResult.outcome), notes: str(matchResult.notes),
      enteredBy: str(matchResult.entered_by), finalisedBy: str(matchResult.finalised_by),
      enteredAt: ts(matchResult.entered_at), finalisedAt: ts(matchResult.finalised_at),
    })) },

  { name: 'resultConfirmation', of: tx => tx.resultConfirmation as never, rows: sheets => sheets.ResultConfirmation.map(resultConfirmation => ({
      id: uuidFor(String(resultConfirmation.id)), matchResultId: ref(resultConfirmation.match_result_id)!, status: String(resultConfirmation.status) as never,
      homeEnteredBy: ref(resultConfirmation.home_entered_by), awayConfirmedBy: ref(resultConfirmation.away_confirmed_by),
      homeEnteredAt: ts(resultConfirmation.home_entered_at), awayConfirmedAt: ts(resultConfirmation.away_confirmed_at),
      scoreCorrect: resultConfirmation.score_correct === '' ? null : bool(resultConfirmation.score_correct),
      commentsCorrect: resultConfirmation.comments_correct === '' ? null : bool(resultConfirmation.comments_correct),
      disputeReason: str(resultConfirmation.dispute_reason),
    })) },

  { name: 'correctionRequest', of: tx => tx.correctionRequest as never, rows: sheets => sheets.CorrectionRequest.map(correctionRequest => ({
      id: uuidFor(String(correctionRequest.id)), matchResultId: ref(correctionRequest.match_result_id)!,
      requestedAt: ts(correctionRequest.requested_at), requestedBy: ref(correctionRequest.requested_by), reason: str(correctionRequest.reason),
      status: String(correctionRequest.status) as never, reviewBy: ref(correctionRequest.review_by), reviewAt: ts(correctionRequest.review_at),
      reviewedNotes: str(correctionRequest.reviewed_notes),
    })) },

  { name: 'rubber', of: tx => tx.rubber as never, rows: sheets => sheets.Rubber.map(rubber => ({
      id: uuidFor(String(rubber.id)), matchResultId: ref(rubber.match_result_id)!, matchFormatId: ref(rubber.match_format_id),
      rubberNumber: int(rubber.rubber_number), rubberType: String(rubber.rubber_type) as never,
      winnerSide: (str(rubber.winner_side) ?? undefined) as never,
      outcomeType: (str(rubber.outcome_type) ?? undefined) as never,
      playedAt: ts(rubber.played_at), incompleteReason: str(rubber.incomplete_reason),
    })) },

  { name: 'rubberSet', deferredUnique: true, of: tx => tx.rubberSet as never, rows: sheets => sheets.RubberSet.map(rubberSet => ({
      id: uuidFor(String(rubberSet.id)), rubberId: ref(rubberSet.rubber_id)!, setNumber: int(rubberSet.set_number),
      homeGames: int(rubberSet.home_games), awayGames: int(rubberSet.away_games), isTiebreak: bool(rubberSet.is_tiebreak),
      homeTiebreakPoints: int(rubberSet.home_tiebreak_points), awayTiebreakPoints: int(rubberSet.away_tiebreak_points),
    })) },

  { name: 'rubberPlayer', of: tx => tx.rubberPlayer as never, rows: sheets => sheets.RubberPlayer.map(rubberPlayer => ({
      id: uuidFor(String(rubberPlayer.id)), rubberId: ref(rubberPlayer.rubber_id)!, playerId: ref(rubberPlayer.player_id)!,
      side: String(rubberPlayer.side) as never, playerOrder: int(rubberPlayer.player_order), isEmergency: bool(rubberPlayer.is_emergency),
    })) },

  { name: 'ladderEntry', of: tx => tx.ladderEntry as never, rows: sheets => sheets.LadderEntry.map(ladderEntry => ({
      id: uuidFor(String(ladderEntry.id)), sectionId: ref(ladderEntry.section_id)!, teamId: ref(ladderEntry.team_id)!,
      position: int(ladderEntry.position), played: Number(ladderEntry.played), won: Number(ladderEntry.won),
      lost: Number(ladderEntry.lost), drawn: Number(ladderEntry.drawn),
      rubbersFor: Number(ladderEntry.rubbers_for), rubbersAgainst: Number(ladderEntry.rubbers_against),
      setsFor: Number(ladderEntry.sets_for), setsAgainst: Number(ladderEntry.sets_against),
      gamesFor: Number(ladderEntry.games_for), gamesAgainst: Number(ladderEntry.games_against),
      points: Number(ladderEntry.points), calculatedAt: ts(ladderEntry.calculated_at)!,
    })) },

  { name: 'playerStanding', of: tx => tx.playerStanding as never, rows: sheets => sheets.PlayerStanding.map(playerStanding => ({
      id: uuidFor(String(playerStanding.id)), sectionId: ref(playerStanding.section_id)!, playerId: ref(playerStanding.player_id)!,
      position: int(playerStanding.position), rubbersPlayed: Number(playerStanding.rubbers_played),
      rubbersWon: Number(playerStanding.rubbers_won), rubbersLost: Number(playerStanding.rubbers_lost),
      setsWon: Number(playerStanding.sets_won), setsLost: Number(playerStanding.sets_lost),
      gamesWon: Number(playerStanding.games_won), gamesLost: Number(playerStanding.games_lost),
      winPercentage: str(playerStanding.win_percentage), calculatedAt: ts(playerStanding.calculated_at)!,
    })) },

  { name: 'playerAward', of: tx => tx.playerAward as never, rows: sheets => sheets.PlayerAward.map(playerAward => ({
      id: uuidFor(String(playerAward.id)), playerId: ref(playerAward.player_id)!, awardType: String(playerAward.award_type) as never,
      title: String(playerAward.title), competitionId: ref(playerAward.competition_id), seasonId: ref(playerAward.season_id),
      teamId: ref(playerAward.team_id), awardedOn: date(playerAward.awarded_on),
    })) },

  { name: 'notification', of: tx => tx.notification as never, rows: (sheets, users) => sheets.Notification.map(notification => ({
      id: uuidFor(String(notification.id)), userId: users.get(String(notification._lookup_user_email))!,
      type: String(notification.type) as never, title: String(notification.title), message: String(notification.message),
      details: nul(notification.details) === null ? Prisma.DbNull : JSON.parse(String(notification.details)),
      targetType: (str(notification.target_type) ?? undefined) as never, targetId: ref(notification.target_id),
      channel: String(notification.channel) as never, deliveryStatus: String(notification.delivery_status) as never,
      sentAt: ts(notification.sent_at), readAt: ts(notification.read_at), createdAt: ts(notification.created_at)!,
    })) },

  { name: 'userRole', uniqueOwner: 'userId', of: tx => tx.userRole as never, rows: (sheets, users) => sheets.UserRole.map(userRole => ({
      id: uuidFor(String(userRole.id)), userId: users.get(String(userRole._lookup_user_email))!,
      roleType: String(userRole.role_type) as never, contextType: String(userRole.context_type) as never,
      associationId: ref(userRole.association_id), clubId: ref(userRole.club_id),
      teamId: ref(userRole.team_id), competitionId: ref(userRole.competition_id),
      grantedAt: ts(userRole.granted_at),
    })) },

  { name: 'profileMergeRequest', of: tx => tx.profileMergeRequest as never, rows: sheets => sheets.ProfileMergeRequest.map(profileMergeRequest => ({
      id: uuidFor(String(profileMergeRequest.id)), status: String(profileMergeRequest.status) as never,
      playerAId: ref(profileMergeRequest.player_a_id)!, playerBId: ref(profileMergeRequest.player_b_id)!,
      requestingAssociationId: ref(profileMergeRequest.requesting_association_id),
      note: str(profileMergeRequest.note), resolvedAt: ts(profileMergeRequest.resolved_at),
    })) },

  { name: 'auditLog', of: tx => tx.auditLog as never, rows: sheets => sheets.AuditLog.map(auditLog => ({
      id: uuidFor(String(auditLog.id)), entityType: String(auditLog.entity_type), entityId: ref(auditLog.entity_id),
      action: String(auditLog.action), changedAt: ts(auditLog.changed_at)!,
      changeSummary: str(auditLog.change_summary), changedBy: ref(auditLog.changed_by),
    })) },
]

/**
 * Does the stored column still hold what the workbook says? A plain === or a
 * plain JSON compare would both report changes that are not there: Prisma hands
 * timestamps back as Date, numeric columns as Decimal (so "99.00" returns as
 * "99"), and a Json column comes back with its keys in whatever order Postgres
 * stored them.
 */
function same(raw: unknown, stored: unknown): boolean {
  const blank = (value: unknown) => value === null || value === undefined || value === Prisma.DbNull
  if (blank(raw)) return blank(stored)
  if (blank(stored)) return false
  // Decimal renders itself as a string; unwrap it before anything walks into it
  // and mistakes its internal digit array for the value.
  const want = plain(raw)
  const got = plain(stored)
  if (want instanceof Date || got instanceof Date) {
    return new Date(want as string).getTime() === new Date(got as string).getTime()
  }
  if (typeof want === 'object' || typeof got === 'object') {
    return canonical(want) === canonical(got)
  }
  // Decimal columns: 99 and "99.00" are the same number, different strings.
  const wanted = Number(want)
  const actual = Number(got)
  if (!Number.isNaN(wanted) && !Number.isNaN(actual) && String(want).trim() !== '' && String(got).trim() !== '') {
    return wanted === actual
  }
  return String(want) === String(got)
}

/** Unwraps a Decimal (or anything else carrying toJSON) to the value it stands for. */
function plain(value: unknown): unknown {
  return value !== null && typeof value === 'object' && !(value instanceof Date)
    && typeof (value as { toJSON?: unknown }).toJSON === 'function'
    ? (value as { toJSON: () => unknown }).toJSON()
    : value
}

/** JSON with object keys sorted, so key order never reads as a change. */
function canonical(value: unknown): string {
  const walk = (raw: unknown): unknown => {
    const plainValue = plain(raw)
    if (plainValue === null || typeof plainValue !== 'object') return plainValue
    if (Array.isArray(plainValue)) return plainValue.map(walk)
    const record = plainValue as Record<string, unknown>
    return Object.fromEntries(Object.keys(record).sort().map(key => [key, walk(record[key])]))
  }
  return JSON.stringify(walk(value))
}

/** Fails loudly rather than letting a bad `_lookup_user_email` become a null FK. */
function userIndex(sheets: Record<string, Row[]>): Users {
  const index: Users = new Map(sheets.User.map(user => [String(user.email), uuidFor(String(user.id))]))
  const unlinked = [...new Set(
    ['Player', 'Notification', 'UserRole'].flatMap(sheetName => (sheets[sheetName] ?? []).map(row => String(row._lookup_user_email))),
  )].filter(email => email && !index.has(email))
  if (unlinked.length) {
    throw new Error(`${unlinked.length} row(s) reference a login that the User sheet does not define, e.g. ${unlinked[0]}`)
  }
  return index
}

function checkSheets(sheets: Record<string, Row[]>) {
  const need = ['Association', 'Club', 'Venue', 'Competition', 'Player', 'Fixture']
  const missing = need.filter(sheetName => !sheets[sheetName]?.length)
  if (missing.length) throw new Error(`Workbook is missing data for: ${missing.join(', ')}`)
}

/** The original behaviour: insert what is absent, touch nothing that is present. */
export async function seedCompetition(tx: Prisma.TransactionClient, sheets: Record<string, Row[]>, dryRun: boolean) {
  checkSheets(sheets)
  const users = userIndex(sheets)

  const inserted: Record<string, number> = {}
  const codesFilled: Record<string, number> = {}
  for (const table of TABLES) {
    const data = table.rows(sheets, users)
    if (table.coded) {
      // A club or player added through the app took the next free code, which the
      // workbook may since have given to a row of its own. Inserting would then skip
      // the workbook's row without a word (the code is unique), so stop instead.
      const taken = await table.of(tx).findMany({
        where: { code: { in: data.map(row => row.code) }, id: { notIn: data.map(row => row.id) } }, select: { code: true },
      })
      if (taken.length) {
        throw new Error(`The workbook's ${table.name} ${taken.map(takenRow => takenRow.code).join(', ')} already belong(s) to a ${table.name} added through the app. `
          + 'Run with --sync to replace the database with the workbook, or remove that row first.')
      }
      // Read before inserting, so only rows that predate the column are counted.
      const uncoded = await table.of(tx).findMany({ where: { id: { in: data.map(row => row.id) }, code: null }, select: { id: true } })
      const codeOf = new Map(data.map(row => [row.id, row.code]))
      if (!dryRun) {
        for (const uncodedRow of uncoded) await table.of(tx).update({ where: { id: uncodedRow.id }, data: { code: codeOf.get(String(uncodedRow.id)) } })
      }
      codesFilled[table.name] = uncoded.length
    }
    if (dryRun) {
      inserted[table.name] = data.length
    } else if (table.deferredUnique) {
      const present = new Set((await table.of(tx).findMany({ where: { id: { in: data.map(row => row.id) } }, select: { id: true } })).map(row => String(row.id)))
      const missing = data.filter(row => !present.has(row.id))
      inserted[table.name] = missing.length ? (await table.of(tx).createMany({ data: missing })).count : 0
    } else {
      inserted[table.name] = (await table.of(tx).createMany({ data, skipDuplicates: true })).count
    }
  }

  return { dryRun, accounts: sheets.User.length, [dryRun ? 'rowsInWorkbook' : 'inserted']: inserted, codesFilled }
}

/**
 * Makes the database match the workbook: inserts what is missing, rewrites what
 * drifted, drops what the workbook no longer defines. Needed after
 * `npm run data:generate` renumbers the spreadsheet codes, which a plain seed
 * cannot follow. Unlike a seed, this does not spare hand-edited rows.
 */
export async function syncCompetition(tx: Prisma.TransactionClient, sheets: Record<string, Row[]>, dryRun: boolean) {
  checkSheets(sheets)
  const users = userIndex(sheets)
  const built = new Map(TABLES.map(table => [table.name, table.rows(sheets, users)]))

  // Children before parents, so a delete never trips a foreign key.
  const deleted: Record<string, number> = {}
  const kept: Record<string, number> = {}
  for (const table of [...TABLES].reverse()) {
    const keep = built.get(table.name)!.map(row => row.id)
    const strangers = (await table.of(tx).findMany({ where: { id: { notIn: keep } }, select: { id: true } })).length
    if (table.shared) {
      kept[table.name] = strangers
      deleted[table.name] = 0
      continue
    }
    deleted[table.name] = dryRun ? strangers : (await table.of(tx).deleteMany({ where: { id: { notIn: keep } } })).count
  }

  // Parents before children, so an insert always has its foreign key present.
  const created: Record<string, number> = {}
  const updated: Record<string, number> = {}
  for (const table of TABLES) {
    const rows = built.get(table.name)!
    const existing = new Map((await table.of(tx).findMany()).map(row => [String(row.id), row]))
    const missing = rows.filter(row => !existing.has(row.id))
    const drifted = rows.filter(row => {
      const was = existing.get(row.id)
      return was && Object.keys(row).some(key => !same(row[key], was[key]))
    })
    created[table.name] = missing.length
    updated[table.name] = drifted.length
    if (!dryRun) {
      const owner = table.uniqueOwner
      const moved = owner ? drifted.filter(driftedRow => !same(driftedRow[owner], existing.get(driftedRow.id)![owner])) : []
      if (moved.length) await table.of(tx).deleteMany({ where: { id: { in: moved.map(movedRow => movedRow.id) } } })
      for (const row of [...missing, ...drifted]) {
        await table.of(tx).upsert({ where: { id: row.id }, create: row, update: row })
      }
    }
  }

  const total = (counts: Record<string, number>) => Object.values(counts).reduce((sum, count) => sum + count, 0)
  const nonZero = (counts: Record<string, number>) => Object.fromEntries(Object.entries(counts).filter(([, count]) => count > 0))
  return {
    dryRun,
    sync: true,
    accounts: sheets.User.length,
    totals: { created: total(created), updated: total(updated), deleted: total(deleted) },
    created: nonZero(created),
    updated: nonZero(updated),
    deleted: nonZero(deleted),
    keptBecauseShared: nonZero(kept),
  }
}

async function main() {
  const flags = process.argv.slice(2)
  const known = ['--dry-run', '--sync']
  const unknown = flags.filter(flag => !known.includes(flag))
  if (unknown.length) throw new Error(`Unsupported option(s): ${unknown.join(', ')}. Only ${known.join(' and ')} are available.`)
  const dryRun = flags.includes('--dry-run')
  const sync = flags.includes('--sync')

  const sheets = readSheets(WORKBOOK)
  const db = new PrismaClient()
  try {
    const result = await db.$transaction(
      async tx => (sync ? await syncCompetition(tx, sheets, dryRun) : await seedCompetition(tx, sheets, dryRun)),
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 600_000 },
    )
    console.log(dryRun
      ? 'Dry run: nothing was written.'
      : sync
        ? 'Competition data synced. The database now matches the workbook; rows it no longer defines were deleted.'
        : 'Competition data seeded. Nothing was deleted, and the only update was filling in missing club and player codes, so any row you edited by hand survived.')
    console.log(JSON.stringify(result, null, 2))
  } finally {
    await db.$disconnect()
  }
}

if (require.main === module) {
  main().catch(error => {
    // Never print the connection string or spreadsheet contents on failure.
    const known = error instanceof Prisma.PrismaClientKnownRequestError
      || error instanceof Prisma.PrismaClientInitializationError
    console.error(known
      ? 'Seed failed; the transaction was rolled back and nothing was written. Check that postgres is running and `npx prisma migrate deploy` has been applied.'
      : error instanceof Error ? error.message : 'Seed failed')
    process.exitCode = 1
  })
}
