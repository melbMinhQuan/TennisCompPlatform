import { Transform, Type } from 'class-transformer'
import { IsEmail, IsIn, IsInt, IsOptional, IsString, IsUUID, Length, Max, MaxLength, Min, registerDecorator, ValidationArguments } from 'class-validator'

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

/** A real YYYY-MM-DD calendar date: 2026-02-30 is refused, not rolled over to March. */
function IsCalendarDate() {
  return (target: object, propertyName: string) => registerDecorator({
    name: 'isCalendarDate', target: target.constructor, propertyName,
    options: { message: `${propertyName} must be a valid YYYY-MM-DD date` },
    validator: {
      validate: (value: unknown) => typeof value === 'string' && DATE_ONLY.test(value) &&
        Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value,
    },
  })
}

/** On or after the date in another field of the same query, when both are given. */
function IsOnOrAfter(otherField: string) {
  return (target: object, propertyName: string) => registerDecorator({
    name: 'isOnOrAfter', target: target.constructor, propertyName, constraints: [otherField],
    options: { message: `${otherField} must be on or before ${propertyName}` },
    validator: {
      validate: (value: unknown, args: ValidationArguments) => {
        const other = (args.object as Record<string, unknown>)[otherField]
        return typeof value !== 'string' || typeof other !== 'string' || other <= value
      },
    },
  })
}

/** The query string of every player dashboard route. Only `email` is required. */
export class DashboardQueryDto {
  /** Identifies the player for the local email-based demo; not an authenticated session. */
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'A valid email is required' })
  @MaxLength(254)
  email!: string

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit must be an integer between 1 and 100' })
  @Min(1, { message: 'limit must be an integer between 1 and 100' })
  @Max(100, { message: 'limit must be an integer between 1 and 100' })
  limit = 20

  @IsOptional()
  @IsCalendarDate()
  from?: string

  @IsOptional()
  @IsCalendarDate()
  @IsOnOrAfter('from')
  to?: string

  @IsOptional()
  @IsIn(['upcoming', 'all'], { message: 'scope must be upcoming or all' })
  scope: 'upcoming' | 'all' = 'upcoming'

  @IsOptional()
  @IsUUID('all', { message: 'competitionId must be a UUID' })
  competitionId?: string

  @IsOptional()
  @IsString({ message: 'Invalid cursor' })
  @Length(1, 2048, { message: 'Invalid cursor' })
  cursor?: string

  @IsOptional()
  @IsIn(['SINGLES', 'DOUBLES'], { message: 'Invalid discipline' })
  discipline: 'SINGLES' | 'DOUBLES' = 'SINGLES'
}
