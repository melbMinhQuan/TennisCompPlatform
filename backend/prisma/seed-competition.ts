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
const nul = (v: unknown) => (v === '' || v === undefined || v === null ? null : v)
const str = (v: unknown) => (nul(v) === null ? null : String(v))
const int = (v: unknown) => (nul(v) === null ? null : Number(v))
const bool = (v: unknown) => v === true || v === 'true' || v === 1
/** Calendar date (@db.Date) - kept at UTC midnight so the day never shifts. */
const date = (v: unknown) => (nul(v) === null ? null : new Date(`${v}T00:00:00Z`))
/** Local clock time (@db.Time), stored on the epoch date Prisma expects. */
const time = (v: unknown) => (nul(v) === null ? null : new Date(`1970-01-01T${v}:00Z`))
const ts = (v: unknown) => (nul(v) === null ? null : new Date(String(v)))
/** Foreign key: spreadsheet code -> UUID. */
const ref = (v: unknown) => (nul(v) === null ? null : uuidFor(String(v)))

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
type Table = {
  name: string
  /**
   * True when rows here can come from somewhere other than this workbook, so a
   * sync must never delete what it does not recognise. `user` is the only one:
   * the login seed writes accounts this workbook knows nothing about.
   */
  shared?: boolean
  of: (tx: Prisma.TransactionClient) => {
    createMany(a: unknown): Promise<{ count: number }>
    deleteMany(a: unknown): Promise<{ count: number }>
    findMany(a?: unknown): Promise<Record<string, unknown>[]>
    upsert(a: unknown): Promise<unknown>
  }
  rows: (S: Record<string, Row[]>, U: Users) => Built[]
}

const TABLES: Table[] = [
  { name: 'user', shared: true, of: tx => tx.user as never, rows: S => S.User.map(r => ({
      id: uuidFor(String(r.id)), email: String(r.email), passwordHash: String(r.password_hash),
      status: String(r.status) as never, lastLoginAt: ts(r.last_login_at),
    })) },

  { name: 'association', of: tx => tx.association as never, rows: S => S.Association.map(r => ({
      id: uuidFor(String(r.id)), name: String(r.name), email: str(r.email), address: str(r.address),
      phone: str(r.phone), status: String(r.status) as never,
    })) },

  { name: 'club', of: tx => tx.club as never, rows: S => S.Club.map(r => ({
      id: uuidFor(String(r.id)), associationId: ref(r.association_id)!, name: String(r.name),
      address: str(r.address), email: str(r.email), phone: str(r.phone), status: String(r.status) as never,
    })) },

  { name: 'venue', of: tx => tx.venue as never, rows: S => S.Venue.map(r => ({
      id: uuidFor(String(r.id)), clubId: ref(r.club_id), name: String(r.name), address: str(r.address),
      timeZone: String(r.time_zone), courtCount: int(r.court_count), status: String(r.status) as never,
    })) },

  { name: 'competition', of: tx => tx.competition as never, rows: S => S.Competition.map(r => ({
      id: uuidFor(String(r.id)), associationId: ref(r.association_id)!, name: String(r.name),
      type: str(r.type), status: String(r.status) as never,
    })) },

  { name: 'matchFormat', of: tx => tx.matchFormat as never, rows: S => S.MatchFormat.map(r => ({
      id: uuidFor(String(r.id)), competitionId: ref(r.competition_id)!, name: String(r.name),
      rubberCount: int(r.rubber_count), setFormat: str(r.set_format), setToWin: int(r.set_to_win),
      tiebreakRule: str(r.tiebreak_rule), matchTiebreak: str(r.match_tiebreak),
      winnerDeterminedBy: str(r.winner_determined_by), allowDraw: bool(r.allow_draw),
      singlesCount: int(r.singles_count), doublesCount: int(r.doubles_count),
    })) },

  { name: 'eligibilityRule', of: tx => tx.eligibilityRule as never, rows: S => S.EligibilityRule.map(r => ({
      id: uuidFor(String(r.id)), competitionId: ref(r.competition_id)!, ruleType: String(r.rule_type),
      scope: str(r.scope), minMatchesPlayed: int(r.min_matches_played),
      gradeRestriction: str(r.grade_restriction), description: str(r.description),
    })) },

  { name: 'season', of: tx => tx.season as never, rows: S => S.Season.map(r => ({
      id: uuidFor(String(r.id)), competitionId: ref(r.competition_id)!, year: int(r.year),
      seasonType: str(r.season_type), startDate: date(r.start_date), endDate: date(r.end_date),
      status: String(r.status) as never,
    })) },

  { name: 'sectionGrade', of: tx => tx.sectionGrade as never, rows: S => S.SectionGrade.map(r => ({
      id: uuidFor(String(r.id)), seasonId: ref(r.season_id)!, name: String(r.name),
      gender: (str(r.gender) ?? undefined) as never, ageGroup: str(r.age_group),
      minAge: int(r.min_age), maxAge: int(r.max_age), teamCount: int(r.team_count),
    })) },

  { name: 'team', of: tx => tx.team as never, rows: S => S.Team.map(r => ({
      id: uuidFor(String(r.id)), clubId: ref(r.club_id)!, sectionId: ref(r.section_id)!,
      homeVenueId: ref(r.home_venue_id), name: String(r.name),
    })) },

  { name: 'player', of: tx => tx.player as never, rows: (S, U) => S.Player.map(r => ({
      id: uuidFor(String(r.id)),
      userId: U.get(String(r._lookup_user_email)) ?? null,
      firstName: String(r.first_name), lastName: String(r.last_name),
      dateOfBirth: date(r.date_of_birth)!, gender: String(r.gender) as never,
      email: str(r.email), phone: str(r.phone), avatarUrl: str(r.avatar_url),
      isJunior: bool(r.is_junior), status: String(r.status) as never,
    })) },

  { name: 'clubMembership', of: tx => tx.clubMembership as never, rows: S => S.ClubMembership.map(r => ({
      id: uuidFor(String(r.id)), playerId: ref(r.player_id)!, clubId: ref(r.club_id)!,
      isPrimary: bool(r.is_primary), startDate: date(r.start_date), endDate: date(r.end_date),
      status: String(r.status) as never,
    })) },

  { name: 'associationMembership', of: tx => tx.associationMembership as never, rows: S => S.AssociationMembership.map(r => ({
      id: uuidFor(String(r.id)), playerId: ref(r.player_id)!, associationId: ref(r.association_id)!,
      isPrimary: bool(r.is_primary), status: String(r.status) as never,
    })) },

  { name: 'teamPlayer', of: tx => tx.teamPlayer as never, rows: S => S.TeamPlayer.map(r => ({
      id: uuidFor(String(r.id)), teamId: ref(r.team_id)!, playerId: ref(r.player_id)!,
      status: String(r.status) as never, registerAt: ts(r.register_at),
    })) },

  { name: 'utrLink', of: tx => tx.utrLink as never, rows: S => S.UtrLink.map(r => ({
      id: uuidFor(String(r.id)), playerId: ref(r.player_id)!, utrAccountId: str(r.utr_account_id),
      utrRating: str(r.utr_rating), lastSyncedAt: ts(r.last_synced_at), status: String(r.status) as never,
    })) },

  { name: 'utrRatingSnapshot', of: tx => tx.utrRatingSnapshot as never, rows: S => S.UtrRatingSnapshot.map(r => ({
      id: uuidFor(String(r.id)), playerId: ref(r.player_id)!,
      discipline: (str(r.discipline) ?? undefined) as never,
      rating: String(r.rating), recordedAt: ts(r.recorded_at)!, source: str(r.source),
    })) },

  { name: 'rankingCohort', of: tx => tx.rankingCohort as never, rows: S => S.RankingCohort.map(r => ({
      id: uuidFor(String(r.id)), name: String(r.name), description: str(r.description),
      associationId: ref(r.association_id), discipline: (str(r.discipline) ?? undefined) as never,
    })) },

  { name: 'rankingEntry', of: tx => tx.rankingEntry as never, rows: S => S.RankingEntry.map(r => ({
      id: uuidFor(String(r.id)), cohortId: ref(r.cohort_id)!, playerId: ref(r.player_id)!,
      rank: Number(r.rank), rating: str(r.rating), percentileRank: str(r.percentile_rank),
      asOf: ts(r.as_of)!,
    })) },

  { name: 'fixture', of: tx => tx.fixture as never, rows: S => S.Fixture.map(r => ({
      id: uuidFor(String(r.id)), sectionId: ref(r.section_id)!,
      homeTeamId: ref(r.home_team_id)!, awayTeamId: ref(r.away_team_id)!, venueId: ref(r.venue_id),
      roundNumber: int(r.round_number), roundLabel: str(r.round_label),
      scheduleDate: date(r.schedule_date), scheduleTime: time(r.schedule_time),
      status: String(r.status) as never, isFinals: bool(r.is_finals),
    })) },

  { name: 'fixtureScheduleChange', of: tx => tx.fixtureScheduleChange as never, rows: S => S.FixtureScheduleChange.map(r => ({
      id: uuidFor(String(r.id)), fixtureId: ref(r.fixture_id)!, changeType: String(r.change_type) as never,
      previousDate: date(r.previous_date), previousTime: time(r.previous_time),
      newDate: date(r.new_date), newTime: time(r.new_time),
      previousVenueId: ref(r.previous_venue_id), newVenueId: ref(r.new_venue_id),
      reason: str(r.reason), changedBy: str(r.changed_by), changedAt: ts(r.changed_at)!,
    })) },

  { name: 'matchResult', of: tx => tx.matchResult as never, rows: S => S.MatchResult.map(r => ({
      id: uuidFor(String(r.id)), fixtureId: ref(r.fixture_id)!,
      homeRubbers: int(r.home_rubbers), awayRubbers: int(r.away_rubbers),
      status: String(r.status) as never, outcome: str(r.outcome), notes: str(r.notes),
      enteredBy: str(r.entered_by), finalisedBy: str(r.finalised_by),
      enteredAt: ts(r.entered_at), finalisedAt: ts(r.finalised_at),
    })) },

  { name: 'resultConfirmation', of: tx => tx.resultConfirmation as never, rows: S => S.ResultConfirmation.map(r => ({
      id: uuidFor(String(r.id)), matchResultId: ref(r.match_result_id)!, status: String(r.status) as never,
      homeEnteredBy: ref(r.home_entered_by), awayConfirmedBy: ref(r.away_confirmed_by),
      homeEnteredAt: ts(r.home_entered_at), awayConfirmedAt: ts(r.away_confirmed_at),
      scoreCorrect: r.score_correct === '' ? null : bool(r.score_correct),
      commentsCorrect: r.comments_correct === '' ? null : bool(r.comments_correct),
      disputeReason: str(r.dispute_reason),
    })) },

  { name: 'correctionRequest', of: tx => tx.correctionRequest as never, rows: S => S.CorrectionRequest.map(r => ({
      id: uuidFor(String(r.id)), matchResultId: ref(r.match_result_id)!,
      requestedAt: ts(r.requested_at), requestedBy: ref(r.requested_by), reason: str(r.reason),
      status: String(r.status) as never, reviewBy: ref(r.review_by), reviewAt: ts(r.review_at),
      reviewedNotes: str(r.reviewed_notes),
    })) },

  { name: 'rubber', of: tx => tx.rubber as never, rows: S => S.Rubber.map(r => ({
      id: uuidFor(String(r.id)), matchResultId: ref(r.match_result_id)!, matchFormatId: ref(r.match_format_id),
      rubberNumber: int(r.rubber_number), rubberType: String(r.rubber_type) as never,
      winnerSide: (str(r.winner_side) ?? undefined) as never,
      outcomeType: (str(r.outcome_type) ?? undefined) as never,
      playedAt: ts(r.played_at), incompleteReason: str(r.incomplete_reason),
    })) },

  { name: 'rubberSet', of: tx => tx.rubberSet as never, rows: S => S.RubberSet.map(r => ({
      id: uuidFor(String(r.id)), rubberId: ref(r.rubber_id)!, setNumber: int(r.set_number),
      homeGames: int(r.home_games), awayGames: int(r.away_games), isTiebreak: bool(r.is_tiebreak),
      homeTiebreakPoints: int(r.home_tiebreak_points), awayTiebreakPoints: int(r.away_tiebreak_points),
    })) },

  { name: 'rubberPlayer', of: tx => tx.rubberPlayer as never, rows: S => S.RubberPlayer.map(r => ({
      id: uuidFor(String(r.id)), rubberId: ref(r.rubber_id)!, playerId: ref(r.player_id)!,
      side: String(r.side) as never, playerOrder: int(r.player_order), isEmergency: bool(r.is_emergency),
    })) },

  { name: 'ladderEntry', of: tx => tx.ladderEntry as never, rows: S => S.LadderEntry.map(r => ({
      id: uuidFor(String(r.id)), sectionId: ref(r.section_id)!, teamId: ref(r.team_id)!,
      position: int(r.position), played: Number(r.played), won: Number(r.won),
      lost: Number(r.lost), drawn: Number(r.drawn),
      rubbersFor: Number(r.rubbers_for), rubbersAgainst: Number(r.rubbers_against),
      setsFor: Number(r.sets_for), setsAgainst: Number(r.sets_against),
      gamesFor: Number(r.games_for), gamesAgainst: Number(r.games_against),
      points: Number(r.points), calculatedAt: ts(r.calculated_at)!,
    })) },

  { name: 'playerStanding', of: tx => tx.playerStanding as never, rows: S => S.PlayerStanding.map(r => ({
      id: uuidFor(String(r.id)), sectionId: ref(r.section_id)!, playerId: ref(r.player_id)!,
      position: int(r.position), rubbersPlayed: Number(r.rubbers_played),
      rubbersWon: Number(r.rubbers_won), rubbersLost: Number(r.rubbers_lost),
      setsWon: Number(r.sets_won), setsLost: Number(r.sets_lost),
      gamesWon: Number(r.games_won), gamesLost: Number(r.games_lost),
      winPercentage: str(r.win_percentage), calculatedAt: ts(r.calculated_at)!,
    })) },

  { name: 'playerAward', of: tx => tx.playerAward as never, rows: S => S.PlayerAward.map(r => ({
      id: uuidFor(String(r.id)), playerId: ref(r.player_id)!, awardType: String(r.award_type) as never,
      title: String(r.title), competitionId: ref(r.competition_id), seasonId: ref(r.season_id),
      teamId: ref(r.team_id), awardedOn: date(r.awarded_on),
    })) },

  { name: 'notification', of: tx => tx.notification as never, rows: (S, U) => S.Notification.map(r => ({
      id: uuidFor(String(r.id)), userId: U.get(String(r._lookup_user_email))!,
      type: String(r.type) as never, title: String(r.title), message: String(r.message),
      details: nul(r.details) === null ? Prisma.DbNull : JSON.parse(String(r.details)),
      targetType: (str(r.target_type) ?? undefined) as never, targetId: ref(r.target_id),
      channel: String(r.channel) as never, deliveryStatus: String(r.delivery_status) as never,
      sentAt: ts(r.sent_at), readAt: ts(r.read_at), createdAt: ts(r.created_at)!,
    })) },

  { name: 'userRole', of: tx => tx.userRole as never, rows: (S, U) => S.UserRole.map(r => ({
      id: uuidFor(String(r.id)), userId: U.get(String(r._lookup_user_email))!,
      roleType: String(r.role_type) as never, contextType: String(r.context_type) as never,
      associationId: ref(r.association_id), clubId: ref(r.club_id),
      teamId: ref(r.team_id), competitionId: ref(r.competition_id),
      grantedAt: ts(r.granted_at),
    })) },

  { name: 'profileMergeRequest', of: tx => tx.profileMergeRequest as never, rows: S => S.ProfileMergeRequest.map(r => ({
      id: uuidFor(String(r.id)), status: String(r.status) as never,
      playerAId: ref(r.player_a_id)!, playerBId: ref(r.player_b_id)!,
      requestingAssociationId: ref(r.requesting_association_id),
      note: str(r.note), resolvedAt: ts(r.resolved_at),
    })) },

  { name: 'auditLog', of: tx => tx.auditLog as never, rows: S => S.AuditLog.map(r => ({
      id: uuidFor(String(r.id)), entityType: String(r.entity_type), entityId: ref(r.entity_id),
      action: String(r.action), changedAt: ts(r.changed_at)!,
      changeSummary: str(r.change_summary), changedBy: ref(r.changed_by),
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
  const blank = (v: unknown) => v === null || v === undefined || v === Prisma.DbNull
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
  const a = Number(want)
  const b = Number(got)
  if (!Number.isNaN(a) && !Number.isNaN(b) && String(want).trim() !== '' && String(got).trim() !== '') {
    return a === b
  }
  return String(want) === String(got)
}

/** Unwraps a Decimal (or anything else carrying toJSON) to the value it stands for. */
function plain(v: unknown): unknown {
  return v !== null && typeof v === 'object' && !(v instanceof Date)
    && typeof (v as { toJSON?: unknown }).toJSON === 'function'
    ? (v as { toJSON: () => unknown }).toJSON()
    : v
}

/** JSON with object keys sorted, so key order never reads as a change. */
function canonical(v: unknown): string {
  const walk = (raw: unknown): unknown => {
    const x = plain(raw)
    if (x === null || typeof x !== 'object') return x
    if (Array.isArray(x)) return x.map(walk)
    const o = x as Record<string, unknown>
    return Object.fromEntries(Object.keys(o).sort().map(k => [k, walk(o[k])]))
  }
  return JSON.stringify(walk(v))
}

/** Fails loudly rather than letting a bad `_lookup_user_email` become a null FK. */
function userIndex(S: Record<string, Row[]>): Users {
  const index: Users = new Map(S.User.map(u => [String(u.email), uuidFor(String(u.id))]))
  const unlinked = [...new Set(
    ['Player', 'Notification', 'UserRole'].flatMap(s => (S[s] ?? []).map(r => String(r._lookup_user_email))),
  )].filter(e => e && !index.has(e))
  if (unlinked.length) {
    throw new Error(`${unlinked.length} row(s) reference a login that the User sheet does not define, e.g. ${unlinked[0]}`)
  }
  return index
}

function checkSheets(S: Record<string, Row[]>) {
  const need = ['Association', 'Club', 'Venue', 'Competition', 'Player', 'Fixture']
  const missing = need.filter(n => !S[n]?.length)
  if (missing.length) throw new Error(`Workbook is missing data for: ${missing.join(', ')}`)
}

/** The original behaviour: insert what is absent, touch nothing that is present. */
export async function seedCompetition(tx: Prisma.TransactionClient, S: Record<string, Row[]>, dryRun: boolean) {
  checkSheets(S)
  const U = userIndex(S)

  const inserted: Record<string, number> = {}
  for (const t of TABLES) {
    const data = t.rows(S, U)
    inserted[t.name] = dryRun ? data.length : (await t.of(tx).createMany({ data, skipDuplicates: true })).count
  }

  return { dryRun, accounts: S.User.length, [dryRun ? 'rowsInWorkbook' : 'inserted']: inserted }
}

/**
 * Makes the database match the workbook: inserts what is missing, rewrites what
 * drifted, drops what the workbook no longer defines. Needed after
 * `npm run data:generate` renumbers the spreadsheet codes, which a plain seed
 * cannot follow. Unlike a seed, this does not spare hand-edited rows.
 */
export async function syncCompetition(tx: Prisma.TransactionClient, S: Record<string, Row[]>, dryRun: boolean) {
  checkSheets(S)
  const U = userIndex(S)
  const built = new Map(TABLES.map(t => [t.name, t.rows(S, U)]))

  // Children before parents, so a delete never trips a foreign key.
  const deleted: Record<string, number> = {}
  const kept: Record<string, number> = {}
  for (const t of [...TABLES].reverse()) {
    const keep = built.get(t.name)!.map(r => r.id)
    const strangers = (await t.of(tx).findMany({ where: { id: { notIn: keep } }, select: { id: true } })).length
    if (t.shared) {
      kept[t.name] = strangers
      deleted[t.name] = 0
      continue
    }
    deleted[t.name] = dryRun ? strangers : (await t.of(tx).deleteMany({ where: { id: { notIn: keep } } })).count
  }

  // Parents before children, so an insert always has its foreign key present.
  const created: Record<string, number> = {}
  const updated: Record<string, number> = {}
  for (const t of TABLES) {
    const rows = built.get(t.name)!
    const existing = new Map((await t.of(tx).findMany()).map(r => [String(r.id), r]))
    const missing = rows.filter(r => !existing.has(r.id))
    const drifted = rows.filter(r => {
      const was = existing.get(r.id)
      return was && Object.keys(r).some(k => !same(r[k], was[k]))
    })
    created[t.name] = missing.length
    updated[t.name] = drifted.length
    if (!dryRun) {
      for (const r of [...missing, ...drifted]) {
        await t.of(tx).upsert({ where: { id: r.id }, create: r, update: r })
      }
    }
  }

  const total = (c: Record<string, number>) => Object.values(c).reduce((a, b) => a + b, 0)
  const nonZero = (c: Record<string, number>) => Object.fromEntries(Object.entries(c).filter(([, n]) => n > 0))
  return {
    dryRun,
    sync: true,
    accounts: S.User.length,
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
  const unknown = flags.filter(f => !known.includes(f))
  if (unknown.length) throw new Error(`Unsupported option(s): ${unknown.join(', ')}. Only ${known.join(' and ')} are available.`)
  const dryRun = flags.includes('--dry-run')
  const sync = flags.includes('--sync')

  const sheets = readSheets(WORKBOOK)
  const db = new PrismaClient()
  try {
    const result = await db.$transaction(
      tx => (sync ? syncCompetition(tx, sheets, dryRun) : seedCompetition(tx, sheets, dryRun)),
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 600_000 },
    )
    console.log(dryRun
      ? 'Dry run: nothing was written.'
      : sync
        ? 'Competition data synced. The database now matches the workbook; rows it no longer defines were deleted.'
        : 'Competition data seeded. Nothing was updated or deleted, so any row you edited by hand survived.')
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
