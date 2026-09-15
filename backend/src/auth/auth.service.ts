import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  // Plain-text password check for now: no hashing, no tokens, no sessions.
  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    })

    return user && user.passwordHash === password ? 'login_success' : 'login_failed'
  }
}
