import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common'
import * as bcrypt from 'bcryptjs'
import { PrismaService } from '../prisma/prisma.service'

export type LoginResult = 'login_success' | 'login_failed'

export interface LoginResponse {
  result: LoginResult
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(private prisma: PrismaService) {}

  /**
   * Checks an email and password against the user table.
   * Returns { result: 'login_success' } when they match and
   * { result: 'login_failed' } when the email is unknown or the password is wrong.
   *
   * The stored value is a bcrypt hash, so the password is compared with
   * bcrypt.compare rather than a plain equality check.
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: email.trim().toLowerCase() },
      })

      if (!user) return { result: 'login_failed' }

      const passwordMatches = await bcrypt.compare(password, user.passwordHash)
      return { result: passwordMatches ? 'login_success' : 'login_failed' }
    } catch (error) {
      this.logger.error('Could not verify the login credentials', error)
      throw new InternalServerErrorException('Login is unavailable right now')
    }
  }
}
