import { IsString } from 'class-validator'

const NOT_TEXT = 'Email and password must be text'

/**
 * The login form. A missing field counts as empty, so an empty form is a failed login (as it
 * is in the browser) rather than an error; anything that is not text is a bad request.
 */
export class LoginDto {
  @IsString({ message: NOT_TEXT })
  email = ''

  @IsString({ message: NOT_TEXT })
  password = ''
}
