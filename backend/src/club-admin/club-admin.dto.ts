import { Transform } from 'class-transformer'
import {
  ArrayMaxSize, ArrayMinSize, IsArray, IsEmail, IsIn, IsISO8601, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, MaxLength,
} from 'class-validator'

const trimmed = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value)
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

export class CreateTeamDto {
  @IsUUID('all', { message: 'Choose a section' })
  sectionId!: string

  @Transform(trimmed)
  @IsString()
  @IsNotEmpty({ message: 'A team name is required' })
  @MaxLength(80)
  name!: string
}

export class AddTeamPlayersDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Choose at least one player' })
  @ArrayMaxSize(50)
  @IsUUID('all', { each: true })
  playerIds!: string[]
}

export class AssignManagerDto {
  @IsUUID('all', { message: 'Choose a player' })
  playerId!: string
}

export class CreatePlayerDto {
  @Transform(trimmed)
  @IsString()
  @IsNotEmpty({ message: 'A first name is required' })
  @MaxLength(80)
  firstName!: string

  @Transform(trimmed)
  @IsString()
  @IsNotEmpty({ message: 'A last name is required' })
  @MaxLength(80)
  lastName!: string

  @Matches(DATE_ONLY, { message: 'Date of birth must be YYYY-MM-DD' })
  @IsISO8601({ strict: true }, { message: 'Date of birth must be a real date' })
  dateOfBirth!: string

  @IsIn(['MALE', 'FEMALE', 'OTHER'])
  gender!: 'MALE' | 'FEMALE' | 'OTHER'
}

/**
 * Who the admin is looking for in the registry. Only the name is required;
 * date of birth and email rank the results but never rule anyone out.
 * `email` here is the person being searched for, not the admin: the admin is
 * identified by the separate demo `email` query parameter, so this one is
 * called `playerEmail`.
 */
export class RegistrySearchDto {
  @Transform(trimmed)
  @IsString()
  @IsNotEmpty({ message: 'A name is required' })
  @MaxLength(160)
  name!: string

  @IsOptional()
  @Matches(DATE_ONLY, { message: 'Date of birth must be YYYY-MM-DD' })
  @IsISO8601({ strict: true }, { message: 'Date of birth must be a real date' })
  dateOfBirth?: string

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'Email must be a valid address' })
  @MaxLength(254)
  playerEmail?: string
}
