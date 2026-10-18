import { BadRequestException, Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { AuthService } from './auth.service'

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body('email') email: unknown = '', @Body('password') password: unknown = '') {
    // A missing field is a failed login (as an empty form is); anything that is not text is a bad request.
    if (typeof email !== 'string' || typeof password !== 'string') {
      throw new BadRequestException({ statusCode: 400, message: 'Email and password must be text' })
    }
    return this.authService.login(email, password)
  }
}
