import { BadGatewayException, HttpException, ServiceUnavailableException } from '@nestjs/common'
import type { UtrRatings } from './utr.types'

export interface UtrProvider {
  getRatings(accessToken?: string): Promise<UtrRatings>
}

// Fixture follows Engage's response shape. It is never written into player records.
const sample = {
  UTR: { Singles: 6.25, Doubles: 5.75, UnverifiedSingles: null, UnverifiedDoubles: null, Estimated: null },
}

export function mapRatings(body: unknown, source: UtrRatings['source']): UtrRatings {
  if (!body || typeof body !== 'object' || !('UTR' in body) || !body.UTR || typeof body.UTR !== 'object') {
    throw new BadGatewayException('UTR returned an invalid ratings response')
  }
  const data = body.UTR as Record<string, unknown>
  const rating = (key: string): number | null => {
    const value = data[key]
    if (value === null) return null
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 16.5) {
      throw new BadGatewayException('UTR returned an invalid rating')
    }
    return value
  }
  if (data.Estimated !== null && typeof data.Estimated !== 'string') {
    throw new BadGatewayException('UTR returned an invalid estimated rating')
  }
  return {
    source, fetchedAt: new Date().toISOString(),
    singles: rating('Singles'), doubles: rating('Doubles'),
    unverifiedSingles: rating('UnverifiedSingles'), unverifiedDoubles: rating('UnverifiedDoubles'),
    estimated: data.Estimated as string | null,
  }
}

export class MockUtrProvider implements UtrProvider {
  async getRatings(): Promise<UtrRatings> { return mapRatings(sample, 'mock') }
}

export class EngageUtrProvider implements UtrProvider {
  constructor(private readonly baseUrl: string) {
    const url = new URL(baseUrl)
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
      throw new Error('UTR_API_BASE_URL must be an HTTPS URL without credentials, query or fragment')
    }
  }

  async getRatings(accessToken?: string): Promise<UtrRatings> {
    if (!accessToken) throw new ServiceUnavailableException('UTR account is not connected')
    try {
      const response = await fetch(`${this.baseUrl.replace(/\/$/, '')}/members/ratings`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(10000), redirect: 'error',
      })
      if (!response.ok) {
        // Do not expose provider bodies or credentials to callers.
        const message = response.status === 401 ? 'UTR connection expired or was revoked'
          : response.status === 403 ? 'UTR ratings permission is required'
          : response.status === 429 ? 'UTR request limit reached; try again later'
          : 'UTR is temporarily unavailable'
        throw new ServiceUnavailableException(message)
      }
      return mapRatings(await response.json(), 'utr')
    } catch (error) {
      if (error instanceof HttpException) throw error
      throw new ServiceUnavailableException('Could not retrieve UTR ratings')
    }
  }
}
