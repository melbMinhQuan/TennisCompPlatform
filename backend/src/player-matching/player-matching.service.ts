import { Injectable } from '@nestjs/common'
import { fullName } from '../player/player-mappers'
import { PrismaService } from '../prisma/prisma.service'
import { firstNameFit, lastNameFit, nameFit, parseWrittenName } from './names'
import type { Candidate, DuplicatePair, PlayerMatch, RecordedPlayer } from './player-matching.types'

/** "2026-05-10" from a date or a date string, or null when it is not a date. */
function day(value: Date | string | null | undefined): string | null {
  if (!value) return null
  const date = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00Z`) : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10)
}

/** A season with no start or end date is open on that side. */
function inSeason(season: { startDate: Date | null; endDate: Date | null }, matchDay: string): boolean {
  return (!season.startDate || day(season.startDate)! <= matchDay) && (!season.endDate || matchDay <= day(season.endDate)!)
}

/** Groups rows into sets of values by key, e.g. each player's fixtures. */
function groupSets<T>(rows: T[], keyOf: (row: T) => string, valueOf: (row: T) => string): Map<string, Set<string>> {
  const sets = new Map<string, Set<string>>()
  for (const row of rows) sets.set(keyOf(row), (sets.get(keyOf(row)) ?? new Set<string>()).add(valueOf(row)))
  return sets
}

/** The same key for a pair of players whichever order they come in. */
const pairKey = (firstId: string, secondId: string) => [firstId, secondId].sort().join('|')

/**
 * Identifies players from incomplete names (MATCH-*) and finds profiles that are probably one
 * person registered twice (DUP-*). The rules are in docs/player-matching.md.
 */
@Injectable()
export class PlayerMatchingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * The registered player a scoresheet means. Only that team's roster, in the season the match
   * was played, is searched. Exactly one player who fits is a match; two or more are returned
   * for an administrator to choose between, never guessed.
   */
  async matchRecordedPlayer(recorded: RecordedPlayer): Promise<PlayerMatch> {
    const written = parseWrittenName(recorded.name)
    if (!written) return { status: 'unmatched', reason: 'No name was written' }
    const matchDay = day(recorded.matchDate)
    if (!matchDay) return { status: 'unmatched', reason: `"${String(recorded.matchDate)}" is not a match date` }

    const named = await this.teamsFor(recorded)
    if (!named.length) return { status: 'unmatched', reason: `No team ${recorded.teamName ? `called "${recorded.teamName}"` : `with id ${recorded.teamId}`}` }
    const teams = named.filter(team => inSeason(team.section.season, matchDay))
    if (!teams.length) return { status: 'unmatched', reason: `${named[0].name} has no season that includes ${matchDay}` }

    const roster = await this.prisma.teamPlayer.findMany({
      where: { teamId: { in: teams.map(team => team.id) } },
      select: { team: { select: { name: true } }, player: { select: { id: true, firstName: true, lastName: true, dateOfBirth: true } } },
    })
    const born = day(recorded.dateOfBirth)
    const fits = new Map<string, Candidate>()
    for (const { team, player } of roster) {
      const reasons = nameFit(written, player)
      if (!reasons || fits.has(player.id)) continue
      if (born && day(player.dateOfBirth) !== born) continue
      if (born) reasons.push('same date of birth')
      fits.set(player.id, { playerId: player.id, name: fullName(player), reasons: [...reasons, `on the ${team.name} roster`] })
    }

    const candidates = [...fits.values()].sort((left, right) => left.name.localeCompare(right.name))
    if (candidates.length === 1) return { status: 'matched', ...candidates[0] }
    if (candidates.length > 1) return { status: 'ambiguous', candidates }
    return { status: 'unmatched', reason: `Nobody on the ${teams[0].name} roster for ${matchDay} fits "${recorded.name.trim()}"${born ? ` born ${born}` : ''}` }
  }

  /** The team a scoresheet names, by id or by name (ignoring case), with its season dates. */
  private async teamsFor(recorded: RecordedPlayer) {
    const select = { id: true, name: true, section: { select: { season: { select: { startDate: true, endDate: true } } } } } as const
    if (recorded.teamId) {
      const team = await this.prisma.team.findUnique({ where: { id: recorded.teamId }, select })
      return team ? [team] : []
    }
    const name = recorded.teamName?.trim()
    return name ? this.prisma.team.findMany({ where: { name: { equals: name, mode: 'insensitive' } }, select }) : []
  }

  /**
   * Pairs of profiles that are probably one person registered twice: the same date of birth and
   * names that fit each other ("Josh Smith" and "Joshua Smith"). Two profiles that played in
   * the same match are two people, and a pair already in a ProfileMergeRequest (pending,
   * approved or rejected) has been decided on or is waiting, so neither is returned.
   */
  async findDuplicateProfiles(): Promise<DuplicatePair[]> {
    const players = await this.prisma.player.findMany({
      select: { id: true, firstName: true, lastName: true, dateOfBirth: true }, orderBy: { id: 'asc' },
    })
    const byBirthday = groupLists(players, player => day(player.dateOfBirth)!)
    const likely: { playerA: (typeof players)[number]; playerB: (typeof players)[number]; dateOfBirth: string; reasons: string[] }[] = []
    for (const [dateOfBirth, group] of byBirthday) {
      for (const [i, player] of group.entries()) {
        for (const otherPlayer of group.slice(i + 1)) {
          const first = firstNameFit(player.firstName, otherPlayer.firstName) ?? firstNameFit(otherPlayer.firstName, player.firstName)
          const last = lastNameFit(player.lastName, otherPlayer.lastName)
          if (first && last) likely.push({ playerA: player, playerB: otherPlayer, dateOfBirth, reasons: ['same date of birth', first, last] })
        }
      }
    }
    if (!likely.length) return []

    const ids = [...new Set(likely.flatMap(({ playerA, playerB }) => [playerA.id, playerB.id]))]
    const [raised, played, memberships] = await Promise.all([
      this.prisma.profileMergeRequest.findMany({
        where: { OR: [{ playerAId: { in: ids } }, { playerBId: { in: ids } }] }, select: { playerAId: true, playerBId: true },
      }),
      this.prisma.rubberPlayer.findMany({
        where: { playerId: { in: ids } }, select: { playerId: true, rubber: { select: { matchResult: { select: { fixtureId: true } } } } },
      }),
      this.prisma.clubMembership.findMany({ where: { playerId: { in: ids } }, select: { playerId: true, club: { select: { name: true } } } }),
    ])
    const alreadyRaised = new Set(raised.map(request => pairKey(request.playerAId, request.playerBId)))
    const fixturesOf = groupSets(played, row => row.playerId, row => row.rubber.matchResult.fixtureId)
    const clubsOf = groupSets(memberships, row => row.playerId, row => row.club.name)
    const playedTogether = (firstId: string, secondId: string) => [...(fixturesOf.get(firstId) ?? [])].some(fixture => fixturesOf.get(secondId)?.has(fixture))

    return likely
      .filter(({ playerA, playerB }) => !alreadyRaised.has(pairKey(playerA.id, playerB.id)) && !playedTogether(playerA.id, playerB.id))
      .map(({ playerA, playerB, dateOfBirth, reasons }) => ({
        playerAId: playerA.id,
        playerBId: playerB.id,
        names: [fullName(playerA), fullName(playerB)],
        dateOfBirth,
        reasons: [...reasons, ...[...(clubsOf.get(playerA.id) ?? [])].filter(club => clubsOf.get(playerB.id)?.has(club)).map(club => `both at ${club}`)],
      }))
  }

  /** Raises a PENDING ProfileMergeRequest for each new pair, for an administrator to confirm. */
  async raiseMergeRequests(): Promise<DuplicatePair[]> {
    const pairs = await this.findDuplicateProfiles()
    if (pairs.length) {
      await this.prisma.profileMergeRequest.createMany({
        data: pairs.map(pair => ({
          playerAId: pair.playerAId,
          playerBId: pair.playerBId,
          status: 'PENDING' as const,
          note: `Found automatically: ${pair.names[0]} and ${pair.names[1]} may be one person (${pair.reasons.join('; ')}). Confirm before merging.`,
        })),
      })
    }
    return pairs
  }
}

/** Groups rows into lists by key, keeping their order. */
function groupLists<T>(rows: T[], keyOf: (row: T) => string): Map<string, T[]> {
  const lists = new Map<string, T[]>()
  for (const row of rows) lists.set(keyOf(row), [...(lists.get(keyOf(row)) ?? []), row])
  return lists
}
