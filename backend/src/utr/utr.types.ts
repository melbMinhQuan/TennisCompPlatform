/** Internal contract shared by the mock and Engage adapters. No ratings are calculated here. */
export interface UtrRatings {
  source: 'mock' | 'utr'
  fetchedAt: string
  singles: number | null
  doubles: number | null
  unverifiedSingles: number | null
  unverifiedDoubles: number | null
  estimated: string | null
}

/** Implement this using the client's authenticated OAuth connection/token store. */
export abstract class UtrConnectionStore {
  abstract getAccessToken(playerId: string): Promise<string | null>
}
