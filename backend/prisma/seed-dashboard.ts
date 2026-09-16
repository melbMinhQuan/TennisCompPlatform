/**
 * Add synthetic dashboard data to the 100 existing spreadsheet accounts.
 * Does not create/update Users, passwords, the schema, or real player profiles.
 * Run from the repository root:
 * node --env-file=backend/.env --import tsx backend/prisma/seed-dashboard.ts [--dry-run]
 */
import { Prisma, PrismaClient } from '@prisma/client'
import { createHash } from 'node:crypto'
import * as path from 'node:path'
import * as XLSX from 'xlsx'

const NAMESPACE = 'tenniscomp:dashboard-demo:v1'
const MARKER_ID = demoId('seed-marker')
export interface SeedEntry { sourceId: number; fullName: string; email: string }

/** Stable UUIDs make reruns and spreadsheet row reordering harmless. */
export function demoId(key: string): string {
  const hex = createHash('sha256').update(`${NAMESPACE}:${key}`).digest('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-8${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`
}

export function readEntries(file = path.resolve(__dirname, '../../players_login_data.xlsx')): SeedEntry[] {
  const workbook = XLSX.readFile(file)
  const sheet = workbook.Sheets.Players
  if (!sheet) throw new Error('Spreadsheet must contain a Players sheet')
  // Deliberately never use the password column.
  const entries = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet).map(row => ({
    sourceId: Number(row.player_id),
    fullName: typeof row.full_name === 'string' ? row.full_name.trim() : '',
    email: typeof row.email === 'string' ? row.email.trim().toLowerCase() : '',
  })).sort((a, b) => a.sourceId - b.sourceId)
  if (entries.length !== 100) throw new Error(`Expected the original 100 spreadsheet accounts; found ${entries.length}`)
  if (entries.some(e => !Number.isSafeInteger(e.sourceId) || e.sourceId < 1 || !e.fullName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.email))) {
    throw new Error('Each row needs a positive player_id, full_name and valid email')
  }
  if (new Set(entries.map(e => e.email)).size !== entries.length || new Set(entries.map(e => e.sourceId)).size !== entries.length) {
    throw new Error('Duplicate player_id or email in spreadsheet')
  }
  return entries
}

function dateAfter(anchor: string, days: number): Date {
  const date = new Date(`${anchor}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date
}

/** Called inside one transaction: either the complete graph is inserted or nothing is. */
export async function seedDashboard(tx: Prisma.TransactionClient, entries: SeedEntry[], dryRun = false) {
  const users = await tx.user.findMany({
    where: { email: { in: entries.map(e => e.email) } },
    select: { id: true, email: true, player: { select: { id: true, mergeIntoId: true } } },
  })
  const byEmail = new Map(users.map(u => [u.email, u]))
  if (users.length !== entries.length) {
    throw new Error(`${entries.length - users.length} spreadsheet accounts are missing. Run the original user seed first; no dashboard data was written.`)
  }
  const orphans = await tx.player.count({ where: { userId: null, email: { in: entries.map(e => e.email) } } })
  if (orphans) throw new Error(`${orphans} unlinked profiles already use spreadsheet emails. Link them to their Users first to avoid duplicates.`)

  const marker = await tx.auditLog.findUnique({ where: { id: MARKER_ID } })
  const today = new Date().toISOString().slice(0, 10)
  const anchor: string = marker ? JSON.parse(marker.changeSummary!).anchorDate : today
  if (typeof anchor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(anchor) || !Number.isFinite(Date.parse(anchor)) || dateAfter(anchor, 0).toISOString().slice(0, 10) !== anchor) {
    throw new Error('Invalid demo seed marker; refusing to change the existing demo calendar')
  }

  const associationId = demoId('association'), competitionId = demoId('competition')
  const seasonId = demoId('season'), sectionId = demoId('section'), formatId = demoId('format')
  const clubNames = ['Central Park', 'Riverside', 'Bayview', 'Oakwood', 'Lakeside']
  const clubs: Prisma.ClubCreateManyInput[] = clubNames.map((name, i) => ({
    id: demoId(`club:${i}`), associationId, name: `Demo ${name} Tennis Club`,
    address: `Sample court ${i + 1}, Example Park (fictional)`, email: `club${i + 1}@example.test`,
    status: 'ACTIVE',
  }))
  const teams: Prisma.TeamCreateManyInput[] = Array.from({ length: 10 }, (_, i) => ({
    id: demoId(`team:${i}`), clubId: clubs[i % 5].id!, sectionId,
    name: `Demo ${clubNames[i % 5]} ${Math.floor(i / 5) + 1}`,
  }))
  const players: Prisma.PlayerCreateManyInput[] = []
  const clubMemberships: Prisma.ClubMembershipCreateManyInput[] = []
  const associationMemberships: Prisma.AssociationMembershipCreateManyInput[] = []
  const teamPlayers: Prisma.TeamPlayerCreateManyInput[] = []
  const utrLinks: Prisma.UtrLinkCreateManyInput[] = []
  const rosters: (string | undefined)[][] = Array.from({ length: 10 }, () => Array(10).fill(undefined))
  let preservedProfiles = 0

  entries.forEach((entry, index) => {
    const user = byEmail.get(entry.email)!
    const playerId = demoId(`player:${user.id}`)
    // Real profiles (or merged profiles) are left completely untouched.
    if (user.player && (user.player.id !== playerId || user.player.mergeIntoId)) {
      preservedProfiles++
      return
    }
    const name = entry.fullName.split(/\s+/)
    const teamIndex = Math.floor(index / 10), team = teams[teamIndex]
    players.push({
      id: playerId, userId: user.id, firstName: name[0], lastName: name.slice(1).join(' '),
      email: user.email, phone: `DEMO-${String(index + 1).padStart(4, '0')}`,
      // Synthetic adult dates/genders, never inferred from a person's name.
      dateOfBirth: new Date(Date.UTC(1982 + index % 22, index % 12, 1 + index % 28)),
      gender: (['MALE', 'FEMALE', 'OTHER'] as const)[index % 3], isJunior: false, status: 'ACTIVE',
    })
    clubMemberships.push({
      id: demoId(`club-member:${playerId}`), playerId, clubId: team.clubId,
      isPrimary: true, status: 'ACTIVE', startDate: dateAfter(anchor, -60),
    })
    associationMemberships.push({
      id: demoId(`association-member:${playerId}`), playerId, associationId, isPrimary: true, status: 'ACTIVE',
    })
    teamPlayers.push({
      id: demoId(`team-member:${playerId}`), playerId, teamId: team.id!, status: 'ACTIVE', registerAt: dateAfter(anchor, -60),
    })
    utrLinks.push({
      id: demoId(`rating:${playerId}`), playerId, utrAccountId: `demo:${entry.sourceId}`,
      utrRating: (2.5 + (index * 37 % 950) / 100).toFixed(2), status: 'ACTIVE', lastSyncedAt: null,
    })
    rosters[teamIndex][index % 10] = playerId
  })

  // Every full team: six singles and two doubles, involving all ten players once.
  const slots = [[0], [1], [2], [3], [4], [5], [6, 7], [8, 9]]
  const fixtures: Prisma.FixtureCreateManyInput[] = []
  const results: Prisma.MatchResultCreateManyInput[] = []
  const rubbers: Prisma.RubberCreateManyInput[] = []
  const rubberPlayers: Prisma.RubberPlayerCreateManyInput[] = []
  const sets: Prisma.RubberSetCreateManyInput[] = []
  const offsets = [-28, -21, -14, -7, 7, 14, 21, 28]

  offsets.forEach((offset, round) => {
    for (let pair = 0; pair < 5; pair++) {
      const homeIndex = pair * 2, awayIndex = homeIndex + 1
      const home = rosters[homeIndex], away = rosters[awayIndex]
      if (!home.some(Boolean) || !away.some(Boolean)) continue
      const playable = slots.map((positions, number) => ({ positions, number }))
        .filter(({ positions }) => positions.every(position => home[position] && away[position]))
      const completed = offset < 0
      if (completed && !playable.length) continue
      const fixtureId = demoId(`fixture:${round}:${pair}`), resultId = demoId(`result:${round}:${pair}`)
      const scheduledDate = dateAfter(anchor, offset)
      fixtures.push({
        id: fixtureId, sectionId, homeTeamId: teams[homeIndex].id!, awayTeamId: teams[awayIndex].id!,
        roundNumber: round + 1, scheduleDate: scheduledDate,
        scheduleTime: new Date(`1970-01-01T${pair % 2 ? '13' : '09'}:00:00Z`),
        status: completed ? 'COMPLETED' : 'SCHEDULED',
      })
      if (!completed) continue
      let homeWins = 0
      for (const { positions, number } of playable) {
        const rubberId = demoId(`rubber:${round}:${pair}:${number}`)
        const homeWon = (number + round + pair) % 3 !== 0
        if (homeWon) homeWins++
        rubbers.push({
          id: rubberId, matchResultId: resultId, matchFormatId: formatId,
          rubberNumber: number + 1, rubberType: positions.length === 1 ? 'SINGLES' : 'DOUBLES',
        })
        positions.forEach((position, order) => {
          for (const [side, playerId] of [['HOME', home[position]!], ['AWAY', away[position]!]] as const) {
            rubberPlayers.push({ id: demoId(`participant:${rubberId}:${side}:${order}`), rubberId, playerId, side, playerOrder: order + 1 })
          }
        })
        for (let set = 1; set <= 2; set++) {
          const loserGames = 2 + (number + round + set) % 3
          sets.push({ id: demoId(`set:${rubberId}:${set}`), rubberId, setNumber: set,
            homeGames: homeWon ? 6 : loserGames, awayGames: homeWon ? loserGames : 6, isTiebreak: false })
        }
      }
      const awayWins = playable.length - homeWins
      results.push({
        id: resultId, fixtureId, homeRubbers: homeWins, awayRubbers: awayWins, status: 'FINALISED',
        outcome: homeWins === awayWins ? 'DRAW' : homeWins > awayWins ? 'HOME_WIN' : 'AWAY_WIN',
        notes: 'Fictional dashboard demonstration result; not a real match.',
        enteredAt: new Date(scheduledDate.getTime() + 18 * 3600000),
        finalisedAt: new Date(scheduledDate.getTime() + 19 * 3600000),
      })
    }
  })

  if (!players.length) return { dryRun, anchorDate: anchor, matchedUsers: users.length, preservedProfiles, inserted: {} }

  // Ordered inserts satisfy all foreign keys. skipDuplicates preserves edited seed
  // records as well as existing ratings/memberships; nothing uses update or delete.
  const steps: [string, number, () => Promise<{ count: number }>][] = [
    ['associations', 1, () => tx.association.createMany({ data: [{ id: associationId, name: 'Demo Waverley Association', email: 'association@example.test' }], skipDuplicates: true })],
    ['clubs', clubs.length, () => tx.club.createMany({ data: clubs, skipDuplicates: true })],
    ['competitions', 1, () => tx.competition.createMany({ data: [{ id: competitionId, associationId, name: 'Demo Team Competition', type: 'DEMO_MIXED_TEAMS' }], skipDuplicates: true })],
    ['seasons', 1, () => tx.season.createMany({ data: [{ id: seasonId, competitionId, year: Number(anchor.slice(0, 4)), seasonType: 'DEMO', startDate: dateAfter(anchor, -35), endDate: dateAfter(anchor, 35) }], skipDuplicates: true })],
    ['sections', 1, () => tx.sectionGrade.createMany({ data: [{ id: sectionId, seasonId, name: 'Demo Open Grade', ageGroup: 'Adult', minAge: 18, teamCount: 10 }], skipDuplicates: true })],
    ['teams', teams.length, () => tx.team.createMany({ data: teams, skipDuplicates: true })],
    ['players', players.length, () => tx.player.createMany({ data: players, skipDuplicates: true })],
    ['clubMemberships', clubMemberships.length, () => tx.clubMembership.createMany({ data: clubMemberships, skipDuplicates: true })],
    ['associationMemberships', associationMemberships.length, () => tx.associationMembership.createMany({ data: associationMemberships, skipDuplicates: true })],
    ['teamPlayers', teamPlayers.length, () => tx.teamPlayer.createMany({ data: teamPlayers, skipDuplicates: true })],
    ['ratings', utrLinks.length, () => tx.utrLink.createMany({ data: utrLinks, skipDuplicates: true })],
    ['formats', 1, () => tx.matchFormat.createMany({ data: [{ id: formatId, competitionId, name: 'Demo: six singles, two doubles', rubberCount: 8, singlesCount: 6, doublesCount: 2, setFormat: 'Best of 3 standard sets', setToWin: 2, tiebreakRule: 'At 6-6', winnerDeterminedBy: 'Rubbers won', allowDraw: true }], skipDuplicates: true })],
    ['fixtures', fixtures.length, () => tx.fixture.createMany({ data: fixtures, skipDuplicates: true })],
    ['results', results.length, () => tx.matchResult.createMany({ data: results, skipDuplicates: true })],
    ['rubbers', rubbers.length, () => tx.rubber.createMany({ data: rubbers, skipDuplicates: true })],
    ['rubberPlayers', rubberPlayers.length, () => tx.rubberPlayer.createMany({ data: rubberPlayers, skipDuplicates: true })],
    ['sets', sets.length, () => tx.rubberSet.createMany({ data: sets, skipDuplicates: true })],
    ['seedMarkers', 1, () => tx.auditLog.createMany({ data: [{ id: MARKER_ID, entityType: 'DASHBOARD_DEMO_SEED', action: 'SYNTHETIC_DATA_CREATED', changeSummary: JSON.stringify({ namespace: NAMESPACE, anchorDate: anchor, description: 'Synthetic DOB, gender, contact placeholders, memberships, ratings and matches. Names/emails from local spreadsheet.' }) }], skipDuplicates: true })],
  ]
  const counts: Record<string, number> = {}
  for (const [name, planned, insert] of steps) counts[name] = dryRun ? planned : (await insert()).count
  return { dryRun, anchorDate: anchor, matchedUsers: users.length, preservedProfiles, [dryRun ? 'plannedRecordsBeforeDeduplication' : 'inserted']: counts }
}

async function main() {
  if (process.env.NODE_ENV === 'production') throw new Error('Synthetic dashboard seed is disabled in production')
  const flags = process.argv.slice(2)
  if (flags.some(flag => flag !== '--dry-run')) throw new Error('Supported option: --dry-run')
  const dryRun = flags.includes('--dry-run')
  const entries = readEntries()
  const db = new PrismaClient()
  try {
    const result = await db.$transaction(tx => seedDashboard(tx, entries, dryRun), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 60000,
    })
    console.log(dryRun ? 'Dry run: no database changes.' : 'Synthetic dashboard data seeded. Existing users/passwords/records were not updated.')
    console.log(JSON.stringify(result, null, 2))
  } finally { await db.$disconnect() }
}

if (require.main === module) main().catch(error => {
  // Do not print SQL/connection strings or spreadsheet contents on failure.
  console.error(error instanceof Prisma.PrismaClientKnownRequestError || error instanceof Prisma.PrismaClientInitializationError
    ? 'Database seed failed. Check connectivity, migrations and conflicting records; the transaction was rolled back.'
    : error instanceof Error ? error.message : 'Dashboard seed failed')
  process.exitCode = 1
})
