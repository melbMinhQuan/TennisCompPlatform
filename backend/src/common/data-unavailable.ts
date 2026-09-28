import { HttpException, ServiceUnavailableException } from '@nestjs/common'

/**
 * Runs a database read and turns any failure that is not already an HTTP error
 * into a 503, so queries, connection details and credentials never leak.
 */
export async function readOrUnavailable<T>(operation: () => Promise<T>, message: string): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    if (error instanceof HttpException) throw error
    throw new ServiceUnavailableException({ statusCode: 503, code: 'DATA_UNAVAILABLE', message })
  }
}
