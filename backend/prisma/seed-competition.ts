/**
 * Seeds the local database from prisma/competition_data.xlsx.
 *
 * Each developer runs this against their own local database - nothing here is
 * shared or remote. Until you run it, every table except `user` is empty.
 *
 *   From the repository root:
 *     npm run seed:competition --workspace=backend            # fill the database
 *     npm run seed:competition --workspace=backend -- --dry-run # report only, write nothing
 *
 *   Prerequisites:
 *     docker compose up -d                 (in backend/, starts postgres)
 *     npx prisma migrate deploy            (in backend/, creates the tables)
 *
 * Safe to run more than once. Row ids are derived from the spreadsheet codes,
 * so a second run inserts nothing new rather than creating duplicates. It only
 * ever inserts: no row is updated or deleted, so hand-edited records survive.
 *
 * The workbook holds no passwords. Player rows are attached to the existing
 * `user` accounts by email; where an account is missing the profile is still
 * created, just without a login link.
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

export async function seedCompetition(tx: Prisma.TransactionClient, S: Record<string, Row[]>, dryRun: boolean) {
  const need = ['Association', 'Club', 'Venue', 'Competition', 'Player', 'Fixture']
  const missing = need.filter(n => !S[n]?.length)
  if (missing.length) throw new Error(`Workbook is missing data for: ${missing.join(', ')}`)

  // Link player profiles to the accounts already in the database. The workbook
  // cannot contain their UUIDs, so it carries the login email instead.
  const wanted = [...new Set(
    ['Player', 'Notification', 'UserRole'].flatMap(s => (S[s] ?? []).map(r => String(r._lookup_user_email))),
  )].filter(Boolean)
  const users = await tx.user.findMany({ where: { email: { in: wanted } }, select: { id: true, email: true } })
  const userId = new Map(users.map(u => [u.email, u.id]))
  const unlinked = wanted.filter(e => !userId.has(e))

  // notification.user_id and user_role.user_id are NOT NULL, so rows for an
  // account that does not exist locally are skipped rather than faked.
  const skipped = { notifications: 0, userRoles: 0 }

  const steps: [string, () => Promise<{ count: number }>][] = [
    ['association', () => tx.association.createMany({
      data: S.Association.map(r => ({
        id: uuidFor(String(r.id)), name: String(r.name), email: str(r.email), address: str(r.address),
        phone: str(r.phone), status: String(r.status) as never,
      })), skipDuplicates: true })],

    ['club', () => tx.club.createMany({
      data: S.Club.map(r => ({
        id: uuidFor(String(r.id)), associationId: ref(r.association_id)!, name: String(r.name),
        address: str(r.address), email: str(r.email), phone: str(r.phone), status: String(r.status) as never,
      })), skipDuplicates: true })],

    ['venue', () => tx.venue.createMany({
      data: S.Venue.map(r => ({
        id: uuidFor(String(r.id)), clubId: ref(r.club_id), name: String(r.name), address: str(r.address),
        timeZone: String(r.time_zone), courtCount: int(r.court_count), status: String(r.status) as never,
      })), skipDuplicates: true })],

    ['competition', () => tx.competition.createMany({
      data: S.Competition.map(r => ({
        id: uuidFor(String(r.id)), associationId: ref(r.association_id)!, name: String(r.name),
        type: str(r.type), status: String(r.status) as never,
      })), skipDuplicates: true })],

    ['matchFormat', () => tx.matchFormat.createMany({
      data: S.MatchFormat.map(r => ({
        id: uuidFor(String(r.id)), competitionId: ref(r.competition_id)!, name: String(r.name),
        rubberCount: int(r.rubber_count), setFormat: str(r.set_format), setToWin: int(r.set_to_win),
        tiebreakRule: str(r.tiebreak_rule), matchTiebreak: str(r.match_tiebreak),
        winnerDeterminedBy: str(r.winner_determined_by), allowDraw: bool(r.allow_draw),
        singlesCount: int(r.singles_count), doublesCount: int(r.doubles_count),
      })), skipDuplicates: true })],

    ['eligibilityRule', () => tx.eligibilityRule.createMany({
      data: S.EligibilityRule.map(r => ({
        id: uuidFor(String(r.id)), competitionId: ref(r.competition_id)!, ruleType: String(r.rule_type),
        scope: str(r.scope), minMatchesPlayed: int(r.min_matches_played),
        gradeRestriction: str(r.grade_restriction), description: str(r.description),
      })), skipDuplicates: true })],

    ['season', () => tx.season.createMany({
      data: S.Season.map(r => ({
        id: uuidFor(String(r.id)), competitionId: ref(r.competition_id)!, year: int(r.year),
        seasonType: str(r.season_type), startDate: date(r.start_date), endDate: date(r.end_date),
        status: String(r.status) as never,
      })), skipDuplicates: true })],

    ['sectionGrade', () => tx.sectionGrade.createMany({
      data: S.SectionGrade.map(r => ({
        id: uuidFor(String(r.id)), seasonId: ref(r.season_id)!, name: String(r.name),
        gender: (str(r.gender) ?? undefined) as never, ageGroup: str(r.age_group),
        minAge: int(r.min_age), maxAge: int(r.max_age), teamCount: int(r.team_count),
      })), skipDuplicates: true })],

    ['team', () => tx.team.createMany({
      data: S.Team.map(r => ({
        id: uuidFor(String(r.id)), clubId: ref(r.club_id)!, sectionId: ref(r.section_id)!,
        homeVenueId: ref(r.home_venue_id), name: String(r.name),
      })), skipDuplicates: true })],

    ['player', () => tx.player.createMany({
      data: S.Player.map(r => ({
        id: uuidFor(String(r.id)),
        userId: userId.get(String(r._lookup_user_email)) ?? null,
        firstName: String(r.first_name), lastName: String(r.last_name),
        dateOfBirth: date(r.date_of_birth)!, gender: String(r.gender) as never,
        email: str(r.email), phone: str(r.phone), avatarUrl: str(r.avatar_url),
        isJunior: bool(r.is_junior), status: String(r.status) as never,
      })), skipDuplicates: true })],

    ['clubMembership', () => tx.clubMembership.createMany({
      data: S.ClubMembership.map(r => ({
        id: uuidFor(String(r.id)), playerId: ref(r.player_id)!, clubId: ref(r.club_id)!,
        isPrimary: bool(r.is_primary), startDate: date(r.start_date), endDate: date(r.end_date),
        status: String(r.status) as never,
      })), skipDuplicates: true })],

    ['associationMembership', () => tx.associationMembership.createMany({
      data: S.AssociationMembership.map(r => ({
        id: uuidFor(String(r.id)), playerId: ref(r.player_id)!, associationId: ref(r.association_id)!,
        isPrimary: bool(r.is_primary), status: String(r.status) as never,
      })), skipDuplicates: true })],

    ['teamPlayer', () => tx.teamPlayer.createMany({
      data: S.TeamPlayer.map(r => ({
        id: uuidFor(String(r.id)), teamId: ref(r.team_id)!, playerId: ref(r.player_id)!,
        status: String(r.status) as never, registerAt: ts(r.register_at),
      })), skipDuplicates: true })],

    ['utrLink', () => tx.utrLink.createMany({
      data: S.UtrLink.map(r => ({
        id: uuidFor(String(r.id)), playerId: ref(r.player_id)!, utrAccountId: str(r.utr_account_id),
        utrRating: str(r.utr_rating), lastSyncedAt: ts(r.last_synced_at), status: String(r.status) as never,
      })), skipDuplicates: true })],

    ['utrRatingSnapshot', () => tx.utrRatingSnapshot.createMany({
      data: S.UtrRatingSnapshot.map(r => ({
        id: uuidFor(String(r.id)), playerId: ref(r.player_id)!,
        discipline: (str(r.discipline) ?? undefined) as never,
        rating: String(r.rating), recordedAt: ts(r.recorded_at)!, source: str(r.source),
      })), skipDuplicates: true })],

    ['rankingCohort', () => tx.rankingCohort.createMany({
      data: S.RankingCohort.map(r => ({
        id: uuidFor(String(r.id)), name: String(r.name), description: str(r.description),
        associationId: ref(r.association_id), discipline: (str(r.discipline) ?? undefined) as never,
      })), skipDuplicates: true })],

    ['rankingEntry', () => tx.rankingEntry.createMany({
      data: S.RankingEntry.map(r => ({
        id: uuidFor(String(r.id)), cohortId: ref(r.cohort_id)!, playerId: ref(r.player_id)!,
        rank: Number(r.rank), rating: str(r.rating), percentileRank: str(r.percentile_rank),
        asOf: ts(r.as_of)!,
      })), skipDuplicates: true })],

    ['fixture', () => tx.fixture.createMany({
      data: S.Fixture.map(r => ({
        id: uuidFor(String(r.id)), sectionId: ref(r.section_id)!,
        homeTeamId: ref(r.home_team_id)!, awayTeamId: ref(r.away_team_id)!, venueId: ref(r.venue_id),
        roundNumber: int(r.round_number), roundLabel: str(r.round_label),
        scheduleDate: date(r.schedule_date), scheduleTime: time(r.schedule_time),
        status: String(r.status) as never, isFinals: bool(r.is_finals),
      })), skipDuplicates: true })],

    ['fixtureScheduleChange', () => tx.fixtureScheduleChange.createMany({
      data: S.FixtureScheduleChange.map(r => ({
        id: uuidFor(String(r.id)), fixtureId: ref(r.fixture_id)!, changeType: String(r.change_type) as never,
        previousDate: date(r.previous_date), previousTime: time(r.previous_time),
        newDate: date(r.new_date), newTime: time(r.new_time),
        previousVenueId: ref(r.previous_venue_id), newVenueId: ref(r.new_venue_id),
        reason: str(r.reason), changedBy: str(r.changed_by), changedAt: ts(r.changed_at)!,
      })), skipDuplicates: true })],

    ['matchResult', () => tx.matchResult.createMany({
      data: S.MatchResult.map(r => ({
        id: uuidFor(String(r.id)), fixtureId: ref(r.fixture_id)!,
        homeRubbers: int(r.home_rubbers), awayRubbers: int(r.away_rubbers),
        status: String(r.status) as never, outcome: str(r.outcome), notes: str(r.notes),
        enteredBy: str(r.entered_by), finalisedBy: str(r.finalised_by),
        enteredAt: ts(r.entered_at), finalisedAt: ts(r.finalised_at),
      })), skipDuplicates: true })],

    ['rubber', () => tx.rubber.createMany({
      data: S.Rubber.map(r => ({
        id: uuidFor(String(r.id)), matchResultId: ref(r.match_result_id)!, matchFormatId: ref(r.match_format_id),
        rubberNumber: int(r.rubber_number), rubberType: String(r.rubber_type) as never,
        winnerSide: (str(r.winner_side) ?? undefined) as never,
        outcomeType: (str(r.outcome_type) ?? undefined) as never,
        playedAt: ts(r.played_at), incompleteReason: str(r.incomplete_reason),
      })), skipDuplicates: true })],

    ['rubberSet', () => tx.rubberSet.createMany({
      data: S.RubberSet.map(r => ({
        id: uuidFor(String(r.id)), rubberId: ref(r.rubber_id)!, setNumber: int(r.set_number),
        homeGames: int(r.home_games), awayGames: int(r.away_games), isTiebreak: bool(r.is_tiebreak),
        homeTiebreakPoints: int(r.home_tiebreak_points), awayTiebreakPoints: int(r.away_tiebreak_points),
      })), skipDuplicates: true })],

    ['rubberPlayer', () => tx.rubberPlayer.createMany({
      data: S.RubberPlayer.map(r => ({
        id: uuidFor(String(r.id)), rubberId: ref(r.rubber_id)!, playerId: ref(r.player_id)!,
        side: String(r.side) as never, playerOrder: int(r.player_order), isEmergency: bool(r.is_emergency),
      })), skipDuplicates: true })],

    ['ladderEntry', () => tx.ladderEntry.createMany({
      data: S.LadderEntry.map(r => ({
        id: uuidFor(String(r.id)), sectionId: ref(r.section_id)!, teamId: ref(r.team_id)!,
        position: int(r.position), played: Number(r.played), won: Number(r.won),
        lost: Number(r.lost), drawn: Number(r.drawn),
        rubbersFor: Number(r.rubbers_for), rubbersAgainst: Number(r.rubbers_against),
        setsFor: Number(r.sets_for), setsAgainst: Number(r.sets_against),
        gamesFor: Number(r.games_for), gamesAgainst: Number(r.games_against),
        points: Number(r.points), calculatedAt: ts(r.calculated_at)!,
      })), skipDuplicates: true })],

    ['playerStanding', () => tx.playerStanding.createMany({
      data: S.PlayerStanding.map(r => ({
        id: uuidFor(String(r.id)), sectionId: ref(r.section_id)!, playerId: ref(r.player_id)!,
        position: int(r.position), rubbersPlayed: Number(r.rubbers_played),
        rubbersWon: Number(r.rubbers_won), rubbersLost: Number(r.rubbers_lost),
        setsWon: Number(r.sets_won), setsLost: Number(r.sets_lost),
        gamesWon: Number(r.games_won), gamesLost: Number(r.games_lost),
        winPercentage: str(r.win_percentage), calculatedAt: ts(r.calculated_at)!,
      })), skipDuplicates: true })],

    ['playerAward', () => tx.playerAward.createMany({
      data: S.PlayerAward.map(r => ({
        id: uuidFor(String(r.id)), playerId: ref(r.player_id)!, awardType: String(r.award_type) as never,
        title: String(r.title), competitionId: ref(r.competition_id), seasonId: ref(r.season_id),
        teamId: ref(r.team_id), awardedOn: date(r.awarded_on),
      })), skipDuplicates: true })],

    ['notification', () => {
      const rows = S.Notification.filter(r => userId.has(String(r._lookup_user_email)))
      skipped.notifications = S.Notification.length - rows.length
      return tx.notification.createMany({
        data: rows.map(r => ({
          id: uuidFor(String(r.id)), userId: userId.get(String(r._lookup_user_email))!,
          type: String(r.type) as never, title: String(r.title), message: String(r.message),
          details: nul(r.details) === null ? Prisma.DbNull : JSON.parse(String(r.details)),
          targetType: (str(r.target_type) ?? undefined) as never, targetId: ref(r.target_id),
          channel: String(r.channel) as never, deliveryStatus: String(r.delivery_status) as never,
          sentAt: ts(r.sent_at), readAt: ts(r.read_at), createdAt: ts(r.created_at)!,
        })), skipDuplicates: true })
    }],

    ['userRole', () => {
      const rows = S.UserRole.filter(r => userId.has(String(r._lookup_user_email)))
      skipped.userRoles = S.UserRole.length - rows.length
      return tx.userRole.createMany({
        data: rows.map(r => ({
          id: uuidFor(String(r.id)), userId: userId.get(String(r._lookup_user_email))!,
          roleType: String(r.role_type) as never, contextType: String(r.context_type) as never,
          associationId: ref(r.association_id), clubId: ref(r.club_id),
          teamId: ref(r.team_id), competitionId: ref(r.competition_id),
          grantedAt: ts(r.granted_at),
        })), skipDuplicates: true })
    }],
  ]

  const inserted: Record<string, number> = {}
  for (const [name, run] of steps) {
    inserted[name] = dryRun ? (S[name[0].toUpperCase() + name.slice(1)]?.length ?? 0) : (await run()).count
  }

  return {
    dryRun,
    accountsLinked: users.length,
    accountsMissing: unlinked.length,
    unlinkedSample: unlinked.slice(0, 5),
    skipped,
    [dryRun ? 'rowsInWorkbook' : 'inserted']: inserted,
  }
}

async function main() {
  const flags = process.argv.slice(2)
  const unknown = flags.filter(f => f !== '--dry-run')
  if (unknown.length) throw new Error(`Unsupported option(s): ${unknown.join(', ')}. Only --dry-run is available.`)
  const dryRun = flags.includes('--dry-run')

  const sheets = readSheets(WORKBOOK)
  const db = new PrismaClient()
  try {
    const result = await db.$transaction(tx => seedCompetition(tx, sheets, dryRun), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      timeout: 120_000,
    })
    console.log(dryRun
      ? 'Dry run: nothing was written.'
      : 'Competition data seeded. Existing users and passwords were not modified.')
    console.log(JSON.stringify(result, null, 2))
    if (result.accountsMissing) {
      console.log(`\n${result.accountsMissing} login account(s) were not found in this database.`)
      console.log('Player profiles for them were still created, just without a login link.')
      console.log('Run the user seed first if you want them connected: npx prisma db seed')
    }
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
