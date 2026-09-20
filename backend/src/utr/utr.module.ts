import { Controller, Get, Header, Module } from '@nestjs/common'
import { UtrService } from './utr.service'
import { UtrConnectionStore } from './utr.types'

/** Connection point: replace this provider with the client's OAuth token store. */
class UnconnectedUtrStore extends UtrConnectionStore {
  async getAccessToken(_playerId: string): Promise<string | null> { return null }
}

@Controller('api/v1/utr')
class UtrController {
  constructor(private readonly utr: UtrService) {}

  @Get('demo-rating')
  @Header('Cache-Control', 'no-store')
  async demo() { return { data: await this.utr.getDemoRating() } }
}

@Module({
  controllers: [UtrController],
  providers: [UtrService, { provide: UtrConnectionStore, useClass: UnconnectedUtrStore }],
  exports: [UtrService],
})
export class UtrModule {}
