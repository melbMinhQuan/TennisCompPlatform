import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  /** Opens the database connection when the app starts, so the first request does not wait for it. */
  async onModuleInit() { await this.$connect() }
  /** Closes the database connection when the app shuts down. */
  async onModuleDestroy() { await this.$disconnect() }
}
