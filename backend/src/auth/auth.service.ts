import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

export type LoginResult = 'login_success' | 'login_failed'

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(private prisma: PrismaService) {}

  /**
   * Checks an email and password against the user table.
   * Returns 'login_success' when they match, 'login_failed' when the email is
   * unknown or the password is wrong.
   *
   * Passwords are compared in plain text for now - no hashing yet, so this
   * does not meet the team standard on password storage.
   */
  async login(email: string, password: string): Promise<LoginResult> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: email.trim().toLowerCase() },
      })

      return user && user.passwordHash === password ? 'login_success' : 'login_failed'
    } catch (error) {
      this.logger.error('Could not read the user table while logging in', error)
      throw new InternalServerErrorException('Login is unavailable right now')
    }
  }
}
