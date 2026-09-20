import { Injectable, ServiceUnavailableException } from '@nestjs/common'
import { EngageUtrProvider, MockUtrProvider, UtrProvider } from './utr.provider'
import { UtrConnectionStore } from './utr.types'

@Injectable()
export class UtrService {
  private readonly mode = process.env.UTR_PROVIDER ?? 'disabled'
  private readonly provider: UtrProvider | null

  constructor(private readonly connections: UtrConnectionStore) {
    if (!['disabled', 'mock', 'engage'].includes(this.mode)) throw new Error('Invalid UTR_PROVIDER')
    if (this.mode === 'mock' && process.env.NODE_ENV === 'production') {
      throw new Error('Mock UTR data is not allowed in production')
    }
    this.provider = this.mode === 'mock' ? new MockUtrProvider()
      : this.mode === 'engage' ? new EngageUtrProvider(process.env.UTR_API_BASE_URL
        || 'https://prod-utr-engage-api-data-azapp.azurewebsites.net/api/v1') : null
  }

  /** Caller must establish authenticated ownership of playerId before calling. */
  async syncUTRRating(playerId: string) {
    if (!playerId.trim()) throw new ServiceUnavailableException('A linked player is required')
    if (!this.provider) throw new ServiceUnavailableException('UTR integration is not configured')
    const token = this.mode === 'engage' ? await this.connections.getAccessToken(playerId) : undefined
    return this.provider.getRatings(token ?? undefined)
  }

  async getDemoRating() {
    if (this.mode !== 'mock' || process.env.NODE_ENV === 'production') {
      throw new ServiceUnavailableException('UTR demo is disabled')
    }
    return this.syncUTRRating('development-fixture')
  }
}
