import { Body, Controller, Post } from '@nestjs/common'

const players: Record<string, string> = { john: 'admin', johnny: 'player' }

@Controller()
export class AppController {
  @Post('player-role')
  playerRole(@Body('name') name = '') {
    return { role: players[name.trim().toLowerCase()] ?? 'none' }
  }
}
