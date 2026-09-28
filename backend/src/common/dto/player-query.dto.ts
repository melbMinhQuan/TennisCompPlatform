import { Transform } from 'class-transformer'
import { IsEmail, MaxLength } from 'class-validator'

/** Identifies the player for the local email-based demo; not an authenticated session. */
export class PlayerQueryDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'A valid email is required' })
  @MaxLength(254)
  email!: string
}
