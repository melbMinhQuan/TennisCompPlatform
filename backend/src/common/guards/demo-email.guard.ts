import { CanActivate, ForbiddenException, Injectable } from '@nestjs/common'

/**
 * Player data is looked up by an email in the query string. That is a local
 * showcase, not authenticated ownership, so it is refused in production.
 */
@Injectable()
export class DemoEmailGuard implements CanActivate {
  canActivate(): boolean {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException({ statusCode: 403, code: 'DEMO_DISABLED', message: 'Email-based player access is disabled in production' })
    }
    return true
  }
}
