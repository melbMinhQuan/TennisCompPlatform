import { Injectable, NotFoundException } from '@nestjs/common'
import type { Notification } from '@prisma/client'
import { readOrUnavailable } from '../common/data-unavailable'
import { PrismaService } from '../prisma/prisma.service'
import type { ClubAdminNotification } from './club-admin.types'

/** The club admin's in-app notices. EMAIL rows are the same events sent by mail, so they are never listed. */
const inApp = (userId: string) => ({ userId, channel: 'IN_APP' as const })

/**
 * The admin's own notices and their read state. A user holds one role, so
 * every notice sent to a club admin's account is about their club; there is
 * no separate club filter. Only the recipient can see or mark a notice.
 */
@Injectable()
export class ClubAdminNotificationService {
  constructor(private readonly prisma: PrismaService) {}

  /** Every in-app notice, newest first, with the fixture each one is about named. */
  async list(userId: string): Promise<ClubAdminNotification[]> {
    return readOrUnavailable(async () => {
      const rows = await this.prisma.notification.findMany({ where: inApp(userId), orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] })
      const matches = await this.matchLabels(rows)
      return rows.map(row => this.item(row, matches))
    }, 'Notifications are unavailable right now')
  }

  /** Marks one notice read. Already read keeps its first read time; anyone else's notice is a 404. */
  async markRead(userId: string, notificationId: string): Promise<ClubAdminNotification> {
    return readOrUnavailable(async () => {
      const row = await this.prisma.notification.findFirst({ where: { id: notificationId, ...inApp(userId) } })
      if (!row) throw new NotFoundException({ statusCode: 404, code: 'NOTIFICATION_NOT_FOUND', message: 'Notification not found' })
      const read = row.readAt ? row : await this.prisma.notification.update({ where: { id: row.id }, data: { readAt: new Date() } })
      return this.item(read, await this.matchLabels([read]))
    }, 'Notifications cannot be updated right now')
  }

  /** Marks every unread notice read and says how many changed. */
  async markAllRead(userId: string): Promise<{ updated: number }> {
    return readOrUnavailable(async () => {
      const { count } = await this.prisma.notification.updateMany({ where: { ...inApp(userId), readAt: null }, data: { readAt: new Date() } })
      return { updated: count }
    }, 'Notifications cannot be updated right now')
  }

  /** "Round 13 · Syndal A vs Glen Waverley A" for each fixture the notices point at, by fixture ID. */
  private async matchLabels(rows: Notification[]): Promise<Map<string, string>> {
    const fixtureIds = [...new Set(rows.filter(row => row.targetType === 'FIXTURE' && row.targetId).map(row => row.targetId!))]
    if (!fixtureIds.length) return new Map()
    const fixtures = await this.prisma.fixture.findMany({
      where: { id: { in: fixtureIds } },
      include: { homeTeam: { select: { name: true } }, awayTeam: { select: { name: true } } },
    })
    return new Map(fixtures.map(fixture => {
      // A finals fixture has a label and no round number.
      const round = fixture.roundLabel ?? (fixture.roundNumber === null ? null : `Round ${fixture.roundNumber}`)
      return [fixture.id, [round, `${fixture.homeTeam.name} vs ${fixture.awayTeam.name}`].filter(Boolean).join(' · ')]
    }))
  }

  private item(row: Notification, matches: Map<string, string>): ClubAdminNotification {
    return {
      id: row.id, type: row.type, title: row.title, message: row.message,
      match: row.targetType === 'FIXTURE' && row.targetId ? matches.get(row.targetId) ?? null : null,
      details: row.details !== null && typeof row.details === 'object' && !Array.isArray(row.details) ? row.details as Record<string, unknown> : null,
      targetType: row.targetType, targetId: row.targetId,
      readAt: row.readAt?.toISOString() ?? null, createdAt: row.createdAt.toISOString(),
    }
  }
}
