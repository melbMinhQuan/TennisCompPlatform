import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { fullName } from './player-mappers'
import type { PlayerIdentity } from './player.types'

@Injectable()
export class PlayerLookupService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Finds the player profile linked to a login email.
   * Throws 404 USER_NOT_FOUND for an unknown email and 404
   * PLAYER_PROFILE_NOT_LINKED for an account with no player, the same codes
   * the dashboard uses so the frontend can treat both endpoints alike.
   */
  async findByEmail(email: string): Promise<PlayerIdentity> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { player: { select: { id: true, firstName: true, lastName: true } } },
    })
    if (!user) throw new NotFoundException({ statusCode: 404, code: 'USER_NOT_FOUND', message: 'Account not found' })
    if (!user.player) {
      throw new NotFoundException({
        statusCode: 404, code: 'PLAYER_PROFILE_NOT_LINKED',
        message: 'Login account found, but it does not have a linked player profile yet.',
      })
    }
    return { id: user.player.id, displayName: fullName(user.player) }
  }
}
