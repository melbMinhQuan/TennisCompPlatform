import { BadRequestException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common'
import { isEmail } from 'class-validator'
import type { Request } from 'express'
import { readOrUnavailable } from '../data-unavailable'
import { PrismaService } from '../../prisma/prisma.service'

export interface CurrentUser {
  id: string
  email: string
}

/**
 * Works out which user sent a request. Guards depend on this class rather than
 * on how the user was identified, so the demo lookup below can be replaced by
 * Microsoft Entra External ID token validation without touching them.
 */
export abstract class CurrentUserResolver {
  abstract resolve(request: Request): Promise<CurrentUser>
}

/**
 * Identifies the user by ?email=, the same local showcase as DemoEmailGuard.
 * It is not authentication, so it is refused in production.
 */
@Injectable()
export class DemoEmailUserResolver extends CurrentUserResolver {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async resolve(request: Request): Promise<CurrentUser> {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException({ statusCode: 403, code: 'DEMO_DISABLED', message: 'Email-based access is disabled in production' })
    }
    const raw = request.query.email
    const email = typeof raw === 'string' ? raw.trim().toLowerCase() : ''
    if (email.length > 254 || !isEmail(email)) {
      throw new BadRequestException({ statusCode: 400, message: 'A valid email is required' })
    }
    const user = await readOrUnavailable(
      () => this.prisma.user.findUnique({ where: { email }, select: { id: true, email: true } }),
      'Sign-in is unavailable right now',
    )
    if (!user) throw new UnauthorizedException({ statusCode: 401, code: 'UNAUTHENTICATED', message: 'Account not found' })
    return user
  }
}
